import { WorkspaceRole } from '@/types'

const ROLES_STORAGE_KEY = 'kinetic_workspace_roles_v1'

const DEFAULT_ROLES: WorkspaceRole[] = [
  {
    id: 'role-fe-sr',
    name: 'Senior Frontend Engineer',
    department: 'Engineering',
    baseSalary: 125000,
    currency: 'USD',
    salaryPeriod: 'annual',
    overtimeMultiplier: 1.5,
    description: 'Responsible for leading client architecture, design systems, and frontend performance.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-be-lead',
    name: 'Backend Lead',
    department: 'Engineering',
    baseSalary: 140000,
    currency: 'USD',
    salaryPeriod: 'annual',
    overtimeMultiplier: 1.5,
    description: 'Architects cloud services, microservices, databases, and core business APIs.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-devops',
    name: 'DevOps & Cloud Engineer',
    department: 'Engineering',
    baseSalary: 135000,
    currency: 'USD',
    salaryPeriod: 'annual',
    overtimeMultiplier: 2.0,
    description: 'Manages CI/CD pipelines, container orchestration, Kubernetes, and infrastructure reliability.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-qa-auto',
    name: 'QA Automation Engineer',
    department: 'Engineering',
    baseSalary: 95000,
    currency: 'USD',
    salaryPeriod: 'annual',
    overtimeMultiplier: 1.5,
    description: 'Builds end-to-end automated testing suites and regression verification pipelines.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-designer',
    name: 'Lead Product Designer',
    department: 'Engineering',
    baseSalary: 115000,
    currency: 'USD',
    salaryPeriod: 'annual',
    overtimeMultiplier: 1.25,
    description: 'Directs user experience research, UI workflows, and design tokens.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-sys-arch',
    name: 'Systems Architect',
    department: 'Engineering',
    baseSalary: 160000,
    currency: 'USD',
    salaryPeriod: 'annual',
    overtimeMultiplier: 1.75,
    description: 'Defines high-level system architecture, security standards, and enterprise scalability.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
]

class RoleService {
  private getStoredRoles(): WorkspaceRole[] {
    const raw = localStorage.getItem(ROLES_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(DEFAULT_ROLES))
      return DEFAULT_ROLES
    }
    try {
      return JSON.parse(raw)
    } catch {
      return DEFAULT_ROLES
    }
  }

  private saveRoles(roles: WorkspaceRole[]): void {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles))
  }

  async getRoles(department?: string): Promise<WorkspaceRole[]> {
    await new Promise(r => setTimeout(r, 60))
    const list = this.getStoredRoles()
    if (!department || department.toLowerCase() === 'all') {
      return list
    }
    return list.filter(
      r => !r.department || r.department.toLowerCase() === department.toLowerCase()
    )
  }

  async getRoleById(id: string): Promise<WorkspaceRole | undefined> {
    await new Promise(r => setTimeout(r, 40))
    return this.getStoredRoles().find(r => r.id === id)
  }

  async createRole(data: Omit<WorkspaceRole, 'id' | 'updatedAt'>): Promise<WorkspaceRole> {
    await new Promise(r => setTimeout(r, 80))
    const roles = this.getStoredRoles()
    const newRole: WorkspaceRole = {
      ...data,
      id: `role-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      updatedAt: new Date().toISOString().split('T')[0],
    }
    roles.unshift(newRole)
    this.saveRoles(roles)
    return newRole
  }

  async updateRole(id: string, updates: Partial<WorkspaceRole>): Promise<WorkspaceRole> {
    await new Promise(r => setTimeout(r, 80))
    const roles = this.getStoredRoles()
    const index = roles.findIndex(r => r.id === id)
    if (index === -1) {
      throw new Error(`Role with id ${id} not found`)
    }
    roles[index] = {
      ...roles[index],
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0],
    }
    this.saveRoles(roles)
    return roles[index]
  }

  async deleteRole(id: string): Promise<boolean> {
    await new Promise(r => setTimeout(r, 80))
    const roles = this.getStoredRoles()
    const filtered = roles.filter(r => r.id !== id)
    this.saveRoles(filtered)
    return true
  }
}

export const roleService = new RoleService()
