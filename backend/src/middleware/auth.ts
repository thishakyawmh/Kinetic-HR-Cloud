import { HttpRequest, HttpResponseInit } from '@azure/functions'
import jwt from 'jsonwebtoken'

export interface AuthenticatedUser {
  id: string
  tenantId: string
  role: 'employee' | 'manager' | 'admin' | 'platform_admin'
  email: string
  name: string
}

export function signToken(user: AuthenticatedUser): string {
  const secret = process.env.JWT_SECRET || 'kinetic-default-dev-secret-key-change-in-prod'
  const expiresIn = process.env.JWT_EXPIRATION || '7d'
  return jwt.sign(user, secret, { expiresIn: expiresIn as any })
}

export function authenticateRequest(
  request: HttpRequest,
  requiredRole?: 'employee' | 'manager' | 'admin' | 'platform_admin'
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

  const token = authHeader.substring(7)
  const secret = process.env.JWT_SECRET || 'kinetic-default-dev-secret-key-change-in-prod'

  try {
    const decoded = jwt.verify(token, secret) as AuthenticatedUser

    // Enforce Tenant Boundary:
    // If request supplies an X-Tenant-Id header, verify it matches the user's token tenantId
    const headerTenantId = request.headers.get('x-tenant-id')
    if (headerTenantId && decoded.role !== 'platform_admin' && decoded.tenantId !== headerTenantId) {
      return {
        errorResponse: {
          status: 403,
          jsonBody: { error: 'Cross-tenant access prohibited. Tenant ID mismatch.' },
        },
      }
    }

    // Role check if required
    if (requiredRole) {
      const roleHierarchy: Record<string, number> = {
        employee: 1,
        manager: 2,
        admin: 3,
        platform_admin: 4,
      }
      if ((roleHierarchy[decoded.role] || 0) < (roleHierarchy[requiredRole] || 0)) {
        return {
          errorResponse: {
            status: 403,
            jsonBody: { error: `Forbidden: requires ${requiredRole} privileges` },
          },
        }
      }
    }

    return { user: decoded }
  } catch (err) {
    return {
      errorResponse: {
        status: 401,
        jsonBody: { error: 'Invalid or expired authentication token' },
      },
    }
  }
}
