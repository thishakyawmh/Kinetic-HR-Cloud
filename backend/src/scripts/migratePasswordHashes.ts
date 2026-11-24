import bcrypt from 'bcryptjs'
import { getTenantContainer, queryTenantItems } from '../config/cosmos'

const BCRYPT_HASH = /^\$2[aby]\$/

async function migrateTenantPasswords() {
  const tenantId = process.env.TENANT_ID?.trim()
  if (!tenantId) {
    throw new Error('Set TENANT_ID to the tenant you have backed up before running this migration')
  }

  const users = await queryTenantItems<any>(
    'users',
    tenantId,
    'SELECT * FROM c WHERE c.tenantId = @tenantId AND IS_DEFINED(c.password)',
    [{ name: '@tenantId', value: tenantId }],
  )

  const usersContainer = getTenantContainer('users')
  let migrated = 0
  let alreadyHashed = 0

  for (const user of users) {
    const legacyPassword = typeof user.password === 'string' ? user.password : ''

    if (user.passwordHash) {
      delete user.password
      await usersContainer.item(user.id, tenantId).replace(user)
      alreadyHashed += 1
      continue
    }

    if (!legacyPassword) continue

    user.passwordHash = BCRYPT_HASH.test(legacyPassword)
      ? legacyPassword
      : await bcrypt.hash(legacyPassword, 12)

    delete user.password
    await usersContainer.item(user.id, tenantId).replace(user)
    migrated += 1
  }

  console.log(`Tenant ${tenantId}: migrated ${migrated} password(s); removed legacy plaintext from ${alreadyHashed} already-hashed record(s).`)
}

migrateTenantPasswords().catch((error) => {
  console.error('Password migration failed:', error.message)
  process.exitCode = 1
})
