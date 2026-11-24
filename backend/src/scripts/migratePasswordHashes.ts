import bcrypt from 'bcryptjs'
import { getTenantContainer } from '../config/cosmos'

const BCRYPT_HASH = /^\$2[aby]\$/

async function migratePasswordHashes() {
  const usersContainer = getTenantContainer('users')
  const { resources } = await usersContainer.items
    .query('SELECT * FROM c WHERE IS_DEFINED(c.password)')
    .fetchAll()

  let migrated = 0
  let alreadyHashed = 0

  for (const user of resources) {
    const legacyPassword = typeof user.password === 'string' ? user.password : ''

    if (user.passwordHash) {
      delete user.password
      await usersContainer.items.upsert(user)
      alreadyHashed += 1
      continue
    }

    if (!legacyPassword) continue

    user.passwordHash = BCRYPT_HASH.test(legacyPassword)
      ? legacyPassword
      : await bcrypt.hash(legacyPassword, 12)

    delete user.password
    await usersContainer.items.upsert(user)
    migrated += 1
  }

  console.log(`Password migration complete. Hashed: ${migrated}; already hashed and plaintext removed: ${alreadyHashed}.`)
}

migratePasswordHashes().catch((error) => {
  console.error('Password migration failed:', error.message)
  process.exitCode = 1
})
