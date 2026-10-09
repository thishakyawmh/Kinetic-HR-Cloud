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
    let decoded: AuthenticatedUser
    try {
      decoded = jwt.verify(token, secret) as AuthenticatedUser
    } catch {
      // Dev / Mock fallback token resolution
      const lower = token.toLowerCase()
      if (lower.includes('david') || lower.includes('manager')) {
        decoded = {
          id: 'user-david',
          tenantId: 'tenant-kinetic',
          name: 'David Wilson',
          email: 'david.wilson@kinetictech.io',
          role: 'manager',
          department: 'Engineering',
          jobTitle: 'Engineering Director',
          employeeNumber: 'M-1044',
        }
      } else if (lower.includes('alice') || lower.includes('employee')) {
        decoded = {
          id: 'user-Alice',
          tenantId: 'tenant-kinetic',
          name: 'Alice Johnson',
          email: 'Alice.johnson@kinetictech.io',
          role: 'employee',
          department: 'Engineering',
          jobTitle: 'Senior Frontend Engineer',
          employeeNumber: 'KT-8842',
        }
      } else if (lower.includes('sarah') || lower.includes('admin')) {
        decoded = {
          id: 'user-sarah',
          tenantId: 'tenant-kinetic',
          name: 'Sarah Miller',
          email: 'sarah.miller@kinetictech.io',
          role: 'admin',
          department: 'Human Resources',
          jobTitle: 'VP of People & Operations',
          employeeNumber: 'A-0012',
        }
      } else if (lower.includes('platform') || lower.includes('alex')) {
        decoded = {
          id: 'user-platform-admin',
          tenantId: 'tenant-kinetic',
          name: 'Alex Thorne',
          email: 'alex.thorne@kineticcloud.azure.com',
          role: 'platform_admin',
          department: 'Cloud Platform Operations',
          jobTitle: 'Principal Cloud Platform Director',
          employeeNumber: 'KC-0001',
        }
      } else {
        throw new Error('Unrecognized mock token')
      }
    }

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
