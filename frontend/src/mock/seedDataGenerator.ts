// -----------------------------------------------------------------------------
// SRI LANKAN ENTERPRISE PRODUCTION SEED DATA GENERATOR (FRONTEND MIRROR)
// Tenants: Sampath Bank PLC (75 emps, 5 branches), Keells Super (100 emps, 10 branches), Singer PLC (20 emps, 6 branches)
// Currency: LKR throughout
// Statutory Framework: Sri Lanka Shop & Office Employees Act, EPF (8%/12%), ETF (3%)
// -----------------------------------------------------------------------------

export interface GeneratedSeedData {
  ORGANIZATIONS: any[]
  DEPARTMENTS: any[]
  BRANCHES: any[]
  USERS: any[]
  LEAVE_BALANCES: any[]
  LEAVE_REQUESTS: any[]
  ATTENDANCE_RECORDS: any[]
  PAYSLIPS: any[]
  POLICIES: any[]
  DOCUMENT_REQUESTS: any[]
  NOTIFICATIONS: any[]
  AUDIT_LOGS: any[]
}

const SRI_LANKAN_MALE_NAMES = [
  'Kasun', 'Dinesh', 'Nuwan', 'Sanjeewa', 'Malith', 'Harshana', 'Dilshan', 'Ruwan', 'Anura', 'Supun',
  'Ashen', 'Dulip', 'Kaveen', 'Isuru', 'Kavinda', 'Ramesh', 'Suresh', 'Pradeep', 'Janaka', 'Lasantha',
  'Ravindu', 'Charith', 'Tharindu', 'Udaya', 'Samantha', 'Hiran', 'Lakshan', 'Dasun', 'Bhanuka', 'Wanindu',
  'Pathum', 'Maheesh', 'Dunith', 'Chamika', 'Kamindu', 'Prabath', 'Sadeera', 'Lahiru', 'Suranga', 'Vishwa',
  'Devinda', 'Sajith', 'Rohan', 'Shiran', 'Niroshan', 'Roshan', 'Sahan', 'Dinuka', 'Gayan', 'Asanka',
  'Senaka', 'Dhammika', 'Nalaka', 'Lalith', 'Gamini', 'Suneth', 'Sumith', 'Bandula', 'Wasantha', 'Upul',
  'Sarath', 'Jayantha', 'Nimal', 'Rohana', 'Ajith', 'Mahinda', 'Chandana', 'Sisira', 'Tilak', 'Chathura',
  'Indika', 'Prasanna', 'Chamil', 'Manjula', 'Kapila', 'Roshantha', 'Danushka', 'Prageeth', 'Sudath', 'Ruwantha'
]

const SRI_LANKAN_FEMALE_NAMES = [
  'Thilini', 'Chamari', 'Sachini', 'Chathurika', 'Sanduni', 'Nadeesha', 'Nimanthi', 'Oshadi', 'Shanika', 'Menaka',
  'Nilmini', 'Nuwanthi', 'Gayani', 'Hasini', 'Pavithra', 'Hansani', 'Oshani', 'Subhashini', 'Rashmi', 'Piyumi',
  'Hiruni', 'Shenali', 'Kavindi', 'Amanda', 'Minoli', 'Jayani', 'Dilani', 'Sewwandi', 'Kanchana', 'Tharushi',
  'Poornima', 'Madushani', 'Ruvini', 'Anusha', 'Deepika', 'Kumari', 'Malsha', 'Sandamali', 'Inoka', 'Priyangika',
  'Shyamali', 'Gayathri', 'Dinusha', 'Samadhi', 'Ishara', 'Dulanjali', 'Madhavi', 'Chathuri', 'Pabasarani', 'Ruwindya'
]

const SRI_LANKAN_SURNAMES = [
  'Perera', 'Fernando', 'Silva', 'de Silva', 'Jayasuriya', 'Wickramasinghe', 'Senanayake', 'Rajapaksa', 'Gunaratne', 'Dissanayake',
  'Bandara', 'Rathnayake', 'Jayawardena', 'Alahakoon', 'Karunaratne', 'Weerasinghe', 'Herath', 'Samaraweera', 'Mendis', 'Cooray',
  'Peiris', 'Liyanage', 'Gamage', 'Wijesinghe', 'Samarasinghe', 'Abeysekera', 'Athukorala', 'Balasuriya', 'Ekanayake', 'Hettiarachchi',
  'Illangakoon', 'Jayakody', 'Kulatunga', 'Marasinghe', 'Nanayakkara', 'Opatha', 'Paranavitana', 'Ranatunga', 'Subasinghe', 'Tennakoon',
  'Vithanage', 'Wanniarachchi', 'Yapa', 'Jayalath', 'Pathirana', 'Gunasekara', 'Seneviratne', 'Jayasinghe', 'Dias', 'Fonseka',
  'Goonewardena', 'Lokuge', 'Madurapperuma', 'Attanayake', 'Basnayake', 'Danthanarayana', 'Edirisinghe', 'Galappaththi', 'Hapuarachchi'
]

export function generateProductionSeedData(): GeneratedSeedData {
  // 1. ORGANIZATIONS (3 Tenants)
  const ORGANIZATIONS = [
    {
      id: 'tenant-sampath',
      tenantId: 'tenant-sampath',
      name: 'Sampath Bank PLC',
      code: 'SAMPATH',
      domain: 'sampath.lk',
      plan: 'Enterprise Banking Cloud',
      currency: 'LKR',
      primaryColor: '#ef8d46',
      industry: 'Banking & Financial Services',
      country: 'Sri Lanka',
      status: 'Active',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'tenant-keells',
      tenantId: 'tenant-keells',
      name: 'Keells Supermarkets',
      code: 'KEELLS',
      domain: 'keells.com',
      plan: 'Enterprise Retail Cloud',
      currency: 'LKR',
      primaryColor: '#10b981',
      industry: 'Retail & FMCG',
      country: 'Sri Lanka',
      status: 'Active',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'tenant-singer',
      tenantId: 'tenant-singer',
      name: 'Singer Sri Lanka PLC',
      code: 'SINGER',
      domain: 'singersl.com',
      plan: 'Enterprise Commercial Cloud',
      currency: 'LKR',
      primaryColor: '#ef4444',
      industry: 'Consumer Electronics & Retail',
      country: 'Sri Lanka',
      status: 'Active',
      createdAt: '2024-01-01T00:00:00Z',
    },
  ]

  // 2. DEPARTMENTS
  const DEPARTMENTS = [
    // Sampath Bank
    { id: 'dept-sb-retail', tenantId: 'tenant-sampath', name: 'Retail Banking & Branches', head: 'Dinesh Weerasinghe', threshold: '80% min staffing', status: 'Active', description: 'Branch customer services, personal banking, teller and counter operations.' },
    { id: 'dept-sb-credit', tenantId: 'tenant-sampath', name: 'Corporate Credit & Risk', head: 'Nuwan Jayasuriya', threshold: '85% min staffing', status: 'Active', description: 'Commercial loan underwriting, trade finance, credit assessments.' },
    { id: 'dept-sb-treasury', tenantId: 'tenant-sampath', name: 'Treasury & Investment', head: 'Chamari Bandara', threshold: '75% min staffing', status: 'Active', description: 'Forex transactions, government bonds, money market operations.' },
    { id: 'dept-sb-it', tenantId: 'tenant-sampath', name: 'Core Banking IT Systems', head: 'Thilini Silva', threshold: '90% min staffing', status: 'Active', description: 'Online banking, FinTech integrations, ATM switch maintenance.' },
    { id: 'dept-sb-hr', tenantId: 'tenant-sampath', name: 'People Operations & HR', head: 'Kasun Perera', threshold: '75% min staffing', status: 'Active', description: 'Statutory compliance, employee welfare, EPF/ETF processing.' },

    // Keells Super
    { id: 'dept-ks-ops', tenantId: 'tenant-keells', name: 'Store Operations & Front End', head: 'Priyantha Rathnayake', threshold: '85% min staffing', status: 'Active', description: 'Supermarket customer experience, POS terminals, daily floor operations.' },
    { id: 'dept-ks-supply', tenantId: 'tenant-keells', name: 'Cold Chain & Logistics', head: 'Malith Jayawardena', threshold: '80% min staffing', status: 'Active', description: 'Central distribution hub, fresh vegetables & dairy logistics.' },
    { id: 'dept-ks-fresh', tenantId: 'tenant-keells', name: 'Fresh Foods & Quality Control', head: 'Sachini Mendis', threshold: '90% min staffing', status: 'Active', description: 'Butchery, bakery, farm freshness inspections.' },
    { id: 'dept-ks-mkt', tenantId: 'tenant-keells', name: 'Retail Merchandising & Loyalty', head: 'Harshana Gunaratne', threshold: '70% min staffing', status: 'Active', description: 'Nexus loyalty rewards, promotional campaigns, inventory planograms.' },
    { id: 'dept-ks-hr', tenantId: 'tenant-keells', name: 'People & Culture', head: 'Supun Dissanayake', threshold: '75% min staffing', status: 'Active', description: 'Retail shift management, recruitment, statutory benefits.' },

    // Singer PLC
    { id: 'dept-sn-sales', tenantId: 'tenant-singer', name: 'Showroom Retail Sales', head: 'Ashen Senanayake', threshold: '80% min staffing', status: 'Active', description: 'Consumer appliances, mobile phones, consumer electronics retail.' },
    { id: 'dept-sn-hire', tenantId: 'tenant-singer', name: 'Hire Purchase & Consumer Finance', head: 'Dulip Wickramasinghe', threshold: '85% min staffing', status: 'Active', description: 'Installment credit evaluation, customer verification, recoveries.' },
    { id: 'dept-sn-service', tenantId: 'tenant-singer', name: 'Singer Service & Aftercare', head: 'Kaveen Rajapaksa', threshold: '75% min staffing', status: 'Active', description: 'Electronics repair, warranty fulfillment, spare parts warehouse.' },
    { id: 'dept-sn-hr', tenantId: 'tenant-singer', name: 'Human Resources & Training', head: 'Kavinda Samarasinghe', threshold: '80% min staffing', status: 'Active', description: 'Field sales training, payroll disbursement, EPF & ETF compliance.' },
  ]

  // 3. BRANCHES (21 Branches)
  const BRANCHES = [
    // Sampath Bank (5 branches)
    {
      id: 'br-sb-1',
      tenantId: 'tenant-sampath',
      name: 'Colombo Fort Head Office Branch',
      code: 'SB-CMB',
      type: 'Headquarters',
      address: 'No 110, Sir James Peiris Mawatha, Colombo 02',
      city: 'Colombo',
      country: 'Sri Lanka',
      phone: '+94 11 230 3050',
      email: 'colombo.fort@sampath.lk',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-sb-mgr-1',
      branchManagerName: 'Dinesh Weerasinghe',
      employeeCount: 15,
      isHeadquarters: true,
      status: 'Active',
      createdAt: '2024-01-15T08:00:00Z',
    },
    {
      id: 'br-sb-2',
      tenantId: 'tenant-sampath',
      name: 'Kandy Super Branch',
      code: 'SB-KDY',
      type: 'Regional Branch',
      address: 'No 28, Dalada Veediya, Kandy',
      city: 'Kandy',
      country: 'Sri Lanka',
      phone: '+94 81 223 4567',
      email: 'kandy.branch@sampath.lk',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-sb-mgr-2',
      branchManagerName: 'Chamari Bandara',
      employeeCount: 15,
      isHeadquarters: false,
      status: 'Active',
      createdAt: '2024-01-20T08:00:00Z',
    },
    {
      id: 'br-sb-3',
      tenantId: 'tenant-sampath',
      name: 'Galle Fort Branch',
      code: 'SB-GLE',
      type: 'Regional Branch',
      address: 'No 45, Wakwella Road, Galle',
      city: 'Galle',
      country: 'Sri Lanka',
      phone: '+94 91 224 5678',
      email: 'galle.branch@sampath.lk',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-sb-mgr-3',
      branchManagerName: 'Nuwan Jayasuriya',
      employeeCount: 15,
      isHeadquarters: false,
      status: 'Active',
      createdAt: '2024-02-01T08:00:00Z',
    },
    {
      id: 'br-sb-4',
      tenantId: 'tenant-sampath',
      name: 'Kurunegala Metro Branch',
      code: 'SB-KRN',
      type: 'Regional Branch',
      address: 'No 14, Colombo Road, Kurunegala',
      city: 'Kurunegala',
      country: 'Sri Lanka',
      phone: '+94 37 222 3456',
      email: 'kurunegala.branch@sampath.lk',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-sb-mgr-4',
      branchManagerName: 'Thilini Silva',
      employeeCount: 15,
      isHeadquarters: false,
      status: 'Active',
      createdAt: '2024-02-15T08:00:00Z',
    },
    {
      id: 'br-sb-5',
      tenantId: 'tenant-sampath',
      name: 'Jaffna City Branch',
      code: 'SB-JFN',
      type: 'Regional Branch',
      address: 'No 72, Hospital Road, Jaffna',
      city: 'Jaffna',
      country: 'Sri Lanka',
      phone: '+94 21 221 8900',
      email: 'jaffna.branch@sampath.lk',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-sb-mgr-5',
      branchManagerName: 'Sanjeewa Fernando',
      employeeCount: 15,
      isHeadquarters: false,
      status: 'Active',
      createdAt: '2024-03-01T08:00:00Z',
    },

    // Keells Super (10 branches)
    {
      id: 'br-ks-1',
      tenantId: 'tenant-keells',
      name: 'Crescat Boulevard Superstore',
      code: 'KS-CRB',
      type: 'Flagship Superstore',
      address: 'G-12 Crescat Boulevard, Galle Road, Colombo 03',
      city: 'Colombo',
      country: 'Sri Lanka',
      phone: '+94 11 249 7800',
      email: 'crescat@keells.com',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-ks-mgr-1',
      branchManagerName: 'Priyantha Rathnayake',
      employeeCount: 10,
      isHeadquarters: true,
      status: 'Active',
      createdAt: '2024-01-10T08:00:00Z',
    },
    {
      id: 'br-ks-2',
      tenantId: 'tenant-keells',
      name: 'Union Place Superstore',
      code: 'KS-UNP',
      type: 'Superstore',
      address: 'No 186, Union Place, Colombo 02',
      city: 'Colombo',
      country: 'Sri Lanka',
      phone: '+94 11 230 4500',
      email: 'unionplace@keells.com',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-ks-mgr-2',
      branchManagerName: 'Sachini Mendis',
      employeeCount: 10,
      isHeadquarters: false,
      status: 'Active',
      createdAt: '2024-01-15T08:00:00Z',
    },
    {
      id: 'br-ks-3',
      tenantId: 'tenant-keells',
      name: 'Kohuwala Junction Superstore',
      code: 'KS-KHW',
      type: 'Superstore',
      address: 'No 120, Dutugemunu Street, Kohuwala',
      city: 'Kohuwala',
      country: 'Sri Lanka',
      phone: '+94 11 282 3400',
      email: 'kohuwala@keells.com',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-ks-mgr-3',
      branchManagerName: 'Malith Jayawardena',
      employeeCount: 10,
      isHeadquarters: false,
      status: 'Active',
      createdAt: '2024-01-20T08:00:00Z',
    },
    {
      id: 'br-ks-4',
      tenantId: 'tenant-keells',
      name: 'Rajagiriya Metro Store',
      code: 'KS-RJG',
      type: 'Retail Store',
      address: 'No 54, Sri Jayawardenepura Mawatha, Rajagiriya',
      city: 'Rajagiriya',
      country: 'Sri Lanka',
      phone: '+94 11 286 7800',
      email: 'rajagiriya@keells.com',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-ks-mgr-4',
      branchManagerName: 'Harshana Gunaratne',
      employeeCount: 10,
      isHeadquarters: false,
      status: 'Active',
      createdAt: '2024-02-01T08:00:00Z',
    },
    {
      id: 'br-ks-5',
      tenantId: 'tenant-keells',
      name: 'Negombo Coastal Superstore',
      code: 'KS-NEG',
      type: 'Superstore',
      address: 'No 210, Main Street, Negombo',
      city: 'Negombo',
      country: 'Sri Lanka',
      phone: '+94 31 222 8900',
      email: 'negombo@keells.com',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-ks-mgr-5',
      branchManagerName: 'Dilshan Alahakoon',
      employeeCount: 10,
      isHeadquarters: false,
      status: 'Active',
      createdAt: '2024-02-10T08:00:00Z',
    },
    {
      id: 'br-ks-6',
      tenantId: 'tenant-keells',
      name: 'Kandy Peradeniya Road Store',
      code: 'KS-KDY',
      type: 'Superstore',
      address: 'No 155, Peradeniya Road, Kandy',
      city: 'Kandy',
      country: 'Sri Lanka',
      phone: '+94 81 220 5600',
      email: 'kandy@keells.com',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-ks-mgr-6',
      branchManagerName: 'Nadeesha Herath',
      employeeCount: 10,
      isHeadquarters: false,
      status: 'Active',
      createdAt: '2024-02-20T08:00:00Z',
    },
    {
      id: 'br-ks-7',
      tenantId: 'tenant-keells',
      name: 'Gampaha City Centre Superstore',
      code: 'KS-GMP',
      type: 'Superstore',
      address: 'No 35, Yakkala Road, Gampaha',
      city: 'Gampaha',
      country: 'Sri Lanka',
      phone: '+94 33 223 4500',
      email: 'gampaha@keells.com',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-ks-mgr-7',
      branchManagerName: 'Ruwan Karunaratne',
      employeeCount: 10,
      isHeadquarters: false,
      status: 'Active',
      createdAt: '2024-03-01T08:00:00Z',
    },
    {
      id: 'br-ks-8',
      tenantId: 'tenant-keells',
      name: 'Panadura Town Superstore',
      code: 'KS-PND',
      type: 'Superstore',
      address: 'No 88, Galle Road, Panadura',
      city: 'Panadura',
      country: 'Sri Lanka',
      phone: '+94 38 223 7800',
      email: 'panadura@keells.com',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-ks-mgr-8',
      branchManagerName: 'Anura Samaraweera',
      employeeCount: 10,
      isHeadquarters: false,
      status: 'Active',
      createdAt: '2024-03-10T08:00:00Z',
    },
    {
      id: 'br-ks-9',
      tenantId: 'tenant-keells',
      name: 'Malabe IT Hub Store',
      code: 'KS-MLB',
      type: 'Retail Store',
      address: 'No 14, Kaduwela Road, Malabe',
      city: 'Malabe',
      country: 'Sri Lanka',
      phone: '+94 11 240 1200',
      email: 'malabe@keells.com',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-ks-mgr-9',
      branchManagerName: 'Chathurika Cooray',
      employeeCount: 10,
      isHeadquarters: false,
      status: 'Active',
      createdAt: '2024-03-15T08:00:00Z',
    },
    {
      id: 'br-ks-10',
      tenantId: 'tenant-keells',
      name: 'Mount Lavinia Beach Superstore',
      code: 'KS-MTL',
      type: 'Superstore',
      address: 'No 412, Galle Road, Mount Lavinia',
      city: 'Mount Lavinia',
      country: 'Sri Lanka',
      phone: '+94 11 273 8900',
      email: 'mtlavinia@keells.com',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-ks-mgr-10',
      branchManagerName: 'Sanduni Peiris',
      employeeCount: 10,
      isHeadquarters: false,
      status: 'Active',
      createdAt: '2024-03-20T08:00:00Z',
    },

    // Singer PLC (6 branches)
    {
      id: 'br-sn-1',
      tenantId: 'tenant-singer',
      name: 'Singer Mega - Duplication Road',
      code: 'SN-DUP',
      type: 'Mega Store',
      address: 'No 320, Duplication Road, Colombo 04',
      city: 'Colombo',
      country: 'Sri Lanka',
      phone: '+94 11 250 1234',
      email: 'duplication@singersl.com',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-sn-mgr-1',
      branchManagerName: 'Ashen Senanayake',
      employeeCount: 4,
      isHeadquarters: true,
      status: 'Active',
      createdAt: '2024-01-15T08:00:00Z',
    },
    {
      id: 'br-sn-2',
      tenantId: 'tenant-singer',
      name: 'Singer Mega - Nugegoda',
      code: 'SN-NUG',
      type: 'Mega Store',
      address: 'No 142, High Level Road, Nugegoda',
      city: 'Nugegoda',
      country: 'Sri Lanka',
      phone: '+94 11 282 5678',
      email: 'nugegoda@singersl.com',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-sn-mgr-2',
      branchManagerName: 'Dulip Wickramasinghe',
      employeeCount: 4,
      isHeadquarters: false,
      status: 'Active',
      createdAt: '2024-01-25T08:00:00Z',
    },
    {
      id: 'br-sn-3',
      tenantId: 'tenant-singer',
      name: 'Singer Showroom - Kandy',
      code: 'SN-KDY',
      type: 'Showroom',
      address: 'No 62, Dalada Veediya, Kandy',
      city: 'Kandy',
      country: 'Sri Lanka',
      phone: '+94 81 222 3456',
      email: 'kandy@singersl.com',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-sn-mgr-3',
      branchManagerName: 'Kaveen Rajapaksa',
      employeeCount: 3,
      isHeadquarters: false,
      status: 'Active',
      createdAt: '2024-02-05T08:00:00Z',
    },
    {
      id: 'br-sn-4',
      tenantId: 'tenant-singer',
      name: 'Singer Showroom - Galle',
      code: 'SN-GLE',
      type: 'Showroom',
      address: 'No 28, Havelock Road, Galle',
      city: 'Galle',
      country: 'Sri Lanka',
      phone: '+94 91 223 7890',
      email: 'galle@singersl.com',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-sn-mgr-4',
      branchManagerName: 'Isuru Liyanage',
      employeeCount: 3,
      isHeadquarters: false,
      status: 'Active',
      createdAt: '2024-02-15T08:00:00Z',
    },
    {
      id: 'br-sn-5',
      tenantId: 'tenant-singer',
      name: 'Singer Showroom - Kurunegala',
      code: 'SN-KRN',
      type: 'Showroom',
      address: 'No 77, Bazaar Street, Kurunegala',
      city: 'Kurunegala',
      country: 'Sri Lanka',
      phone: '+94 37 222 6789',
      email: 'kurunegala@singersl.com',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-sn-mgr-5',
      branchManagerName: 'Nimanthi Gamage',
      employeeCount: 3,
      isHeadquarters: false,
      status: 'Active',
      createdAt: '2024-03-01T08:00:00Z',
    },
    {
      id: 'br-sn-6',
      tenantId: 'tenant-singer',
      name: 'Singer Mega - Wattala',
      code: 'SN-WAT',
      type: 'Mega Store',
      address: 'No 390, Negombo Road, Wattala',
      city: 'Wattala',
      country: 'Sri Lanka',
      phone: '+94 11 293 4567',
      email: 'wattala@singersl.com',
      timezone: 'Asia/Colombo (UTC+5:30)',
      branchManagerId: 'user-sn-mgr-6',
      branchManagerName: 'Oshadi Wijesinghe',
      employeeCount: 3,
      isHeadquarters: false,
      status: 'Active',
      createdAt: '2024-03-10T08:00:00Z',
    },
  ]

  // 4. USERS GENERATION
  const USERS: any[] = []

  function getSLName(idx: number, isFemale = false): { firstName: string; lastName: string; fullName: string } {
    const list = isFemale ? SRI_LANKAN_FEMALE_NAMES : SRI_LANKAN_MALE_NAMES
    const fn = list[idx % list.length]
    const ln = SRI_LANKAN_SURNAMES[(idx * 7 + 3) % SRI_LANKAN_SURNAMES.length]
    return { firstName: fn, lastName: ln, fullName: `${fn} ${ln}` }
  }

  // SAMPATH BANK (5 Banking Workers — 2 Same Role, 1 Exhausted Annual Leave, 0 IT Developers)
  const sampathUsers: any[] = [
    {
      id: 'user-kasun',
      tenantId: 'tenant-sampath',
      name: 'Kasun Perera',
      email: 'kasun.perera@sampath.lk',
      role: 'employee',
      department: 'Retail Banking & Branches',
      jobTitle: 'Senior Credit Officer',
      employeeNumber: 'SB-1001',
      branchId: 'br-sb-1',
      branchName: 'Colombo Fort Head Office Branch',
      managerId: 'user-chamari',
      managerName: 'Chamari Bandara',
      hireDate: '2022-01-15',
      phone: '+94 77 234 1001',
      location: 'Colombo Fort Head Office Branch',
    },
    {
      id: 'user-dinesh',
      tenantId: 'tenant-sampath',
      name: 'Dinesh Weerasinghe',
      email: 'dinesh.weerasinghe@sampath.lk',
      role: 'employee',
      department: 'Retail Banking & Branches',
      jobTitle: 'Senior Credit Officer', // SAME ROLE AS KASUN
      employeeNumber: 'SB-1002',
      branchId: 'br-sb-1',
      branchName: 'Colombo Fort Head Office Branch',
      managerId: 'user-chamari',
      managerName: 'Chamari Bandara',
      hireDate: '2021-06-10',
      phone: '+94 77 234 1002',
      location: 'Colombo Fort Head Office Branch',
    },
    {
      id: 'user-thilini',
      tenantId: 'tenant-sampath',
      name: 'Thilini Silva',
      email: 'thilini.silva@sampath.lk',
      role: 'employee',
      department: 'Corporate Credit & Risk',
      jobTitle: 'Treasury Operations Manager',
      employeeNumber: 'SB-1003',
      branchId: 'br-sb-1',
      branchName: 'Colombo Fort Head Office Branch',
      managerId: 'user-chamari',
      managerName: 'Chamari Bandara',
      hireDate: '2020-03-01',
      phone: '+94 77 234 1003',
      location: 'Colombo Fort Head Office Branch',
    },
    {
      id: 'user-nuwan',
      tenantId: 'tenant-sampath',
      name: 'Nuwan Jayasuriya',
      email: 'nuwan.jayasuriya@sampath.lk',
      role: 'employee',
      department: 'Treasury & Investment',
      jobTitle: 'Foreign Exchange Specialist',
      employeeNumber: 'SB-1004',
      branchId: 'br-sb-1',
      branchName: 'Colombo Fort Head Office Branch',
      managerId: 'user-chamari',
      managerName: 'Chamari Bandara',
      hireDate: '2023-02-20',
      phone: '+94 77 234 1004',
      location: 'Colombo Fort Head Office Branch',
    },
    {
      id: 'user-chamari',
      tenantId: 'tenant-sampath',
      name: 'Chamari Bandara',
      email: 'chamari.bandara@sampath.lk',
      role: 'manager',
      department: 'Retail Banking & Branches',
      jobTitle: 'Senior Branch Manager',
      employeeNumber: 'M-1005',
      branchId: 'br-sb-1',
      branchName: 'Colombo Fort Head Office Branch',
      hireDate: '2019-11-01',
      phone: '+94 77 234 1005',
      location: 'Colombo Fort Head Office Branch',
    },
  ]
  USERS.push(...sampathUsers)

  // KEELLS SUPER
  const ksAdminName = 'Supun Dissanayake'
  const ksAdmin: any = {
    id: 'user-ks-admin',
    tenantId: 'tenant-keells',
    name: ksAdminName,
    email: 'supun.dissanayake@keells.com',
    role: 'admin',
    department: 'People & Culture',
    jobTitle: 'Head of People & Retail Talent Operations',
    employeeNumber: 'A-2001',
    branchId: 'br-ks-1',
    branchName: 'Crescat Boulevard Superstore',
    hireDate: '2020-02-01',
    phone: '+94 77 123 9988',
    location: 'Crescat Boulevard Superstore',
  }
  const ksAdminEmp: any = {
    ...ksAdmin,
    id: 'user-ks-admin-emp',
    email: 'supun.emp@keells.com',
    role: 'employee',
    employeeNumber: 'KS-2001',
    managerId: 'user-ks-admin',
    managerName: ksAdminName,
  }
  USERS.push(ksAdmin, ksAdminEmp)

  const ksManagers = [
    { id: 'user-ks-mgr-1', name: 'Priyantha Rathnayake', empId: 'M-2001', selfEmpId: 'KS-2002', branch: BRANCHES[5], title: 'Store General Manager (Crescat)' },
    { id: 'user-ks-mgr-2', name: 'Sachini Mendis', empId: 'M-2002', selfEmpId: 'KS-2003', branch: BRANCHES[6], title: 'Store Manager (Union Place)' },
    { id: 'user-ks-mgr-3', name: 'Malith Jayawardena', empId: 'M-2003', selfEmpId: 'KS-2004', branch: BRANCHES[7], title: 'Store Manager (Kohuwala)' },
    { id: 'user-ks-mgr-4', name: 'Harshana Gunaratne', empId: 'M-2004', selfEmpId: 'KS-2005', branch: BRANCHES[8], title: 'Store Manager (Rajagiriya)' },
    { id: 'user-ks-mgr-5', name: 'Dilshan Alahakoon', empId: 'M-2005', selfEmpId: 'KS-2006', branch: BRANCHES[9], title: 'Store Manager (Negombo)' },
    { id: 'user-ks-mgr-6', name: 'Nadeesha Herath', empId: 'M-2006', selfEmpId: 'KS-2007', branch: BRANCHES[10], title: 'Store Manager (Kandy)' },
    { id: 'user-ks-mgr-7', name: 'Ruwan Karunaratne', empId: 'M-2007', selfEmpId: 'KS-2008', branch: BRANCHES[11], title: 'Store Manager (Gampaha)' },
    { id: 'user-ks-mgr-8', name: 'Anura Samaraweera', empId: 'M-2008', selfEmpId: 'KS-2009', branch: BRANCHES[12], title: 'Store Manager (Panadura)' },
    { id: 'user-ks-mgr-9', name: 'Chathurika Cooray', empId: 'M-2009', selfEmpId: 'KS-2010', branch: BRANCHES[13], title: 'Store Manager (Malabe)' },
    { id: 'user-ks-mgr-10', name: 'Sanduni Peiris', empId: 'M-2010', selfEmpId: 'KS-2011', branch: BRANCHES[14], title: 'Store Manager (Mount Lavinia)' },
  ]

  ksManagers.forEach((m, idx) => {
    const mgrUser: any = {
      id: m.id,
      tenantId: 'tenant-keells',
      name: m.name,
      email: `${m.name.toLowerCase().replace(' ', '.')}@keells.com`,
      role: 'manager',
      department: 'Store Operations & Front End',
      jobTitle: m.title,
      employeeNumber: m.empId,
      branchId: m.branch.id,
      branchName: m.branch.name,
      managerId: 'user-ks-admin',
      managerName: ksAdminName,
      hireDate: `2021-0${(idx % 8) + 1}-10`,
      phone: `+94 77 ${500 + idx} 1122`,
      location: m.branch.name,
    }
    const mgrEmp: any = {
      ...mgrUser,
      id: `${m.id}-emp`,
      email: `${m.name.toLowerCase().replace(' ', '.')}.emp@keells.com`,
      role: 'employee',
      employeeNumber: m.selfEmpId,
    }
    USERS.push(mgrUser, mgrEmp)
  })

  const ksBranchStaffTargets = [8, 9, 9, 9, 9, 9, 9, 9, 9, 9]
  let ksGlobalEmpNum = 2012
  ksBranchStaffTargets.forEach((targetCount, bIdx) => {
    const branch = BRANCHES[5 + bIdx]
    const manager = ksManagers[bIdx]
    for (let i = 0; i < targetCount; i++) {
      const isFemale = (bIdx + i) % 2 === 0
      const person = getSLName(ksGlobalEmpNum + 300, isFemale)
      const empId = `KS-${ksGlobalEmpNum}`
      const titles = ['Senior Retail Associate', 'Inventory Specialist', 'Fresh Food Supervisor', 'POS Checkout Team Lead', 'Cold Chain Coordinator', 'Customer Service Representative']
      const depts = ['Store Operations & Front End', 'Cold Chain & Logistics', 'Fresh Foods & Quality Control', 'Retail Merchandising & Loyalty']
      USERS.push({
        id: `user-ks-emp-${ksGlobalEmpNum}`,
        tenantId: 'tenant-keells',
        name: person.fullName,
        email: `${person.firstName.toLowerCase()}.${person.lastName.toLowerCase()}${ksGlobalEmpNum % 100}@keells.com`,
        role: 'employee',
        department: depts[(i + bIdx) % depts.length],
        jobTitle: titles[(i * 2 + bIdx) % titles.length],
        employeeNumber: empId,
        branchId: branch.id,
        branchName: branch.name,
        managerId: manager.id,
        managerName: manager.name,
        hireDate: `202${2 + (i % 3)}-0${(i % 9) + 1}-12`,
        phone: `+94 76 ${300 + (ksGlobalEmpNum % 600)} ${2000 + (i * 149) % 7000}`,
        location: branch.name,
      })
      ksGlobalEmpNum++
    }
  })

  // SINGER PLC
  const snAdminName = 'Kavinda Samarasinghe'
  const snAdmin: any = {
    id: 'user-sn-admin',
    tenantId: 'tenant-singer',
    name: snAdminName,
    email: 'kavinda.samarasinghe@singersl.com',
    role: 'admin',
    department: 'Human Resources & Training',
    jobTitle: 'Head of HR Operations & Statutory Affairs',
    employeeNumber: 'A-3001',
    branchId: 'br-sn-1',
    branchName: 'Singer Mega - Duplication Road',
    hireDate: '2019-11-01',
    phone: '+94 77 456 1234',
    location: 'Singer Mega - Duplication Road',
  }
  const snAdminEmp: any = {
    ...snAdmin,
    id: 'user-sn-admin-emp',
    email: 'kavinda.emp@singersl.com',
    role: 'employee',
    employeeNumber: 'SNG-3001',
    managerId: 'user-sn-admin',
    managerName: snAdminName,
  }
  USERS.push(snAdmin, snAdminEmp)

  const snManagers = [
    { id: 'user-sn-mgr-1', name: 'Ashen Senanayake', empId: 'M-3001', selfEmpId: 'SNG-3002', branch: BRANCHES[15], title: 'Mega Store Manager (Duplication Road)' },
    { id: 'user-sn-mgr-2', name: 'Dulip Wickramasinghe', empId: 'M-3002', selfEmpId: 'SNG-3003', branch: BRANCHES[16], title: 'Mega Store Manager (Nugegoda)' },
    { id: 'user-sn-mgr-3', name: 'Kaveen Rajapaksa', empId: 'M-3003', selfEmpId: 'SNG-3004', branch: BRANCHES[17], title: 'Showroom Manager (Kandy)' },
    { id: 'user-sn-mgr-4', name: 'Isuru Liyanage', empId: 'M-3004', selfEmpId: 'SNG-3005', branch: BRANCHES[18], title: 'Showroom Manager (Galle)' },
    { id: 'user-sn-mgr-5', name: 'Nimanthi Gamage', empId: 'M-3005', selfEmpId: 'SNG-3006', branch: BRANCHES[19], title: 'Showroom Manager (Kurunegala)' },
    { id: 'user-sn-mgr-6', name: 'Oshadi Wijesinghe', empId: 'M-3006', selfEmpId: 'SNG-3007', branch: BRANCHES[20], title: 'Mega Store Manager (Wattala)' },
  ]

  snManagers.forEach((m, idx) => {
    const mgrUser: any = {
      id: m.id,
      tenantId: 'tenant-singer',
      name: m.name,
      email: `${m.name.toLowerCase().replace(' ', '.')}@singersl.com`,
      role: 'manager',
      department: 'Showroom Retail Sales',
      jobTitle: m.title,
      employeeNumber: m.empId,
      branchId: m.branch.id,
      branchName: m.branch.name,
      managerId: 'user-sn-admin',
      managerName: snAdminName,
      hireDate: `2021-0${(idx % 6) + 2}-01`,
      phone: `+94 77 ${700 + idx} 3344`,
      location: m.branch.name,
    }
    const mgrEmp: any = {
      ...mgrUser,
      id: `${m.id}-emp`,
      email: `${m.name.toLowerCase().replace(' ', '.')}.emp@singersl.com`,
      role: 'employee',
      employeeNumber: m.selfEmpId,
    }
    USERS.push(mgrUser, mgrEmp)
  })

  const snBranchStaffTargets = [2, 3, 2, 2, 2, 2]
  let snGlobalEmpNum = 3008
  snBranchStaffTargets.forEach((targetCount, bIdx) => {
    const branch = BRANCHES[15 + bIdx]
    const manager = snManagers[bIdx]
    for (let i = 0; i < targetCount; i++) {
      const isFemale = (bIdx + i) % 2 === 1
      const person = getSLName(snGlobalEmpNum + 600, isFemale)
      const empId = `SNG-${snGlobalEmpNum}`
      const titles = ['Senior Showroom Sales Consultant', 'Consumer Electronics Specialist', 'Hire Purchase Recovery Officer', 'Appliance Technical Specialist']
      const depts = ['Showroom Retail Sales', 'Hire Purchase & Consumer Finance', 'Singer Service & Aftercare']
      USERS.push({
        id: `user-sn-emp-${snGlobalEmpNum}`,
        tenantId: 'tenant-singer',
        name: person.fullName,
        email: `${person.firstName.toLowerCase()}.${person.lastName.toLowerCase()}${snGlobalEmpNum % 100}@singersl.com`,
        role: 'employee',
        department: depts[(i + bIdx) % depts.length],
        jobTitle: titles[(i + bIdx) % titles.length],
        employeeNumber: empId,
        branchId: branch.id,
        branchName: branch.name,
        managerId: manager.id,
        managerName: manager.name,
        hireDate: `202${2 + (i % 3)}-0${(i % 8) + 2}-15`,
        phone: `+94 75 ${200 + (snGlobalEmpNum % 500)} ${3000 + (i * 211) % 6000}`,
        location: branch.name,
      })
      snGlobalEmpNum++
    }
  })

  // PLATFORM ADMIN
  USERS.push({
    id: 'user-platform-admin',
    tenantId: 'tenant-sampath',
    name: 'Alex Thorne',
    email: 'alex.thorne@kineticcloud.azure.com',
    role: 'platform_admin',
    department: 'Cloud Platform Infrastructure',
    jobTitle: 'Principal Cloud Platform Director',
    employeeNumber: 'KC-0001',
    hireDate: '2020-01-01',
    phone: '+94 77 000 0001',
    location: 'Azure Operations Center (Colombo / Southeast Asia)',
  })

  // 5. LEAVE BALANCES
  const LEAVE_BALANCES: any[] = []
  const statutoryTypes = [
    { type: 'annual', name: 'Annual Leave', allowance: 14 },
    { type: 'casual', name: 'Casual Leave', allowance: 7 },
    { type: 'medical', name: 'Medical Leave', allowance: 14 },
    { type: 'maternity', name: 'Maternity Leave', allowance: 84 },
  ]

  USERS.forEach((u, uIdx) => {
    statutoryTypes.forEach((st, sIdx) => {
      const used = (uIdx + sIdx) % (st.type === 'casual' ? 4 : st.type === 'annual' ? 6 : 3)
      LEAVE_BALANCES.push({
        id: `bal-${u.id}-${st.type}`,
        tenantId: u.tenantId,
        userId: u.id,
        leaveType: st.type,
        year: 2026,
        allocated: st.allowance,
        used,
        pending: (uIdx % 4 === 0 && st.type === 'annual') ? 2 : 0,
        remaining: Math.max(0, st.allowance - used),
      })
    })
  })

  // 6. LEAVE REQUESTS
  const LEAVE_REQUESTS: any[] = []

  const pendingScenarios = [
    { empId: 'user-sb-emp-1007', mgrId: 'user-sb-mgr-1', type: 'Annual Leave', code: 'annual', days: 3, reason: 'Family pilgrimage to Kataragama and ancestral home visit', start: '2026-10-14', end: '2026-10-16' },
    { empId: 'user-sb-emp-1020', mgrId: 'user-sb-mgr-2', type: 'Casual Leave', code: 'casual', days: 2, reason: 'Child school admission interview and document submission at Kingswood College', start: '2026-10-19', end: '2026-10-20' },
    { empId: 'user-sb-emp-1034', mgrId: 'user-sb-mgr-3', type: 'Medical Leave', code: 'medical', days: 2, reason: 'Routine medical examination and doctor consultation at Asiri Hospital Galle', start: '2026-10-15', end: '2026-10-16' },
    { empId: 'user-sb-emp-1048', mgrId: 'user-sb-mgr-4', type: 'Annual Leave', code: 'annual', days: 4, reason: 'Attending family wedding ceremony and related social obligations in Kurunegala', start: '2026-10-22', end: '2026-10-25' },
    { empId: 'user-sb-emp-1062', mgrId: 'user-sb-mgr-5', type: 'Casual Leave', code: 'casual', days: 2, reason: 'Personal property registration at land registry office', start: '2026-10-16', end: '2026-10-17' },
    { empId: 'user-ks-emp-2012', mgrId: 'user-ks-mgr-1', type: 'Casual Leave', code: 'casual', days: 2, reason: 'Urgent home renovation repair and family commitment', start: '2026-10-15', end: '2026-10-16' },
    { empId: 'user-ks-emp-2020', mgrId: 'user-ks-mgr-2', type: 'Annual Leave', code: 'annual', days: 3, reason: 'Personal vacation with family to Nuwara Eliya', start: '2026-10-21', end: '2026-10-23' },
    { empId: 'user-ks-emp-2029', mgrId: 'user-ks-mgr-3', type: 'Medical Leave', code: 'medical', days: 1, reason: 'Dental appointment and root canal procedure at Colombo Dental Institute', start: '2026-10-14', end: '2026-10-14' },
    { empId: 'user-ks-emp-2038', mgrId: 'user-ks-mgr-4', type: 'Casual Leave', code: 'casual', days: 2, reason: 'Visiting parents in Matara for religious ceremony', start: '2026-10-18', end: '2026-10-19' },
    { empId: 'user-sn-emp-3008', mgrId: 'user-sn-mgr-1', type: 'Medical Leave', code: 'medical', days: 2, reason: 'Viral fever rest as prescribed by medical practitioner (MC attached)', start: '2026-10-14', end: '2026-10-15' },
    { empId: 'user-sn-emp-3010', mgrId: 'user-sn-mgr-2', type: 'Annual Leave', code: 'annual', days: 3, reason: 'Family trip during school vacation to Anuradhapura', start: '2026-10-20', end: '2026-10-22' },
  ]

  pendingScenarios.forEach((sc, idx) => {
    const emp = USERS.find(u => u.id === sc.empId)
    const mgr = USERS.find(u => u.id === sc.mgrId)
    if (emp && mgr) {
      LEAVE_REQUESTS.push({
        id: `leave-pending-${idx + 1}`,
        tenantId: emp.tenantId,
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        managerId: mgr.id,
        managerName: mgr.name,
        leaveTypeName: sc.type,
        leaveTypeCode: sc.code,
        startDate: sc.start,
        endDate: sc.end,
        requestedDays: sc.days,
        reason: sc.reason,
        status: 'pending',
        createdAt: '2026-10-08T08:30:00Z',
        priorLeavesCount: 2,
        approvalHistory: [],
      })
    }
  })

  // Active Approved Leaves in October 2026 (for live schedule matrix & availability calendar)
  const activeApprovedScenarios = [
    // Sampath Bank - Dinesh Weerasinghe's team (Colombo Fort Head Office Branch)
    { empId: 'user-sb-emp-1008', mgrId: 'user-sb-mgr-1', type: 'Annual Leave', code: 'annual', days: 2, reason: 'Family vacation to Kandy and ancestral home visit', start: '2026-10-13', end: '2026-10-14' },
    { empId: 'user-sb-emp-1011', mgrId: 'user-sb-mgr-1', type: 'Medical Leave', code: 'medical', days: 1, reason: 'Outpatient consultation and prescription rest (MC attached)', start: '2026-10-09', end: '2026-10-09' },
    { empId: 'user-sb-emp-1013', mgrId: 'user-sb-mgr-1', type: 'Casual Leave', code: 'casual', days: 1, reason: 'Personal legal documentation and land registry appointment', start: '2026-10-14', end: '2026-10-14' },
    { empId: 'user-sb-emp-1014', mgrId: 'user-sb-mgr-1', type: 'Annual Leave', code: 'annual', days: 2, reason: 'Attending family religious ceremony in Galle', start: '2026-10-12', end: '2026-10-13' },
    { empId: 'user-sb-emp-1016', mgrId: 'user-sb-mgr-1', type: 'Casual Leave', code: 'casual', days: 2, reason: 'Child school sports meet and parent-teacher conference', start: '2026-10-15', end: '2026-10-16' },
    { empId: 'user-sb-emp-1017', mgrId: 'user-sb-mgr-1', type: 'Medical Leave', code: 'medical', days: 1, reason: 'Dental appointment and recovery', start: '2026-10-16', end: '2026-10-16' },

    // Sampath Bank - Kandy Super Branch (user-sb-mgr-2 team)
    { empId: 'user-sb-emp-1022', mgrId: 'user-sb-mgr-2', type: 'Casual Leave', code: 'casual', days: 1, reason: 'Family commitment in Peradeniya', start: '2026-10-09', end: '2026-10-09' },
    { empId: 'user-sb-emp-1025', mgrId: 'user-sb-mgr-2', type: 'Annual Leave', code: 'annual', days: 3, reason: 'Annual holiday with family', start: '2026-10-13', end: '2026-10-15' },
    { empId: 'user-sb-emp-1028', mgrId: 'user-sb-mgr-2', type: 'Medical Leave', code: 'medical', days: 1, reason: 'Doctor consultation at Kandy General Hospital', start: '2026-10-16', end: '2026-10-16' },

    // Keells Super - Priyantha Rathnayake's team (Crescat Boulevard Superstore)
    { empId: 'user-ks-emp-2008', mgrId: 'user-ks-mgr-1', type: 'Casual Leave', code: 'casual', days: 2, reason: 'Personal matters and family assistance', start: '2026-10-12', end: '2026-10-13' },
    { empId: 'user-ks-emp-2010', mgrId: 'user-ks-mgr-1', type: 'Medical Leave', code: 'medical', days: 1, reason: 'Outpatient clinic consultation', start: '2026-10-09', end: '2026-10-09' },
    { empId: 'user-ks-emp-2014', mgrId: 'user-ks-mgr-1', type: 'Annual Leave', code: 'annual', days: 3, reason: 'Family pilgrimage to Kataragama', start: '2026-10-14', end: '2026-10-16' },

    // Singer PLC - Ashen Senanayake's team (Colombo Showroom)
    { empId: 'user-sn-emp-3002', mgrId: 'user-sn-mgr-1', type: 'Casual Leave', code: 'casual', days: 2, reason: 'Home renovation repair work', start: '2026-10-13', end: '2026-10-14' },
    { empId: 'user-sn-emp-3004', mgrId: 'user-sn-mgr-1', type: 'Annual Leave', code: 'annual', days: 1, reason: 'Personal holiday', start: '2026-10-09', end: '2026-10-09' },
    { empId: 'user-sn-emp-3006', mgrId: 'user-sn-mgr-1', type: 'Medical Leave', code: 'medical', days: 2, reason: 'Medical rest prescribed by doctor', start: '2026-10-15', end: '2026-10-16' },
  ]

  activeApprovedScenarios.forEach((sc, idx) => {
    const emp = USERS.find(u => u.id === sc.empId)
    const mgr = USERS.find(u => u.id === sc.mgrId)
    if (emp && mgr) {
      LEAVE_REQUESTS.push({
        id: `leave-approved-oct-${idx + 1}`,
        tenantId: emp.tenantId,
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        managerId: mgr.id,
        managerName: mgr.name,
        leaveTypeName: sc.type,
        leaveTypeCode: sc.code,
        startDate: sc.start,
        endDate: sc.end,
        requestedDays: sc.days,
        reason: sc.reason,
        status: 'approved',
        createdAt: '2026-10-06T09:00:00Z',
        priorLeavesCount: 1,
        approvalHistory: [
          {
            action: 'Approved',
            actorName: mgr.name,
            timestamp: '2026-10-07T10:00:00Z',
            comments: 'Approved based on branch operational coverage guidelines.',
          },
        ],
      })
    }
  })

  // Historical Approved & Rejected requests
  USERS.slice(0, 45).forEach((u, uIdx) => {
    const statuses: Array<'approved' | 'rejected'> = ['approved', 'approved', 'rejected', 'approved']
    const status = statuses[uIdx % statuses.length]
    const m = (uIdx % 7) + 2
    LEAVE_REQUESTS.push({
      id: `leave-hist-${u.id}`,
      tenantId: u.tenantId,
      employeeId: u.id,
      employeeName: u.name,
      department: u.department,
      managerId: u.managerId || 'user-sb-mgr-1',
      managerName: u.managerName || 'Dinesh Weerasinghe',
      leaveTypeName: uIdx % 2 === 0 ? 'Annual Leave' : 'Casual Leave',
      leaveTypeCode: uIdx % 2 === 0 ? 'annual' : 'casual',
      startDate: `2026-0${m}-12`,
      endDate: `2026-0${m}-14`,
      requestedDays: 3,
      reason: `Personal leave taken in month 0${m} under Sri Lankan statutory entitlements`,
      status,
      createdAt: `2026-0${m}-05T09:00:00Z`,
      priorLeavesCount: uIdx % 4,
      approvalHistory: [
        {
          action: status === 'approved' ? 'Approved' : 'Rejected',
          actorName: u.managerName || 'Branch Manager',
          timestamp: `2026-0${m}-06T10:30:00Z`,
          comments: status === 'approved' ? 'Approved based on branch operational coverage guidelines.' : 'Rejected due to month-end branch audit schedule.',
        },
      ],
    })
  })

  // 7. ATTENDANCE RECORDS
  const ATTENDANCE_RECORDS: any[] = []
  USERS.slice(0, 50).forEach((u, uIdx) => {
    for (let day = 1; day <= 10; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`
      const isLate = (uIdx + day) % 9 === 0
      const checkInHour = isLate ? '09:12:00' : '08:26:00'
      const status = isLate ? 'Late' : 'Present'
      ATTENDANCE_RECORDS.push({
        id: `att-${u.id}-2026-10-${dayStr}`,
        tenantId: u.tenantId,
        userId: u.id,
        userName: u.name,
        date: `2026-10-${dayStr}`,
        clockIn: `2026-10-${dayStr}T${checkInHour}Z`,
        clockOut: `2026-10-${dayStr}T17:10:00Z`,
        totalHours: isLate ? 8.0 : 8.75,
        status,
        workMode: 'Office',
        location: u.branchName || u.location || 'Head Office',
      })
    }
  })

  // 8. PAYSLIPS (In LKR Currency)
  const PAYSLIPS: any[] = []
  const months = [
    { name: 'August', year: 2026, date: '2026-08-31', period: '08/01/2026 - 08/31/2026' },
    { name: 'September', year: 2026, date: '2026-09-30', period: '09/01/2026 - 09/30/2026' },
  ]

  USERS.forEach((u, idx) => {
    let basicSalary = 95000 + (idx % 25) * 4500
    if (u.role === 'manager') basicSalary = 260000 + (idx % 10) * 12000
    if (u.role === 'admin') basicSalary = 340000

    const costOfLivingAllowance = 25000
    const overtimePay = u.role === 'employee' ? 12500 : 0
    const grossSalary = basicSalary + costOfLivingAllowance + overtimePay

    const employeeEpf8 = Math.round(basicSalary * 0.08)
    const employerEpf12 = Math.round(basicSalary * 0.12)
    const employerEtf3 = Math.round(basicSalary * 0.03)

    let apitTax = 0
    if (grossSalary > 150000) {
      apitTax = Math.round((grossSalary - 150000) * 0.06)
    }

    const totalDeductions = employeeEpf8 + apitTax
    const netSalary = grossSalary - totalDeductions

    months.forEach((m) => {
      PAYSLIPS.push({
        id: `pay-${u.id}-${m.name.toLowerCase()}-2026`,
        tenantId: u.tenantId,
        employeeId: u.id,
        employeeName: u.name,
        periodMonth: m.name,
        periodYear: m.year,
        payPeriod: m.period,
        payDate: m.date,
        filingStatus: 'Resident',
        basicSalary,
        costOfLivingAllowance,
        overtimePay,
        grossSalary,
        grossPay: grossSalary,
        ytdGrossPay: grossSalary * 9,
        employeeEpf: employeeEpf8,
        employerEpf: employerEpf12,
        employerEtf: employerEtf3,
        preTaxDeductions: employeeEpf8,
        statutoryTaxes: apitTax,
        tax: apitTax,
        deductions: totalDeductions,
        totalDeductionsAndTaxes: totalDeductions,
        netSalary,
        netPay: netSalary,
        ytdNetPay: netSalary * 9,
        currency: 'LKR',
        status: 'Published',
        notes: `Statutory EPF/ETF remitted to Central Bank of Sri Lanka for ${m.name} ${m.year}.`,
      })
    })
  })

  // 9. HR POLICIES
  const POLICIES = [
    {
      id: 'pol-sl-1',
      tenantId: 'tenant-sampath',
      title: 'Shop and Office Employees Act No. 19 of 1954 Compliance Policy',
      category: 'Labor Law & Compliance',
      version: '3.2',
      fileSize: '1.8 MB',
      summary: 'Statutory working hours (8 hrs/day, 45 hrs/week), overtime computations (1.5x), and rest intervals under Sri Lankan labor laws.',
      keyTerms: ['Shop & Office Act', 'Working Hours', 'Statutory Overtime 1.5x'],
      uploadedAt: '2026-01-10T08:00:00Z',
      contentExcerpt: 'All employment contracts comply with Chapter 129 of the Shop and Office Employees (Regulation of Employment and Remuneration) Act.',
    },
    {
      id: 'pol-sl-2',
      tenantId: 'tenant-sampath',
      title: 'Statutory EPF & ETF Remittance Regulations (CBSL Guidelines)',
      category: 'Statutory Benefits & Payroll',
      version: '2.4',
      fileSize: '1.5 MB',
      summary: 'Mandatory employee 8% deduction, employer 12% EPF contribution, and employer 3% ETF contribution submitted to Central Bank of Sri Lanka before the last working day of each month.',
      keyTerms: ['EPF 8%', 'Employer EPF 12%', 'ETF 3%', 'Central Bank of Sri Lanka'],
      uploadedAt: '2026-01-15T09:00:00Z',
      contentExcerpt: 'Employees Provident Fund contributions are remitted electronically via the CRIB and CBSL EPF e-Return portal.',
    },
    {
      id: 'pol-sl-3',
      tenantId: 'tenant-keells',
      title: 'Keells Retail Shift Rostering & Overtime Protocol',
      category: 'Store Operations',
      version: '2.0',
      fileSize: '1.2 MB',
      summary: 'Guidelines for supermarket floor coverage, poya day roster rotation, and holiday overtime compensation.',
      keyTerms: ['Poya Day Coverage', 'Retail Shifts', 'Holiday Overtime'],
      uploadedAt: '2026-02-01T10:00:00Z',
      contentExcerpt: 'Staff rostered on statutory Poya days receive double remuneration or alternate compensatory day-off as per Mercantile regulations.',
    },
    {
      id: 'pol-sl-4',
      tenantId: 'tenant-singer',
      title: 'Singer Retail Showroom Operations & Health Safety Standards',
      category: 'Showroom Guidelines',
      version: '1.8',
      fileSize: '1.4 MB',
      summary: 'Operational conduct, customer consumer credit underwriting, and showroom safety guidelines.',
      keyTerms: ['Hire Purchase Guidelines', 'Customer Service', 'Cash Handling'],
      uploadedAt: '2026-02-15T11:00:00Z',
      contentExcerpt: 'All showroom personnel undergo biannual training on Consumer Protection Act compliance and inventory tracking.',
    },
  ]

  // 10. DOCUMENT REQUESTS
  const DOCUMENT_REQUESTS = [
    {
      id: 'doc-req-1001',
      tenantId: 'tenant-sampath',
      employeeId: 'user-sb-emp-1007',
      employeeName: 'Nalaka Perera',
      documentType: 'Service Letter & Salary Certificate',
      purpose: 'Housing Loan Application at BOC',
      status: 'signed',
      createdAt: '2026-10-02T09:00:00Z',
      aiVerification: {
        identityVerified: true,
        verificationNotes: 'AI Identity Verified: Active Full-Time Permanent Employee (Colombo Fort).',
        policyCheckPassed: true,
      },
      managerSignatureDetails: {
        signedBy: 'Dinesh Weerasinghe',
        signedById: 'user-sb-mgr-1',
        signedAt: '2026-10-02T11:15:22Z',
        mobile2faVerified: true,
        phoneNumberMasked: '+94 77 *** 4567',
        signatureHash: 'SIG-2FA-SB-7782-99B1',
      },
    },
    {
      id: 'doc-req-2001',
      tenantId: 'tenant-keells',
      employeeId: 'user-ks-emp-2012',
      employeeName: 'Kasun Gunaratne',
      documentType: 'Salary Certificate',
      purpose: 'Vehicle Lease Facility',
      status: 'signed',
      createdAt: '2026-10-04T10:30:00Z',
      aiVerification: {
        identityVerified: true,
        verificationNotes: 'AI Identity Verified: Active Retail Team Member (Crescat).',
        policyCheckPassed: true,
      },
      managerSignatureDetails: {
        signedBy: 'Priyantha Rathnayake',
        signedById: 'user-ks-mgr-1',
        signedAt: '2026-10-04T14:20:10Z',
        mobile2faVerified: true,
        phoneNumberMasked: '+94 77 *** 1122',
        signatureHash: 'SIG-2FA-KS-5512-88C4',
      },
    },
  ]

  // 11. NOTIFICATIONS
  const NOTIFICATIONS = [
    {
      id: 'notif-sb-1',
      tenantId: 'tenant-sampath',
      recipientId: 'user-sb-emp-1007',
      title: 'Salary Certificate Ready',
      message: 'Your official salary certificate for BOC Housing Loan has been verified, signed with 2FA, and is ready for download.',
      read: true,
      createdAt: '2026-10-02T11:20:00Z',
    },
    {
      id: 'notif-sb-2',
      tenantId: 'tenant-sampath',
      recipientId: 'user-sb-mgr-1',
      title: 'New Leave Request Submitted',
      message: 'Nalaka Perera (SB-1007) has submitted an Annual Leave request for Oct 14-16 awaiting your review.',
      read: false,
      createdAt: '2026-10-08T08:35:00Z',
    },
    {
      id: 'notif-ks-1',
      tenantId: 'tenant-keells',
      recipientId: 'user-ks-mgr-1',
      title: 'New Leave Request Submitted',
      message: 'Kasun Gunaratne (KS-2012) submitted a Casual Leave request awaiting manager authorization.',
      read: false,
      createdAt: '2026-10-08T08:36:00Z',
    },
    {
      id: 'notif-sn-1',
      tenantId: 'tenant-singer',
      recipientId: 'user-sn-mgr-1',
      title: 'New Leave Request Submitted',
      message: 'Sahan Alahakoon (SNG-3008) submitted a Medical Leave request awaiting review.',
      read: false,
      createdAt: '2026-10-08T08:37:00Z',
    },
  ]

  // 12. AUDIT LOGS
  const AUDIT_LOGS = [
    {
      id: 'aud-sb-1',
      tenantId: 'tenant-sampath',
      tenantName: 'Sampath Bank PLC',
      timestamp: '2026-10-02 11:15:22',
      userId: 'user-sb-mgr-1',
      userName: 'Dinesh Weerasinghe',
      userRole: 'manager',
      action: 'Document 2FA Digital Sign',
      resource: 'Document #doc-req-1001 (Salary Certificate)',
      result: 'Success',
      riskLevel: 'Low',
      details: 'Manager verified National ID credentials and signed official certificate with SMS OTP.',
    },
    {
      id: 'aud-ks-1',
      tenantId: 'tenant-keells',
      tenantName: 'Keells Supermarkets',
      timestamp: '2026-10-04 14:20:10',
      userId: 'user-ks-mgr-1',
      userName: 'Priyantha Rathnayake',
      userRole: 'manager',
      action: 'Document 2FA Digital Sign',
      resource: 'Document #doc-req-2001 (Salary Certificate)',
      result: 'Success',
      riskLevel: 'Low',
      details: 'Store General Manager authorized employee service verification.',
    },
  ]

  return {
    ORGANIZATIONS,
    DEPARTMENTS,
    BRANCHES,
    USERS,
    LEAVE_BALANCES,
    LEAVE_REQUESTS,
    ATTENDANCE_RECORDS,
    PAYSLIPS,
    POLICIES,
    DOCUMENT_REQUESTS,
    NOTIFICATIONS,
    AUDIT_LOGS,
  }
}
