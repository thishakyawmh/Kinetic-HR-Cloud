const test = require('node:test')
const assert = require('node:assert/strict')
const { signToken, authenticateRequest } = require('../dist/src/middleware/auth.js')

const previousEnv = {
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_ISSUER: process.env.JWT_ISSUER,
  ENABLE_MOCK_AUTH: process.env.ENABLE_MOCK_AUTH,
  NODE_ENV: process.env.NODE_ENV,
}

function makeRequest(token, tenantId) {
  const headers = new Map()
  if (token !== undefined) headers.set('authorization', `Bearer ${token}`)
  if (tenantId !== undefined) headers.set('x-tenant-id', tenantId)
  return { headers: { get: (name) => headers.get(name) || null } }
}

const user = {
  id: 'user-test-1',
  tenantId: 'tenant-test',
  role: 'employee',
  email: 'employee@example.test',
  name: 'Test Employee',
}

test.before(() => {
  process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-characters'
  process.env.JWT_ISSUER = 'kinetic-hr-cloud-test'
  process.env.ENABLE_MOCK_AUTH = 'false'
  process.env.NODE_ENV = 'test'
})

test.after(() => {
  for (const [key, value] of Object.entries(previousEnv)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

test('accepts a valid signed token with expected claims', () => {
  const result = authenticateRequest(makeRequest(signToken(user), user.tenantId))
  assert.equal(result.user.id, user.id)
  assert.equal(result.user.tenantId, user.tenantId)
})

test('rejects a missing bearer token', () => {
  const result = authenticateRequest(makeRequest(undefined))
  assert.equal(result.errorResponse.status, 401)
})

test('rejects invalid tokens even when they contain privileged words by default', () => {
  const result = authenticateRequest(makeRequest('admin'))
  assert.equal(result.errorResponse.status, 401)
})

test('rejects cross-tenant headers', () => {
  const result = authenticateRequest(makeRequest(signToken(user), 'another-tenant'))
  assert.equal(result.errorResponse.status, 403)
})

test('enforces the required role hierarchy', () => {
  const result = authenticateRequest(makeRequest(signToken(user)), 'admin')
  assert.equal(result.errorResponse.status, 403)
})

test('does not allow mock identity fallback in production', () => {
  process.env.ENABLE_MOCK_AUTH = 'true'
  process.env.NODE_ENV = 'production'
  const result = authenticateRequest(makeRequest('admin'))
  assert.equal(result.errorResponse.status, 401)
})

test('allows mock identities only when explicitly enabled outside production', () => {
  process.env.ENABLE_MOCK_AUTH = 'true'
  process.env.NODE_ENV = 'test'
  const result = authenticateRequest(makeRequest('admin'))
  assert.equal(result.user.role, 'admin')
})
