import { AuthenticatedUser } from '../middleware/auth'

interface DevFallbackEntry {
  match: (cleanEmp: string) => boolean
  user: AuthenticatedUser & { branchId?: string; branchName?: string }
}

const TENANT_INFO_MAP: Record<string, { id: string; name: string; code: string }> = {
  'tenant-keells': { id: 'tenant-keells', name: 'Keells Supermarkets', code: 'KEELLS' },
  'tenant-singer': { id: 'tenant-singer', name: 'Singer Sri Lanka PLC', code: 'SINGER' },
  'tenant-sampath': { id: 'tenant-sampath', name: 'Sampath Bank PLC', code: 'SAMPATH' },
}

const DEV_FALLBACK_USERS: DevFallbackEntry[] = [
  {
    match: id => id.includes('a-1001') || (id.includes('kasun') && !id.includes('sb')),
    user: {
      id: 'user-sb-admin',
      tenantId: 'tenant-sampath',
      name: 'Kasun Perera',
      email: 'kasun.perera@sampath.lk',
      role: 'admin',
      department: 'People Operations & HR',
      jobTitle: 'Head of Human Resources & Statutory Governance',
      employeeNumber: 'A-1001',
      branchId: 'br-sb-1',
      branchName: 'Colombo Fort Head Office Branch',
    },
  },
  {
    match: id => id.includes('m-1001') || (id.includes('dinuka') && !id.includes('sb')),
    user: {
      id: 'user-dinuka',
      tenantId: 'tenant-sampath',
      name: 'Dinuka Perera',
      email: 'dinuka.perera@sampath.lk',
      role: 'manager',
      department: 'Retail Banking & Branches',
      jobTitle: 'Senior Credit Officer',
      employeeNumber: 'M-1001',
      branchId: 'br-sb-1',
      branchName: 'Colombo Fort Head Office Branch',
    },
  },
  {
    match: id => id.includes('sb-1001'),
    user: {
      id: 'user-sb-admin-emp',
      tenantId: 'tenant-sampath',
      name: 'Kasun Perera',
      email: 'kasun.emp@sampath.lk',
      role: 'employee',
      department: 'People Operations & HR',
      jobTitle: 'Senior Credit Officer',
      employeeNumber: 'SB-1001',
      branchId: 'br-sb-1',
      branchName: 'Colombo Fort Head Office Branch',
    },
  },
  {
    match: id => id.includes('sb-1002'),
    user: {
      id: 'user-dinuka-emp',
      tenantId: 'tenant-sampath',
      name: 'Dinuka Perera',
      email: 'dinuka.perera.emp@sampath.lk',
      role: 'employee',
      department: 'Retail Banking & Branches',
      jobTitle: 'Senior Credit Officer',
      employeeNumber: 'SB-1002',
      branchId: 'br-sb-1',
      branchName: 'Colombo Fort Head Office Branch',
    },
  },
  {
    match: id => id.includes('sb-1007') || id.includes('nalaka'),
    user: {
      id: 'user-sb-emp-1007',
      tenantId: 'tenant-sampath',
      name: 'Nalaka Perera',
      email: 'nalaka.perera@sampath.lk',
      role: 'employee',
      department: 'Retail Banking & Branches',
      jobTitle: 'Customer Relationship Officer',
      employeeNumber: 'SB-1007',
      branchId: 'br-sb-1',
      branchName: 'Colombo Fort Head Office Branch',
    },
  },
  {
    match: id => id.includes('a-2001') || (id.includes('supun') && !id.includes('ks')),
    user: {
      id: 'user-ks-admin',
      tenantId: 'tenant-keells',
      name: 'Supun Dissanayake',
      email: 'supun.dissanayake@keells.com',
      role: 'admin',
      department: 'People & Culture',
      jobTitle: 'Head of People & Retail Talent Operations',
      employeeNumber: 'A-2001',
      branchId: 'br-ks-1',
      branchName: 'Crescat Boulevard Superstore',
    },
  },
  {
    match: id => id.includes('m-2001') || (id.includes('priyantha') && !id.includes('ks')),
    user: {
      id: 'user-ks-mgr-1',
      tenantId: 'tenant-keells',
      name: 'Priyantha Rathnayake',
      email: 'priyantha.rathnayake@keells.com',
      role: 'manager',
      department: 'Store Operations & Front End',
      jobTitle: 'Store General Manager (Crescat)',
      employeeNumber: 'M-2001',
      branchId: 'br-ks-1',
      branchName: 'Crescat Boulevard Superstore',
    },
  },
  {
    match: id => id.includes('ks-2001'),
    user: {
      id: 'user-ks-admin-emp',
      tenantId: 'tenant-keells',
      name: 'Supun Dissanayake',
      email: 'supun.emp@keells.com',
      role: 'employee',
      department: 'People & Culture',
      jobTitle: 'Head of People & Retail Talent Operations',
      employeeNumber: 'KS-2001',
      branchId: 'br-ks-1',
      branchName: 'Crescat Boulevard Superstore',
    },
  },
  {
    match: id => id.includes('ks-2012') || id.includes('gunaratne'),
    user: {
      id: 'user-ks-emp-2012',
      tenantId: 'tenant-keells',
      name: 'Kasun Gunaratne',
      email: 'kasun.gunaratne@keells.com',
      role: 'employee',
      department: 'Store Operations & Front End',
      jobTitle: 'Senior Retail Associate',
      employeeNumber: 'KS-2012',
      branchId: 'br-ks-1',
      branchName: 'Crescat Boulevard Superstore',
    },
  },
  {
    match: id => id.includes('a-3001') || (id.includes('kavinda') && !id.includes('sng')),
    user: {
      id: 'user-sn-admin',
      tenantId: 'tenant-singer',
      name: 'Kavinda Samarasinghe',
      email: 'kavinda.samarasinghe@singersl.com',
      role: 'admin',
      department: 'Human Resources & Training',
      jobTitle: 'Head of HR Operations & Statutory Affairs',
      employeeNumber: 'A-3001',
      branchId: 'br-sn-1',
      branchName: 'Singer Mega - Duplication Road',
    },
  },
  {
    match: id => id.includes('m-3001') || (id.includes('ashen') && !id.includes('sng')),
    user: {
      id: 'user-sn-mgr-1',
      tenantId: 'tenant-singer',
      name: 'Ashen Senanayake',
      email: 'ashen.senanayake@singersl.com',
      role: 'manager',
      department: 'Showroom Retail Sales',
      jobTitle: 'Mega Store Manager (Duplication Road)',
      employeeNumber: 'M-3001',
      branchId: 'br-sn-1',
      branchName: 'Singer Mega - Duplication Road',
    },
  },
  {
    match: id => id.includes('sng-3001'),
    user: {
      id: 'user-sn-admin-emp',
      tenantId: 'tenant-singer',
      name: 'Kavinda Samarasinghe',
      email: 'kavinda.emp@singersl.com',
      role: 'employee',
      department: 'Human Resources & Training',
      jobTitle: 'Head of HR Operations & Statutory Affairs',
      employeeNumber: 'SNG-3001',
      branchId: 'br-sn-1',
      branchName: 'Singer Mega - Duplication Road',
    },
  },
  {
    match: id => id.includes('sng-3008') || id.includes('sahan'),
    user: {
      id: 'user-sn-emp-3008',
      tenantId: 'tenant-singer',
      name: 'Sahan Alahakoon',
      email: 'sahan.alahakoon@singersl.com',
      role: 'employee',
      department: 'Showroom Retail Sales',
      jobTitle: 'Senior Showroom Sales Consultant',
      employeeNumber: 'SNG-3008',
      branchId: 'br-sn-1',
      branchName: 'Singer Mega - Duplication Road',
    },
  },
  {
    match: id => id.includes('kt-8842') || id.includes('alice') || id === 'employee',
    user: {
      id: 'user-Alice',
      tenantId: 'tenant-kinetic',
      name: 'Alice Johnson',
      email: 'Alice.johnson@kinetictech.io',
      role: 'employee',
      department: 'Engineering',
      jobTitle: 'Senior Frontend Engineer',
      employeeNumber: 'KT-8842',
    },
  },
  {
    match: id => id.includes('m-1044') || id === 'm1044' || id === 'manager' || (id === 'david' && !id.includes('kt')),
    user: {
      id: 'user-david',
      tenantId: 'tenant-kinetic',
      name: 'David Wilson',
      email: 'david.wilson@kinetictech.io',
      role: 'manager',
      department: 'Engineering',
      jobTitle: 'Engineering Director',
      employeeNumber: 'M-1044',
    },
  },
  {
    match: id => id.includes('kt-1044'),
    user: {
      id: 'user-david-emp',
      tenantId: 'tenant-kinetic',
      name: 'David Wilson',
      email: 'david.emp@kinetictech.io',
      role: 'employee',
      department: 'Engineering',
      jobTitle: 'Engineering Director',
      employeeNumber: 'KT-1044',
    },
  },
  {
    match: id => id.includes('a-0012') || id === 'a0012' || id === 'admin' || id === 'hr' || (id === 'sarah' && !id.includes('kt')),
    user: {
      id: 'user-sarah',
      tenantId: 'tenant-kinetic',
      name: 'Sarah Miller',
      email: 'sarah.miller@kinetictech.io',
      role: 'admin',
      department: 'Human Resources',
      jobTitle: 'VP of People & Operations',
      employeeNumber: 'A-0012',
    },
  },
  {
    match: id => id.includes('kt-0012'),
    user: {
      id: 'user-sarah-emp',
      tenantId: 'tenant-kinetic',
      name: 'Sarah Miller',
      email: 'sarah.emp@kinetictech.io',
      role: 'employee',
      department: 'Human Resources',
      jobTitle: 'VP of People & Operations',
      employeeNumber: 'KT-0012',
    },
  },
  {
    match: id => id.includes('kc-0001') || id === 'alex' || id.includes('platform'),
    user: {
      id: 'user-platform-admin',
      tenantId: 'tenant-kinetic',
      name: 'Alex Thorne',
      email: 'alex.thorne@kineticcloud.azure.com',
      role: 'platform_admin',
      department: 'Cloud Platform Operations',
      jobTitle: 'Principal Cloud Platform Director',
      employeeNumber: 'KC-0001',
    },
  },
]

export function resolveDevFallbackUser(cleanEmp: string, requestedTenantId?: string) {
  const found = DEV_FALLBACK_USERS.find(entry => entry.match(cleanEmp))
  if (!found) return null

  if (found.user.role === 'platform_admin') {
    return {
      user: found.user,
      tenant: { id: 'tenant-platform', name: 'Global Cloud Fleet Infrastructure', code: 'PLATFORM' },
    }
  }

  const targetTenantId = requestedTenantId && requestedTenantId !== 'tenant-kinetic' ? requestedTenantId : 'tenant-sampath'
  const tenantInfo = TENANT_INFO_MAP[targetTenantId] || TENANT_INFO_MAP['tenant-sampath']
  return {
    user: { ...found.user, tenantId: tenantInfo.id },
    tenant: tenantInfo,
  }
}
