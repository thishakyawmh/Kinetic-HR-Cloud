import { Container } from '@azure/cosmos'
import fs from 'fs'
import path from 'path'
import { buildSeedCollections } from './seedDataset'

const LOCAL_DB_FILE = path.resolve(__dirname, '../../../data/local-db.json')

function loadLocalDataFromDisk(): Record<string, any[]> {
  try {
    const dir = path.dirname(LOCAL_DB_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    if (fs.existsSync(LOCAL_DB_FILE)) {
      const content = fs.readFileSync(LOCAL_DB_FILE, 'utf-8')
      const parsed = JSON.parse(content)
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        return parsed
      }
    }
  } catch (err: any) {
    console.warn(`Could not read local-db.json, falling back to seed generator: ${err?.message || err}`)
  }

  const seed = buildSeedCollections()
  saveLocalDataToDisk(seed)
  return seed
}

function saveLocalDataToDisk(data?: Record<string, any[]>): void {
  try {
    const dataToSave = data || LOCAL_MEMORY_DATA
    const dir = path.dirname(LOCAL_DB_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8')
  } catch (err: any) {
    console.warn(`Failed to save local-db.json: ${err?.message || err}`)
  }
}

const LOCAL_MEMORY_DATA: Record<string, any[]> = loadLocalDataFromDisk()

function applySelectProjection(query: string, rows: any[]): any[] {
  const match = query.match(/^\s*SELECT\s+(.+?)\s+FROM\s+c\b/i)
  if (!match) return rows
  const fieldsClause = match[1].trim()
  if (fieldsClause === '*') return rows

  const fields = fieldsClause
    .split(',')
    .map(part => part.trim().replace(/^c\./i, ''))
    .filter(Boolean)

  if (fields.length === 0) return rows

  return rows.map(item => {
    const projected: Record<string, any> = {}
    for (const field of fields) {
      if (field in item) {
        projected[field] = item[field]
      }
    }
    return projected
  })
}

export function createMockContainer(name: string): Container {
  if (!LOCAL_MEMORY_DATA[name]) {
    LOCAL_MEMORY_DATA[name] = []
  }
  const store = LOCAL_MEMORY_DATA[name]

  const matchesPartition = (item: any, partitionKey?: string) =>
    !partitionKey || !item.tenantId || item.tenantId === partitionKey

  return {
    items: {
      query: (querySpec: any) => ({
        fetchAll: async () => {
          const rawQuery = typeof querySpec === 'string' ? querySpec : (querySpec?.query || '')
          const qStr = rawQuery.toLowerCase()
          let results = [...store]

          if (qStr.includes('c.status != "cancelled"') || qStr.includes("c.status != 'cancelled'")) {
            results = results.filter((item: any) => item.status !== 'cancelled')
          }
          if (qStr.includes('c.status = "cancelled"') || qStr.includes("c.status = 'cancelled'")) {
            results = results.filter((item: any) => item.status === 'cancelled')
          }

          const params = Array.isArray(querySpec?.parameters) ? querySpec.parameters : []
          const getParam = (paramName: string) => params.find((p: any) => p.name === paramName)?.value

          const tenantVal = getParam('@tenantId') ?? getParam('@t')
          if (tenantVal !== undefined) {
            const tVal = String(tenantVal).toLowerCase()
            results = results.filter((item: any) => item.tenantId && item.tenantId.toLowerCase() === tVal)
          }

          const idVal = getParam('@id')
          if (idVal !== undefined) {
            const val = String(idVal).toLowerCase()
            results = results.filter((item: any) => item.id && String(item.id).toLowerCase() === val)
          }

          const empParam = getParam('@empId')
          if (empParam !== undefined) {
            const eVal = String(empParam).toLowerCase()
            results = results.filter((u: any) =>
              (u.employeeNumber && u.employeeNumber.toLowerCase() === eVal) ||
              (u.idNumber && u.idNumber.toLowerCase() === eVal) ||
              (u.email && u.email.toLowerCase() === eVal) ||
              (u.id && u.id.toLowerCase() === eVal) ||
              (u.employeeId && u.employeeId.toLowerCase() === eVal) ||
              (u.role && u.role.toLowerCase() === eVal) ||
              (u.name && u.name.toLowerCase().includes(eVal))
            )
          }

          const userParam = getParam('@userId')
          if (userParam !== undefined) {
            const uVal = String(userParam).toLowerCase()
            results = results.filter((item: any) =>
              (item.userId && item.userId.toLowerCase() === uVal) ||
              (item.recipientId && item.recipientId.toLowerCase() === uVal) ||
              (item.assignedBackupId && item.assignedBackupId.toLowerCase() === uVal) ||
              (item.managerId && item.managerId.toLowerCase() === uVal) ||
              (item.employeeId && item.employeeId.toLowerCase() === uVal) ||
              (item.id && item.id.toLowerCase() === uVal)
            )
          }

          const mgrParam = getParam('@managerId')
          if (mgrParam !== undefined) {
            const mVal = String(mgrParam).toLowerCase()
            results = results.filter((item: any) => item.managerId && item.managerId.toLowerCase() === mVal)
          }

          const empIdParam = getParam('@employeeId')
          if (empIdParam !== undefined) {
            const eIdVal = String(empIdParam).toLowerCase()
            results = results.filter((item: any) => item.employeeId && item.employeeId.toLowerCase() === eIdVal)
          }

          const orgParam = getParam('@orgId')
          if (orgParam !== undefined) {
            const val = String(orgParam).toLowerCase()
            results = results.filter(
              (o: any) => (o.code && o.code.toLowerCase() === val) || (o.id && o.id.toLowerCase() === val)
            )
          }

          const dateParam = getParam('@date')
          if (dateParam !== undefined) {
            const dVal = String(dateParam)
            results = results.filter((item: any) => item.date === dVal)
          }

          return { resources: applySelectProjection(rawQuery, results) }
        },
      }),
      create: async (item: any) => {
        store.push(item)
        saveLocalDataToDisk()
        return { resource: item }
      },
      upsert: async (item: any) => {
        const idx = store.findIndex((i: any) => i.id === item.id)
        if (idx >= 0) store[idx] = item
        else store.push(item)
        saveLocalDataToDisk()
        return { resource: item }
      },
    },
    item: (id: string, partitionKey?: string) => ({
      read: async () => {
        const item = store.find((i: any) => i.id === id && matchesPartition(i, partitionKey))
        return { resource: item ? { ...item } : null }
      },
      replace: async (newItem: any) => {
        const idx = store.findIndex((i: any) => i.id === id && matchesPartition(i, partitionKey))
        if (idx >= 0) store[idx] = newItem
        else store.push(newItem)
        saveLocalDataToDisk()
        return { resource: newItem }
      },
      delete: async () => {
        const idx = store.findIndex((i: any) => i.id === id && matchesPartition(i, partitionKey))
        if (idx >= 0) store.splice(idx, 1)
        saveLocalDataToDisk()
        return { resource: {} }
      },
    }),
  } as unknown as Container
}
