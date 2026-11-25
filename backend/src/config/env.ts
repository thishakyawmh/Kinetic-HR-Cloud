import fs from 'fs'
import path from 'path'

export interface LoadSettingsOptions {
  fallbackToExample?: boolean
  overwrite?: boolean
}

function findSettingsFile(fileName: string): string | null {
  const candidates = [
    path.resolve(process.cwd(), fileName),
    path.resolve(process.cwd(), 'backend', fileName),
    path.resolve(__dirname, '../../', fileName),
    path.resolve(__dirname, '../../../', fileName),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }
  return null
}

/**
 * Loads Azure Functions local.settings.json Values into process.env.
 * Existing process.env values are preserved unless overwrite is true.
 */
export function loadLocalSettings(options: LoadSettingsOptions = {}): Record<string, string> {
  const settingsPath =
    findSettingsFile('local.settings.json') ||
    (options.fallbackToExample ? findSettingsFile('local.settings.json.example') : null)

  if (!settingsPath) {
    return {}
  }

  try {
    const raw = fs.readFileSync(settingsPath, 'utf-8')
    const parsed = JSON.parse(raw)
    const values: Record<string, unknown> = parsed?.Values || {}
    const loaded: Record<string, string> = {}

    for (const [key, val] of Object.entries(values)) {
      if (val === undefined || val === null) continue
      const strVal = String(val)
      loaded[key] = strVal
      if (options.overwrite || !process.env[key]) {
        process.env[key] = strVal
      }
    }

    return loaded
  } catch (err: any) {
    console.warn(`Could not parse ${path.basename(settingsPath)}: ${err?.message || err}`)
    return {}
  }
}
