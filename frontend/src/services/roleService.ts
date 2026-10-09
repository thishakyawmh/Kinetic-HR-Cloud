import { WorkspaceRole } from '@/types'
import { appDataStore } from './storage'

const ROLES_STORAGE_KEY = 'kinetic_workspace_roles_v2'

export const DEFAULT_ROLES: WorkspaceRole[] = [
  // Retail Banking & Branches (Sampath Bank)
  {
    id: 'role-sb-bm',
    name: 'Branch Manager',
    department: 'Retail Banking & Branches',
    baseSalary: 285000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 1.5,
    description: 'Manages branch operations, statutory compliance, audit integrity, and service delivery.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-sb-cro',
    name: 'Customer Relationship Officer',
    department: 'Retail Banking & Branches',
    baseSalary: 165000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 1.5,
    description: 'Handles high-value accounts, retail loan products, term deposits, and client onboarding.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-sb-cashier',
    name: 'Cashier & Counter Specialist',
    department: 'Retail Banking & Branches',
    baseSalary: 115000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 1.5,
    description: 'Processes cash transactions, clearing cheques, vault balancing, and currency verification.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-sb-ops',
    name: 'Operations Executive',
    department: 'Retail Banking & Branches',
    baseSalary: 135000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 1.5,
    description: 'Supervises day-end branch balancing, KYC compliance, and branch administrative workflows.',
    updatedAt: new Date().toISOString().split('T')[0],
  },

  // Corporate Credit & Risk (Sampath Bank)
  {
    id: 'role-sb-ca',
    name: 'Credit Analyst',
    department: 'Corporate Credit & Risk',
    baseSalary: 185000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 1.5,
    description: 'Evaluates commercial loan proposals, cash flow projections, and credit risk profiles.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-sb-sba',
    name: 'Senior Banking Assistant',
    department: 'Corporate Credit & Risk',
    baseSalary: 130000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 1.5,
    description: 'Assists with documentation, facility renewals, collateral inspection, and credit files.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-sb-tso',
    name: 'Trade Services Officer',
    department: 'Corporate Credit & Risk',
    baseSalary: 160000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 1.5,
    description: 'Processes letters of credit (LC), bank guarantees, and export-import financing.',
    updatedAt: new Date().toISOString().split('T')[0],
  },

  // Store Operations & Front End (Keells Supermarkets)
  {
    id: 'role-kl-sm',
    name: 'Store Manager',
    department: 'Store Operations & Front End',
    baseSalary: 240000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 1.5,
    description: 'Directs retail outlet performance, store shrink control, customer satisfaction, and staff scheduling.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-kl-ffs',
    name: 'Fresh Food Supervisor',
    department: 'Store Operations & Front End',
    baseSalary: 120000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 1.5,
    description: 'Oversees produce grading, cold storage compliance, bakery hygiene, and perishable turnover.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-kl-inv',
    name: 'Inventory Specialist',
    department: 'Store Operations & Front End',
    baseSalary: 105000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 1.5,
    description: 'Tracks backroom stock levels, goods received notes (GRN), and FIFO inventory rotation.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-kl-pos',
    name: 'POS Checkout Team Lead',
    department: 'Store Operations & Front End',
    baseSalary: 95000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 1.5,
    description: 'Manages cashier cash floats, peak checkout speed, loyalty redemption, and till reconciliation.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-kl-csr',
    name: 'Customer Service Representative',
    department: 'Store Operations & Front End',
    baseSalary: 85000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 1.5,
    description: 'Assists floor shoppers, product inquiries, refund vouchers, and Nexus loyalty queries.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-kl-cold',
    name: 'Cold Chain Coordinator',
    department: 'Store Operations & Front End',
    baseSalary: 110000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 1.5,
    description: 'Monitors chiller temperature logs, dairy/meat refrigeration, and HACCP compliance.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-kl-sra',
    name: 'Senior Retail Associate',
    department: 'Store Operations & Front End',
    baseSalary: 80000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 1.5,
    description: 'Shelf replenishment, planogram compliance, price tag auditing, and customer assistance.',
    updatedAt: new Date().toISOString().split('T')[0],
  },

  // Showroom Retail Sales (Singer Sri Lanka PLC)
  {
    id: 'role-sg-sm',
    name: 'Showroom Manager',
    department: 'Showroom Retail Sales',
    baseSalary: 250000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 1.5,
    description: 'Achieves showroom revenue targets, staff leadership, stock security, and customer experience.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-sg-ssc',
    name: 'Senior Showroom Sales Consultant',
    department: 'Showroom Retail Sales',
    baseSalary: 115000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 1.5,
    description: 'Provides consumer electronics consultations, product demos, and warranty enrollments.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-sg-tech',
    name: 'Appliance Technical Specialist',
    department: 'Showroom Retail Sales',
    baseSalary: 125000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 1.5,
    description: 'Performs pre-delivery testing, electronic diagnostics, and appliance installation guidance.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-sg-hp',
    name: 'Hire Purchase Recovery Officer',
    department: 'Showroom Retail Sales',
    baseSalary: 110000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 1.5,
    description: 'Verifies customer installment creditworthiness, promissory agreements, and payment collections.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-sg-ces',
    name: 'Consumer Electronics Specialist',
    department: 'Showroom Retail Sales',
    baseSalary: 105000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 1.5,
    description: 'Smart TV, audio system, and kitchen appliance product expertise and cross-selling.',
    updatedAt: new Date().toISOString().split('T')[0],
  },

  // Engineering & Technology
  {
    id: 'role-fe-sr',
    name: 'Senior Frontend Engineer',
    department: 'Core Banking IT Systems',
    baseSalary: 350000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 1.5,
    description: 'Responsible for leading client architecture, design systems, and frontend performance.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-be-lead',
    name: 'Backend Lead',
    department: 'Core Banking IT Systems',
    baseSalary: 420000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 1.5,
    description: 'Architects cloud services, microservices, databases, and core business APIs.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'role-devops',
    name: 'DevOps & Cloud Engineer',
    department: 'Core Banking IT Systems',
    baseSalary: 380000,
    currency: 'LKR',
    salaryPeriod: 'monthly',
    overtimeMultiplier: 2.0,
    description: 'Manages CI/CD pipelines, container orchestration, Kubernetes, and infrastructure reliability.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
]

class RoleService {
  private getStoredRoles(): WorkspaceRole[] {
    const raw = localStorage.getItem(ROLES_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(DEFAULT_ROLES))
      return [...DEFAULT_ROLES]
    }
    try {
      const parsed: WorkspaceRole[] = JSON.parse(raw)
      let needsSave = false
      const list = [...parsed]
      DEFAULT_ROLES.forEach(defRole => {
        if (!list.some(r => r.name.toLowerCase() === defRole.name.toLowerCase())) {
          list.push(defRole)
          needsSave = true
        }
      })
      if (needsSave) {
        this.saveRoles(list)
      }
      return list
    } catch {
      return [...DEFAULT_ROLES]
    }
  }

  private saveRoles(roles: WorkspaceRole[]): void {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles))
  }

  /**
   * Automatically discovers unique employee job titles from the active workforce
   * and registers any missing workspace roles so that workforce management and
   * the managerial roles catalog are 100% in sync.
   */
  private syncWithWorkforce(roles: WorkspaceRole[]): WorkspaceRole[] {
    try {
      const users = appDataStore.getUsers()
      if (!users || users.length === 0) return roles

      let updated = [...roles]
      let hasChanges = false

      users.forEach(u => {
        if (!u.jobTitle || !u.jobTitle.trim()) return

        // Clean title (handle branch names in parens like "Branch Manager (Kandy)")
        const rawTitle = u.jobTitle.trim()
        const cleanBaseTitle = rawTitle.includes('(') && (rawTitle.toLowerCase().includes('manager') || rawTitle.toLowerCase().includes('store'))
          ? rawTitle.replace(/\s*\([^)]*\)/g, '').trim()
          : rawTitle

        const existsExact = updated.some(r => r.name.toLowerCase() === rawTitle.toLowerCase())
        const existsBase = updated.some(r => r.name.toLowerCase() === cleanBaseTitle.toLowerCase())

        if (!existsExact && !existsBase) {
          const lower = cleanBaseTitle.toLowerCase()
          let baseSalary = 135000
          if (lower.includes('manager') || lower.includes('head') || lower.includes('director')) baseSalary = 285000
          else if (lower.includes('analyst') || lower.includes('lead') || lower.includes('architect')) baseSalary = 185000
          else if (lower.includes('officer') || lower.includes('specialist') || lower.includes('supervisor') || lower.includes('consultant')) baseSalary = 145000
          else if (lower.includes('assistant') || lower.includes('associate') || lower.includes('representative')) baseSalary = 95000

          const newRole: WorkspaceRole = {
            id: `role-auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: cleanBaseTitle,
            department: u.department || 'Retail Banking & Branches',
            baseSalary,
            currency: 'LKR',
            salaryPeriod: 'monthly',
            overtimeMultiplier: 1.5,
            description: `Configured workspace role for ${cleanBaseTitle} in ${u.department || 'the workspace'}.`,
            updatedAt: new Date().toISOString().split('T')[0],
          }
          updated.push(newRole)
          hasChanges = true
        }
      })

      if (hasChanges) {
        this.saveRoles(updated)
      }
      return updated
    } catch {
      return roles
    }
  }

  async getRoles(department?: string): Promise<WorkspaceRole[]> {
    await new Promise(r => setTimeout(r, 40))
    let list = this.getStoredRoles()
    list = this.syncWithWorkforce(list)

    if (!department || department.toLowerCase() === 'all') {
      return list
    }

    const deptLower = department.toLowerCase()

    // Match exact department or partial match (e.g. "Retail Banking" in "Retail Banking & Branches")
    const matched = list.filter(r => {
      if (!r.department) return true
      const rDept = r.department.toLowerCase()
      return rDept === deptLower || rDept.includes(deptLower) || deptLower.includes(rDept)
    })

    // If matches found, return them; otherwise if department has few matches, fall back to returning list
    if (matched.length > 0) {
      return matched
    }

    // Check if any employees in this department have job titles that match any role in the full list
    const usersInDept = appDataStore.getUsers().filter(u => {
      const uDept = (u.department || '').toLowerCase()
      return uDept === deptLower || uDept.includes(deptLower) || deptLower.includes(uDept)
    })
    const titlesInDept = new Set(usersInDept.map(u => u.jobTitle.toLowerCase()))
    const rolesForTitles = list.filter(r => titlesInDept.has(r.name.toLowerCase()))

    if (rolesForTitles.length > 0) {
      return rolesForTitles
    }

    return list
  }

  async getRoleById(id: string): Promise<WorkspaceRole | undefined> {
    await new Promise(r => setTimeout(r, 20))
    return this.getStoredRoles().find(r => r.id === id)
  }

  async createRole(data: Omit<WorkspaceRole, 'id' | 'updatedAt'>): Promise<WorkspaceRole> {
    await new Promise(r => setTimeout(r, 40))
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
    await new Promise(r => setTimeout(r, 40))
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
    await new Promise(r => setTimeout(r, 40))
    const roles = this.getStoredRoles()
    const filtered = roles.filter(r => r.id !== id)
    this.saveRoles(filtered)
    return true
  }
}

export const roleService = new RoleService()
