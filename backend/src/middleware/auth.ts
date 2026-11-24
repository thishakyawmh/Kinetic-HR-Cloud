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

const ROLE_LEVEL: Record<AuthenticatedUser['role'], number> = {
  employee: 1,
  manager: 2,
  admin: 3,
  platform_admin: 4,
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters')
  }
  return secret
}

export function signToken(user: AuthenticatedUser): string {
  const expiresIn = process.env.JWT_EXPIRATION || '7d'
  return jwt.sign(user, getJwtSecret(), { expiresIn: expiresIn as any })
}

export function authenticateRequest(
  request: HttpRequest,
  requiredRole?: AuthenticatedUser['role']
): { user?: AuthenticatedUser; errorResponse?: HttpResponseInit } {
  const authHeader = request.headers.get('authorization')
  const match = authHeader?.match(/^Bearer\s+(\S+)$/i)

  if (!match) {
    return {
      errorResponse: {
        status: 401,
        jsonBody: { error: 'Missing or malformed Authorization header' },
      },
    }
  }

  try {
    const decoded = jwt.verify(match[1], getJwtSecret(), {
      algorithms: ['HS256'],
    }) as jwt.JwtPayload & Partial<AuthenticatedUser>

    const validRoles = Object.keys(ROLE_LEVEL)
    if (
      typeof decoded.id !== 'string' ||
      typeof decoded.tenantId !== 'string' ||
      typeof decoded.email !== 'string' ||
      typeof decoded.name !== 'string' ||
      typeof decoded.role !== 'string' ||
      !validRoles.includes(decoded.role)
    ) {
      return {
        errorResponse: {
          status: 401,
          jsonBody: { error: 'Invalid authentication token claims' },
        },
      }
    }

    const user = decoded as AuthenticatedUser
    const headerTenantId = request.headers.get('x-tenant-id')

    if (headerTenantId && user.role !== 'platform_admin' && user.tenantId !== headerTenantId) {
      return {
        errorResponse: {
          status: 403,
          jsonBody: { error: 'Cross-tenant access prohibited. Tenant ID mismatch.' },
        },
      }
    }

    if (requiredRole && ROLE_LEVEL[user.role] < ROLE_LEVEL[requiredRole]) {
      return {
        errorResponse: {
          status: 403,
          jsonBody: { error: `Forbidden: requires ${requiredRole} privileges` },
        },
      }
    }

    return { user }
  } catch {
    return {
      errorResponse: {
        status: 401,
        jsonBody: { error: 'Invalid or expired authentication token' },
      },
    }
  }
}
