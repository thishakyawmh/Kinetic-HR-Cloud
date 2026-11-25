import { HttpRequest, HttpResponseInit } from '@azure/functions'
import jwt from 'jsonwebtoken'

export interface AuthenticatedUser {
  id: string
  tenantId: string
  role: 'employee' | 'manager' | 'admin' | 'platform_admin'
  email: string
  name: string
  department?: string
  jobTitle?: string
  employeeNumber?: string
  managerId?: string
  managerName?: string
  hireDate?: string
  phone?: string
}

const DEFAULT_DEV_SECRET = 'kinetic-default-dev-secret-key-change-in-prod'

const ROLE_HIERARCHY: Record<AuthenticatedUser['role'], number> = {
  employee: 1,
  manager: 2,
  admin: 3,
  platform_admin: 4,
}

const DEV_MOCK_PERSONAS: Array<{ tokens: string[]; user: AuthenticatedUser }> = [
  {
    tokens: ['platform', 'alex', 'kc-0001'],
    user: {
      id: 'user-platform-admin',
      tenantId: 'tenant-sampath',
      name: 'Alex Thorne',
      email: 'alex.thorne@kineticcloud.azure.com',
      role: 'platform_admin',
      department: 'Cloud Platform Operations',
      jobTitle: 'Principal Cloud Platform Director',
      employeeNumber: 'KC-0001',
    },
  },
  {
    tokens: ['admin', 'sarah', 'kasun', 'a-1001'],
    user: {
      id: 'user-sb-admin',
      tenantId: 'tenant-sampath',
      name: 'Kasun Perera',
      email: 'kasun.perera@sampath.lk',
      role: 'admin',
      department: 'People Operations & HR',
      jobTitle: 'Head of People Operations',
      employeeNumber: 'A-1001',
    },
  },
  {
    tokens: ['keells', 'priyantha', 'user-ks-mgr-1'],
    user: {
      id: 'user-ks-mgr-1',
      tenantId: 'tenant-keells',
      name: 'Priyantha Rathnayake',
      email: 'priyantha.rathnayake@keells.com',
      role: 'manager',
      department: 'Store Operations & Front End',
      jobTitle: 'Store General Manager (Crescat)',
      employeeNumber: 'M-2001',
    },
  },
  {
    tokens: ['singer', 'ashen', 'user-sn-mgr-1'],
    user: {
      id: 'user-sn-mgr-1',
      tenantId: 'tenant-singer',
      name: 'Ashen Senanayake',
      email: 'ashen.senanayake@singersl.com',
      role: 'manager',
      department: 'Showroom Retail Sales',
      jobTitle: 'Mega Store Manager (Duplication Road)',
      employeeNumber: 'M-3001',
    },
  },
  {
    tokens: ['dinesh', 'dinuka', 'user-sb-mgr-1', 'mgr', 'manager', 'm-1001', 'david'],
    user: {
      id: 'user-dinuka',
      tenantId: 'tenant-sampath',
      name: 'Dinuka Perera',
      email: 'dinuka.perera@sampath.lk',
      role: 'manager',
      department: 'Retail Banking & Branches',
      jobTitle: 'Senior Credit Officer',
      employeeNumber: 'M-1001',
    },
  },
  {
    tokens: ['alice', 'nalaka', 'user-sb-emp-1007', 'employee', 'emp'],
    user: {
      id: 'user-sb-emp-1007',
      tenantId: 'tenant-sampath',
      name: 'Nalaka Perera',
      email: 'nalaka.perera@sampath.lk',
      role: 'employee',
      department: 'Retail Banking & Branches',
      jobTitle: 'Senior Personal Banking Officer',
      employeeNumber: 'SB-1007',
      managerId: 'user-dinuka',
      managerName: 'Dinuka Perera',
    },
  },
]

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim()
  const isProd = process.env.NODE_ENV === 'production' || (process.env.AZURE_MODE || '').toLowerCase() === 'live'
  if (isProd && (!secret || secret === DEFAULT_DEV_SECRET)) {
    throw new Error('JWT_SECRET must be configured in production or live Azure mode.')
  }
  return secret || DEFAULT_DEV_SECRET
}

function isDevMockAuthAllowed(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    (process.env.AZURE_MODE || '').toLowerCase() !== 'live'
  )
}

function resolveDevMockUser(token: string): AuthenticatedUser | null {
  if (!isDevMockAuthAllowed()) return null
  if (!token.startsWith('mock-') && !token.startsWith('entra-jwt-bearer-')) {
    return null
  }

  const lower = token.toLowerCase()
  const match = DEV_MOCK_PERSONAS.find(entry => entry.tokens.some(t => lower.includes(t)))
  if (match) return match.user

  if (token.startsWith('entra-jwt-bearer-')) {
    return DEV_MOCK_PERSONAS[4].user
  }
  return null
}

export function signToken(user: AuthenticatedUser): string {
  const secret = getJwtSecret()
  const expiresIn = process.env.JWT_EXPIRATION || '7d'
  return jwt.sign(user, secret, { expiresIn: expiresIn as any })
}

export function authenticateRequest(
  request: HttpRequest,
  requiredRole?: AuthenticatedUser['role']
): { user?: AuthenticatedUser; errorResponse?: HttpResponseInit } {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      errorResponse: {
        status: 401,
        jsonBody: { error: 'Missing or malformed Authorization header' },
      },
    }
  }

  const token = authHeader.substring(7).trim()
  if (!token) {
    return {
      errorResponse: {
        status: 401,
        jsonBody: { error: 'Missing authentication token' },
      },
    }
  }

  try {
    const secret = getJwtSecret()
    let decoded: AuthenticatedUser
    try {
      decoded = jwt.verify(token, secret) as AuthenticatedUser
    } catch {
          const mockUser = resolveDevMockUser(token)
      if(!mockUser) {
            return {
              errorResponse: {
                status: 401,
                jsonBody: { error: 'Invalid or expired authentication token' },
              },
            }
        }
        decoded = mockUser
      }

      const headerTenantId = request.headers.get('x-tenant-id')
      if (headerTenantId && decoded.role !== 'platform_admin' && decoded.tenantId !== headerTenantId) {
        return {
          errorResponse: {
            status: 403,
            jsonBody: { error: 'Cross-tenant access prohibited. Tenant ID mismatch.' },
          },
        }
      }

      if (requiredRole) {
          if ((ROLE_HIERARCHY[decoded.role] || 0) < (ROLE_HIERARCHY[requiredRole] || 0)) {
            return {
              errorResponse: {
                status: 403,
                jsonBody: { error: `Forbidden: requires ${requiredRole} privileges` },
              },
            }
          }
        }

        return { user: decoded }
      } catch {
        return {
          errorResponse: {
            status: 401,
            jsonBody: { error: 'Invalid or expired authentication token' },
          },
        }
      }
    }
