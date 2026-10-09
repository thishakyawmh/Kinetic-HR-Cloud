import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeService } from '@/services/employeeService'
import { branchService } from '@/services/branchService'
import { policyService } from '@/services/policyService'
import { User, UserRole, PolicyDocument } from '@/types'
import { PageHeader } from '@/components/common/PageHeader'
import { PolicyCard } from '@/components/policy/PolicyCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  Search,
  UserPlus,
  Edit2,
  Building,
  Building2,
  Users,
  CheckCircle2,
  Sparkles,
  Fingerprint,
  ShieldCheck,
  FileText,
  BookOpen,
  UploadCloud,
  Download,
  Plus,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  ArrowRight,
  ArrowLeft,
  Eye,
  Globe,
  Layers,
  Mail,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Briefcase,
  Heart,
  CalendarDays,
} from 'lucide-react'

// Helper to retrieve simple dependent info if available for an employee
const getEmployeeDependents = (emp: User) => {
  const dependentDirectory: Record<string, { name: string; relation: string; contact?: string; covered: boolean }[]> = {
    'user-david': [{ name: 'Clara Wilson', relation: 'Spouse', contact: '+1 (555) 443-8999', covered: true }],
    'user-sarah': [{ name: 'Lucas Miller', relation: 'Child (Son)', contact: '+1 (555) 789-0199', covered: true }],
    'user-carlos': [{ name: 'Maria Mendoza', relation: 'Spouse', contact: '+1 (555) 234-9988', covered: true }],
    'user-claire': [{ name: 'Frank Underwood', relation: 'Spouse', contact: '+1 (555) 678-1122', covered: true }],
    'user-brandon': [],
  }

  if (dependentDirectory[emp.id]) {
    return dependentDirectory[emp.id]
  }

  if ((emp as any).dependents && Array.isArray((emp as any).dependents)) {
    return (emp as any).dependents
  }

  // Deterministic seed for other employees
  if (emp.name.length % 2 === 0) {
    return [
      { name: `${emp.name.split(' ')[0]}'s Spouse`, relation: 'Spouse', contact: '+94 77 123 4567', covered: true },
    ]
  }

  return []
}

const departmentLeaveConfigs = [
  {
    name: 'Annual Leave',
    allowance: '20 days',
    approval: 'Required (Direct Manager)',
    carryForward: 'Max 5 days into Q1',
    emergency: 'No',
    thresholdRule: 'Checked against 70% department presence quota',
  },
  {
    name: 'Sick Leave',
    allowance: '10 days',
    approval: 'Auto-approved up to 2 days',
    carryForward: 'Non-accruing (Resets Jan 1)',
    emergency: 'No',
    thresholdRule: 'Medical cert required if > 3 days',
  },
  {
    name: 'Emergency Leave',
    allowance: '3 days',
    approval: 'Required (Expedited SLA)',
    carryForward: 'Non-accruing',
    emergency: 'Yes (Dependent Illness Sec 4.2)',
    thresholdRule: 'AI Evaluated with Manager Override',
  },
  {
    name: 'Casual Leave',
    allowance: '5 days',
    approval: 'Required',
    carryForward: 'None',
    emergency: 'No',
    thresholdRule: '48hr notice required',
  },
  {
    name: 'Unpaid / Special Leave',
    allowance: 'Discretionary',
    approval: 'Required (HR Admin + Manager)',
    carryForward: 'N/A',
    emergency: 'Case by Case',
    thresholdRule: 'Requires Executive Sign-Off',
  },
]

export const AdminEmployees: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  const isWorkforceRoute = location.pathname.includes('/employees') || location.pathname === '/admin/workforce'

  // Expandable row state for workforce directory table
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null)
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all')

  const toggleExpandEmp = (id: string) => {
    setExpandedEmpId(prev => (prev === id ? null : id))
  }

  // Workspace Mode: 'departments' (Multiple divisions) vs 'company' (Single company workspace)
  const [workspaceMode, setWorkspaceMode] = useState<'departments' | 'company'>('departments')

  // Selection Modal state for "+ Add New Workspace"
  const [isAddWorkspaceChoiceOpen, setIsAddWorkspaceChoiceOpen] = useState(false)

  // Show master employee directory by default if on Workforce Directory route
  const [showMasterDirectory, setShowMasterDirectory] = useState(isWorkforceRoute)

  useEffect(() => {
    const isEmployees = location.pathname.includes('/employees') || location.pathname === '/admin/workforce'
    setShowMasterDirectory(isEmployees)
    if (isEmployees) {
      setSelectedDept(null)
    }
  }, [location.pathname])

  // Three dots menu open state for department cards
  const [activeMenuDept, setActiveMenuDept] = useState<string | null>(null)

  // Expanded Department Card state for inline Employee Directory viewing
  const [expandedDept, setExpandedDept] = useState<string | null>(null)

  // Search & Filters for Master Directory
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all')
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all')

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingDept, setEditingDept] = useState<any | null>(null)

  // Single Employee Form State
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newIdNumber, setNewIdNumber] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newBranchId, setNewBranchId] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('employee')
  const [newDept, setNewDept] = useState('Unassigned')
  const [newTitle, setNewTitle] = useState('')
  const [newBiometricCaptured, setNewBiometricCaptured] = useState(false)
  const [newBiometricToken, setNewBiometricToken] = useState('')
  const [isCapturingBiometric, setIsCapturingBiometric] = useState(false)

  const handleCaptureBiometric = () => {
    setIsCapturingBiometric(true)
    setTimeout(() => {
      setIsCapturingBiometric(false)
      setNewBiometricCaptured(true)
      const token = `FP-${Math.floor(1000 + Math.random() * 9000)}-ACT`
      setNewBiometricToken(token)
    }, 750)
  }

  // Inside Department View State
  const [selectedDept, setSelectedDept] = useState<any | null>(null)
  const [deptActiveTab, setDeptActiveTab] = useState<'staff' | 'rules' | 'policies'>('staff')
  const [deptSearchTerm, setDeptSearchTerm] = useState('')
  const [selectedPolicyDoc, setSelectedPolicyDoc] = useState<PolicyDocument | null>(null)
  const [policySearchTerm, setPolicySearchTerm] = useState('')

  // Add / Edit Policy Modal State (Unified with Azure Blob Document details)
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false)
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null)
  const [editPolicyTitle, setEditPolicyTitle] = useState('')
  const [editPolicyCategory, setEditPolicyCategory] = useState<string>('Leave & Attendance')
  const [editPolicyVersion, setEditPolicyVersion] = useState('1.0')
  const [editPolicyFileName, setEditPolicyFileName] = useState('')
  const [editPolicyFileSize, setEditPolicyFileSize] = useState('340 KB')
  const [editPolicySummary, setEditPolicySummary] = useState('')
  const [editPolicyExcerpt, setEditPolicyExcerpt] = useState('')
  const [editPolicyKeyTerms, setEditPolicyKeyTerms] = useState('')
  const [selectedPolicyFile, setSelectedPolicyFile] = useState<File | null>(null)
  const [isSavingPolicy, setIsSavingPolicy] = useState(false)

  const handleOpenAddPolicy = () => {
    setEditingPolicyId(null)
    setEditPolicyTitle('')
    setEditPolicyCategory('Leave & Attendance')
    setEditPolicyVersion('1.0')
    setEditPolicyFileName('')
    setEditPolicyFileSize('340 KB')
    setEditPolicySummary('')
    setEditPolicyExcerpt('')
    setEditPolicyKeyTerms(`Compliance, Policy, ${selectedDept?.name || 'Department'}`)
    setSelectedPolicyFile(null)
    setIsPolicyModalOpen(true)
  }

  const handleOpenEditPolicy = (policy: PolicyDocument) => {
    setEditingPolicyId(policy.id)
    setEditPolicyTitle(policy.title)
    setEditPolicyCategory(policy.category)
    setEditPolicyVersion(policy.version)
    setEditPolicyFileName(policy.fileName || `${policy.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_v${policy.version}.pdf`)
    setEditPolicyFileSize(policy.fileSize || '340 KB')
    setEditPolicySummary(policy.summary)
    setEditPolicyExcerpt(policy.contentExcerpt || '')
    setEditPolicyKeyTerms(policy.keyTerms.join(', '))
    setSelectedPolicyFile(null)
    setIsPolicyModalOpen(true)
  }

  const handleSavePolicy = async () => {
    if (!editPolicyTitle.trim()) return
    try {
      setIsSavingPolicy(true)
      const fileNameToUse = selectedPolicyFile
        ? selectedPolicyFile.name
        : (editPolicyFileName || `${editPolicyTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_v${editPolicyVersion}.pdf`)
      const fileSizeToUse = selectedPolicyFile
        ? `${Math.round(selectedPolicyFile.size / 1024)} KB`
        : editPolicyFileSize

      if (editingPolicyId) {
        await policyService.updatePolicy(editingPolicyId, {
          title: editPolicyTitle,
          category: editPolicyCategory,
          version: editPolicyVersion,
          summary: editPolicySummary,
          contentExcerpt: editPolicyExcerpt,
          fileName: fileNameToUse,
          fileSize: fileSizeToUse,
          keyTerms: editPolicyKeyTerms.split(',').map(t => t.trim()).filter(Boolean),
        })
      } else {
        await policyService.uploadPolicy({
          tenantId: tenant?.id || 'tenant-kinetic',
          title: editPolicyTitle,
          category: editPolicyCategory as any,
          version: editPolicyVersion,
          fileSize: fileSizeToUse,
          fileName: fileNameToUse,
          department: selectedDept?.name,
          summary: editPolicySummary || `Official ${selectedDept?.name} workspace policy document.`,
          keyTerms: editPolicyKeyTerms.split(',').map(t => t.trim()).filter(Boolean),
          contentExcerpt: editPolicyExcerpt || `Operational guidelines governing ${selectedDept?.name} workspace procedures and employee responsibilities.`,
        })
      }
      await queryClient.invalidateQueries({ queryKey: ['deptPolicies'] })
      await queryClient.invalidateQueries({ queryKey: ['adminPolicies'] })
      setIsPolicyModalOpen(false)
      setSelectedPolicyFile(null)
    } catch (err) {
      console.error('Failed to save policy:', err)
    } finally {
      setIsSavingPolicy(false)
    }
  }

  // Department Settings Edit Modal State
  const [isEditDeptModalOpen, setIsEditDeptModalOpen] = useState(false)
  const [editDeptName, setEditDeptName] = useState('')
  const [editDeptDesc, setEditDeptDesc] = useState('')
  const [editDeptHead, setEditDeptHead] = useState('')
  const [editDeptSla, setEditDeptSla] = useState('75% min staffing')

  // Add Employee Modal Mode & CSV Bulk Upload State
  const [addEmployeeMode, setAddEmployeeMode] = useState<'manual' | 'csv'>('manual')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvParsedRecords, setCsvParsedRecords] = useState<
    Array<{ name: string; email: string; department: string; jobTitle: string; role: UserRole }>
  >([])
  const [csvError, setCsvError] = useState<string | null>(null)
  const [isCsvImporting, setIsCsvImporting] = useState(false)
  const [csvSuccessMsg, setCsvSuccessMsg] = useState<string | null>(null)

  // Assign Staff to Department Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [assignSearchTerm, setAssignSearchTerm] = useState('')
  const [selectedAssignUserId, setSelectedAssignUserId] = useState<string>('')
  const [assignSuccessMsg, setAssignSuccessMsg] = useState<string | null>(null)

  // Download Sample CSV Roster Template
  const handleDownloadSampleCsv = () => {
    const sampleContent =
      'Name,Email,Department,Job Title,Role\n' +
      'Alexander Wright,alex.wright@kinetictech.io,Engineering,Senior Cloud Engineer,employee\n' +
      'Elena Rostova,elena.rostova@kinetictech.io,Product,Lead UX Designer,employee\n' +
      'Marcus Vance,marcus.vance@kinetictech.io,Operations,DevOps Specialist,employee\n' +
      'Sarah Chen,sarah.chen@kinetictech.io,Human Resources,People Partner,employee'
    const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'kinetic_employees_sample.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handle CSV file selection & parsing
  const handleCsvFileUpload = (file: File) => {
    setCsvFile(file)
    setCsvError(null)
    setCsvSuccessMsg(null)
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const text = e.target?.result as string
        if (!text) {
          setCsvError('Uploaded file is empty.')
          setCsvParsedRecords([])
          return
        }
        const lines = text.trim().split(/\r?\n/).filter(l => l.trim().length > 0)
        if (lines.length < 2) {
          setCsvError('CSV must have a header line and at least 1 employee row.')
          setCsvParsedRecords([])
          return
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
        const nameIdx = headers.findIndex(h => h.includes('name'))
        const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'))
        const deptIdx = headers.findIndex(h => h.includes('dept') || h.includes('department') || h.includes('division'))
        const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('designation') || h.includes('job'))
        const roleIdx = headers.findIndex(h => h === 'role' || h.includes('userrole') || h.includes('access'))

        const parsed: Array<{ name: string; email: string; department: string; jobTitle: string; role: UserRole }> = []

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''))
          const name = nameIdx >= 0 && cols[nameIdx] ? cols[nameIdx] : cols[0] || ''
          const email = emailIdx >= 0 && cols[emailIdx] ? cols[emailIdx] : cols[1] || ''
          const dept = deptIdx >= 0 && cols[deptIdx] ? cols[deptIdx] : cols[2] || newDept || 'Engineering'
          const jobTitle = titleIdx >= 0 && cols[titleIdx] ? cols[titleIdx] : cols[3] || 'Staff Member'
          const rawRole = roleIdx >= 0 && cols[roleIdx] ? cols[roleIdx].toLowerCase() : 'employee'
          const role: UserRole = rawRole.includes('admin') ? 'admin' : rawRole.includes('manager') ? 'manager' : 'employee'

          if (name && email) {
            parsed.push({ name, email, department: dept, jobTitle, role })
          }
        }

        if (parsed.length === 0) {
          setCsvError('Could not find valid employee entries with Name and Email.')
        } else {
          setCsvParsedRecords(parsed)
        }
      } catch (err: any) {
        setCsvError('Failed to parse CSV file: ' + (err.message || 'Unknown format error'))
        setCsvParsedRecords([])
      }
    }
    reader.readAsText(file)
  }

  // Run Bulk CSV Import
  const handleRunBulkCsvImport = async () => {
    if (!tenant || csvParsedRecords.length === 0) return
    setIsCsvImporting(true)
    try {
      for (const item of csvParsedRecords) {
        await employeeService.createEmployee({
          tenantId: tenant.id,
          name: item.name,
          email: item.email,
          role: item.role,
          department: item.department,
          jobTitle: item.jobTitle || 'Specialist',
          employeeNumber: (item as any).employeeNumber || (
            item.role === 'admin' ? `A-${Math.floor(1000 + Math.random() * 9000)}` :
            item.role === 'manager' ? `M-${Math.floor(1000 + Math.random() * 9000)}` :
            `KT-${Math.floor(1000 + Math.random() * 9000)}`
          ),
          hireDate: new Date().toISOString().split('T')[0],
        })
      }
      await refetchEmployees()
      await refetchDepts()
      setCsvSuccessMsg(`Successfully imported and provisioned ${csvParsedRecords.length} employees!`)
      setTimeout(() => {
        setIsAddModalOpen(false)
        setCsvParsedRecords([])
        setCsvFile(null)
        setCsvSuccessMsg(null)
        setIsCsvImporting(false)
      }, 1000)
    } catch (err: any) {
      setCsvError('Failed during bulk import: ' + err.message)
      setIsCsvImporting(false)
    }
  }

  // Assign Existing Staff Member to Selected Department
  const handleAssignStaffToDept = async () => {
    if (!selectedAssignUserId || !selectedDept) return
    try {
      await employeeService.updateEmployee(selectedAssignUserId, {
        department: selectedDept.name,
      })
      await refetchEmployees()
      await refetchDepts()
      const assignedUser = employees.find(e => e.id === selectedAssignUserId)
      setAssignSuccessMsg(`Successfully assigned ${assignedUser?.name || 'Staff Member'} to ${selectedDept.name}!`)
      setTimeout(() => {
        setIsAssignModalOpen(false)
        setSelectedAssignUserId('')
        setAssignSearchTerm('')
        setAssignSuccessMsg(null)
      }, 900)
    } catch (err: any) {
      console.error('Failed to assign employee to department:', err)
    }
  }

  // Department Rules State
  const [deptLeadInput, setDeptLeadInput] = useState('')
  const [deptSlaInput, setDeptSlaInput] = useState('75% min staffing')
  const [deptDescInput, setDeptDescInput] = useState('')
  const [aiAutoApproval, setAiAutoApproval] = useState(true)
  const [maxConcurrentLeaves, setMaxConcurrentLeaves] = useState('2 Members')
  const [leaveNoticeDays, setLeaveNoticeDays] = useState('3 Days Notice')
  const [coreHours, setCoreHours] = useState('08:30 - 17:00')
  const [rulesSavedMsg, setRulesSavedMsg] = useState(false)

  // Per-department Leave Rules mapping
  const [deptLeaveRulesMap, setDeptLeaveRulesMap] = useState<Record<string, typeof departmentLeaveConfigs>>({})

  // Leave Rule Editing Modal State
  const [editingLeaveRule, setEditingLeaveRule] = useState<{
    index: number
    name: string
    allowance: string
    approval: string
    carryForward: string
    emergency: string
    thresholdRule: string
  } | null>(null)

  const currentDeptLeaveRules = selectedDept
    ? (deptLeaveRulesMap[selectedDept.name] || selectedDept.leaveRules || departmentLeaveConfigs)
    : departmentLeaveConfigs

  const handleSaveLeaveRule = (updatedRule: typeof departmentLeaveConfigs[0], index: number) => {
    if (!selectedDept) return
    const updated = [...currentDeptLeaveRules]
    updated[index] = updatedRule
    setDeptLeaveRulesMap(prev => ({
      ...prev,
      [selectedDept.name]: updated,
    }))
    selectedDept.leaveRules = updated
    setEditingLeaveRule(null)
    setRulesSavedMsg(true)
    setTimeout(() => setRulesSavedMsg(false), 3000)
  }

  useEffect(() => {
    if (selectedDept) {
      setDeptLeadInput(selectedDept.head || '')
      setDeptSlaInput(selectedDept.threshold || '75% min staffing')
      setDeptDescInput(selectedDept.description || '')
      if (selectedDept.aiAutoApproval !== undefined) setAiAutoApproval(selectedDept.aiAutoApproval)
      if (selectedDept.maxConcurrentLeaves) setMaxConcurrentLeaves(selectedDept.maxConcurrentLeaves)
      if (selectedDept.leaveNoticeDays) setLeaveNoticeDays(selectedDept.leaveNoticeDays)
      if (selectedDept.coreHours) setCoreHours(selectedDept.coreHours)
    }
  }, [selectedDept])

  // Queries
  const { data: rawEmployees = [], refetch: refetchEmployees } = useQuery({
    queryKey: ['adminEmployees', tenant?.id, selectedDeptFilter],
    queryFn: () => (tenant?.id ? employeeService.getEmployees(tenant.id, selectedDeptFilter) : []),
    enabled: !!tenant?.id,
  })

  // Exclude platform_admin role - platform administration belongs to SaaS fleet, not the tenant organization
  const employees = rawEmployees.filter(e => e.role !== 'platform_admin')

  const { data: departments = [], refetch: refetchDepts } = useQuery({
    queryKey: ['adminDepartments', tenant?.id],
    queryFn: () => employeeService.getDepartments(tenant?.id),
    enabled: !!tenant?.id,
  })

  // Branches Query for tenant location allocation
  const { data: branches = [] } = useQuery({
    queryKey: ['adminBranches', tenant?.id],
    queryFn: () => (tenant?.id ? branchService.getBranches(tenant.id) : []),
    enabled: !!tenant?.id,
  })

  // Department Policies Query
  const { data: deptPolicies = [] } = useQuery({
    queryKey: ['deptPolicies', tenant?.id],
    queryFn: () => (tenant?.id ? policyService.getPolicies(tenant.id) : []),
    enabled: !!tenant?.id,
  })

  // Add Single Employee Mutation
  const addEmployeeMutation = useMutation({
    mutationFn: () => {
      if (!tenant) throw new Error('No tenant')
      return employeeService.createEmployee({
        tenantId: tenant.id,
        name: newName,
        email: newEmail,
        idNumber: newIdNumber || undefined,
        phone: newPhone || undefined,
        branchId: newBranchId || undefined,
        branchName: newLocation || undefined,
        location: newLocation || undefined,
        address: newAddress || undefined,
        password: newIdNumber || 'password123',
        role: newRole,
        department: selectedDept ? selectedDept.name : 'Unassigned',
        jobTitle: 'Pending Assignment',
        biometricStatus: newBiometricCaptured ? `Linked (${newBiometricToken})` : 'Pending Employee Capture',
        employeeNumber: (
          newRole === 'admin' ? `A-${Math.floor(1000 + Math.random() * 9000)}` :
          newRole === 'manager' ? `M-${Math.floor(1000 + Math.random() * 9000)}` :
          `KT-${Math.floor(1000 + Math.random() * 9000)}`
        ),
        hireDate: new Date().toISOString().substring(0, 10),
      })
    },
    onSuccess: () => {
      refetchEmployees()
      refetchDepts()
      setIsAddModalOpen(false)
      setNewName('')
      setNewEmail('')
      setNewIdNumber('')
      setNewPhone('')
      setNewLocation('')
      setNewAddress('')
      setNewTitle('')
      setNewBiometricCaptured(false)
      setNewBiometricToken('')
    },
  })


  // Priority ordering: Admins at first, Managers at second, and then all other employees
  const getRolePriority = (role: string) => {
    if (role === 'admin') return 1
    if (role === 'manager') return 2
    return 3
  }

  // Filter & Sort Employees (Admins first, Managers second, then all other employees)
  const filteredEmployees = employees
    .filter(e => {
      if (e.role === 'platform_admin') return false

      const matchesSearch =
        !searchTerm.trim() ||
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.employeeNumber && e.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesDept = selectedDeptFilter === 'all' || e.department.toLowerCase() === selectedDeptFilter.toLowerCase()
      const matchesRole = selectedRoleFilter === 'all' || e.role.toLowerCase() === selectedRoleFilter.toLowerCase()
      const matchesBranch =
        selectedBranchFilter === 'all' ||
        e.branchId === selectedBranchFilter ||
        (e.branchName && e.branchName.toLowerCase() === selectedBranchFilter.toLowerCase()) ||
        (e.location && e.location.toLowerCase().includes(selectedBranchFilter.toLowerCase()))

      return matchesSearch && matchesDept && matchesRole && matchesBranch
    })
    .sort((a, b) => {
      const priorityDiff = getRolePriority(a.role) - getRolePriority(b.role)
      if (priorityDiff !== 0) return priorityDiff
      return a.name.localeCompare(b.name)
    })

  // Unique Department Names (excluding Cloud Platform Operations)
  const allDeptNames = Array.from(
    new Set([...departments.map((d: any) => d.name), ...employees.map(e => e.department)])
  ).filter(d => d && d !== 'Cloud Platform Operations')

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header (Hidden when inside department workspace view) */}
      {!selectedDept && (
        <PageHeader
          title={isWorkforceRoute ? 'Workforce Directory' : 'Workspace Directory'}
          subtitle={
            isWorkforceRoute
              ? 'Manage organization staff members, profiles, and assignments'
              : 'Manage department workspaces, operational divisions, and leadership'
          }
          showBorder={false}
        >
          {isWorkforceRoute ? (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-card border border-border/70 text-xs shadow-xs">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                <span className="text-muted-foreground font-medium">Active Staff:</span>
                <span className="font-extrabold text-foreground font-mono text-sm">{employees.length}</span>
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="bg-[#23ace3] hover:bg-[#1b97ca] text-white text-xs font-bold px-4 h-9 rounded-xl shadow-xs gap-1.5 cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add Employee</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-card border border-border/70 text-xs shadow-xs">
                <span className="flex h-2 w-2 rounded-full bg-[#23ace3] shrink-0 animate-pulse" />
                <span className="text-muted-foreground font-medium">Departments:</span>
                <span className="font-extrabold text-foreground font-mono text-sm">{allDeptNames.length}</span>
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/admin/workforce/create-workspace')}
                className="bg-[#23ace3] hover:bg-[#1b97ca] text-white text-xs font-bold px-4 h-9 rounded-xl shadow-xs gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Workspace</span>
              </Button>
            </div>
          )}
        </PageHeader>
      )}

      {/* ========================================================================= */}
      {/* MAIN CONTENT: WORKFORCE DIRECTORY vs WORKSPACE DIRECTORY                  */}
      {/* ========================================================================= */}
      {isWorkforceRoute ? (
        /* WORKFORCE DIRECTORY: TABULAR FORMAT WITH EXPANDABLE DETAILED RECORDS (NO DEPARTMENT CARDS!) */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-2xl border border-border/70 shadow-xs">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff by name, email, employee ID, or title..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 h-10 rounded-xl bg-background text-xs"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
              <Select
                value={selectedDeptFilter}
                onChange={e => setSelectedDeptFilter(e.target.value)}
                className="h-10 rounded-xl bg-background text-xs min-w-[170px]"
              >
                <option value="all">All Departments ({employees.length})</option>
                {allDeptNames.map((d: any) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>

              <Select
                value={selectedRoleFilter}
                onChange={e => setSelectedRoleFilter(e.target.value)}
                className="h-10 rounded-xl bg-background text-xs min-w-[120px]"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </Select>

              <Select
                value={selectedBranchFilter}
                onChange={e => setSelectedBranchFilter(e.target.value)}
                className="h-10 rounded-xl bg-background text-xs min-w-[150px]"
              >
                <option value="all">All Branches ({branches.length})</option>
                {branches.map(b => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
                <option value="Remote / Work From Home">Remote / WFH</option>
              </Select>
            </div>
          </div>

          {/* Tabular Roster with Expandable Rows */}
          <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-border/60">
                  <TableHead className="text-xs font-bold text-foreground pl-5">Staff Member</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">Department & Designation</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">System Role</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">Biometric & Status</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">Joined Date</TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs">
                      No staff members found matching "{searchTerm}".
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map(emp => {
                    const isExpanded = expandedEmpId === emp.id
                    return (
                      <React.Fragment key={emp.id}>
                        {/* Main Summary Row */}
                        <TableRow
                          onClick={() => toggleExpandEmp(emp.id)}
                          className={`border-border/40 hover:bg-muted/30 transition-colors cursor-pointer ${isExpanded ? 'bg-muted/20 border-b-transparent' : ''
                            }`}
                        >
                          <TableCell className="pl-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#23ace3]/15 font-black text-xs text-[#23ace3] border border-[#23ace3]/30 shrink-0">
                                {emp.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-xs text-foreground flex items-center gap-2">
                                  <span>{emp.name}</span>
                                  <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded-md border border-border/40">
                                    {emp.employeeNumber || `KT-${emp.id.slice(0, 4)}`}
                                  </span>
                                </div>
                                <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{emp.email}</div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            {emp.department && emp.department !== 'Unassigned' ? (
                              <>
                                <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                                  <Building className="h-3.5 w-3.5 text-[#23ace3]" />
                                  <span>{emp.department}</span>
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">{emp.jobTitle || 'Pending Assignment'}</div>
                                <div className="text-[10px] text-muted-foreground/80 mt-0.5 flex items-center gap-1">
                                  <MapPin className="h-2.5 w-2.5 text-[#23ace3]" />
                                  <span>{emp.branchName || emp.location || 'Colombo HQ'}</span>
                                </div>
                              </>
                            ) : (
                              <div>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] text-amber-500 border-amber-500/30 bg-amber-500/10 cursor-pointer hover:bg-amber-500/20"
                                  onClick={e => {
                                    e.stopPropagation()
                                    setEditingUser(emp)
                                  }}
                                  title="Click to assign to a workspace directory"
                                >
                                  Unassigned Workspace
                                </Badge>
                                <div className="text-[10px] text-muted-foreground mt-0.5">Pending Manager Role</div>
                              </div>
                            )}
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant={
                                emp.role === 'admin'
                                  ? 'destructive'
                                  : emp.role === 'manager'
                                    ? 'info'
                                    : 'outline'
                              }
                              className="text-[10px] capitalize font-mono"
                            >
                              {emp.role}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="success" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Active</span>
                              </Badge>
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                                <Fingerprint className="h-3 w-3 text-[#23ace3]" />
                                <span>Synced</span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground font-mono">{emp.hireDate}</TableCell>

                          <TableCell className="text-right pr-4" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpandEmp(emp.id)}
                                className="h-7 px-2.5 text-[11px] font-semibold text-[#23ace3] hover:bg-[#23ace3]/10 rounded-lg cursor-pointer"
                              >
                                {isExpanded ? 'Close' : 'Details'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingUser(emp)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg cursor-pointer"
                                title="Edit Staff Member"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Detailed Expanded Row View */}
                        {isExpanded && (
                          <TableRow className="bg-muted/15 border-b border-border/70 hover:bg-muted/15">
                            <TableCell colSpan={6} className="p-0">
                              <div className="p-5 border-l-4 border-l-[#23ace3] space-y-4 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs bg-[#23ace3]/10 border-[#23ace3]/30 text-[#23ace3] font-mono">
                                      Employee Dossier: {emp.employeeNumber || `KT-${emp.id.slice(0, 4)}`}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground font-medium">• {emp.name} ({emp.jobTitle})</span>
                                  </div>
                                  <span className="text-[11px] text-muted-foreground font-mono">
                                    System ID: {emp.id}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {/* Info Block 1: Contact & Identity */}
                                  <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-2">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                      <Mail className="h-3.5 w-3.5 text-[#23ace3]" />
                                      <span>Identity & Contact</span>
                                    </div>
                                    <div className="space-y-1.5 text-xs">
                                      <div>
                                        <div className="text-[10px] text-muted-foreground">Work Email</div>
                                        <div className="font-mono text-foreground font-semibold">{emp.email}</div>
                                      </div>
                                      <div>
                                        <div className="text-[10px] text-muted-foreground">National ID / NIC</div>
                                        <div className="font-mono text-foreground font-semibold">{emp.idNumber || 'Not Registered'}</div>
                                      </div>
                                      <div>
                                        <div className="text-[10px] text-muted-foreground">Contact Phone</div>
                                        <div className="font-mono text-foreground">{emp.phone || '+94 (11) 244-8800 ext. 420'}</div>
                                      </div>
                                      <div>
                                        <div className="text-[10px] text-muted-foreground">Assigned Branch / Location</div>
                                        <div className="text-foreground flex items-center gap-1">
                                          <MapPin className="h-3 w-3 text-[#23ace3] shrink-0" />
                                          <span>{emp.branchName || emp.location || 'Colombo Head Office'}</span>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-[10px] text-muted-foreground">Home Address</div>
                                        <div className="text-foreground">{emp.address || 'Confidential (HR Encrypted Vault)'}</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Info Block 2: Organization & Reporting */}
                                  <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-2">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                      <Building className="h-3.5 w-3.5 text-purple-400" />
                                      <span>Organization & Reporting</span>
                                    </div>
                                    <div className="space-y-1.5 text-xs">
                                      <div>
                                        <div className="text-[10px] text-muted-foreground">Department Division</div>
                                        <div className="font-semibold text-foreground">{emp.department}</div>
                                      </div>
                                      <div>
                                        <div className="text-[10px] text-muted-foreground">Reporting Lead</div>
                                        <div className="text-foreground font-medium">
                                          {departments.find((d: any) => d.name.toLowerCase() === emp.department.toLowerCase())?.head || 'Operations Lead'}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-[10px] text-muted-foreground">Employment Basis</div>
                                        <div className="text-emerald-400 font-medium">Permanent Full-Time</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Info Block 3: Biometrics & Shifts */}
                                  <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-2">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                      <Fingerprint className="h-3.5 w-3.5 text-emerald-400" />
                                      <span>Biometrics & Attendance</span>
                                    </div>
                                    <div className="space-y-1.5 text-xs">
                                      <div>
                                        <div className="text-[10px] text-muted-foreground">Hardware Token ID</div>
                                        <div className="font-mono text-foreground font-semibold">BIO-FP-{emp.id.substring(0, 6).toUpperCase()}</div>
                                      </div>
                                      <div>
                                        <div className="text-[10px] text-muted-foreground">Enrollment Status</div>
                                        <div className="text-emerald-400 font-medium flex items-center gap-1">
                                          <CheckCircle2 className="h-3 w-3" />
                                          <span>Verified (100% Quality)</span>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-[10px] text-muted-foreground">Assigned Shift Window</div>
                                        <div className="text-foreground font-mono">08:30 - 17:00 (Core)</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Info Block 4: Dependents & Emergency Contact */}
                                  {(() => {
                                    const dependents = getEmployeeDependents(emp)
                                    const hasDependents = dependents && dependents.length > 0

                                    return (
                                      <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-2">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                          <Heart className="h-3.5 w-3.5 text-rose-400" />
                                          <span>Dependents & Family Info</span>
                                        </div>
                                        <div className="space-y-2 text-xs">
                                          {hasDependents ? (
                                            dependents.map((dep: any, idx: number) => (
                                              <div key={idx} className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                  <div className="font-semibold text-foreground text-xs">{dep.name}</div>
                                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 capitalize text-rose-400 border-rose-400/30 bg-rose-400/10">
                                                    {dep.relation}
                                                  </Badge>
                                                </div>
                                                <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                                                  <span>Phone: {dep.contact || 'On HR File'}</span>
                                                  {dep.covered && (
                                                    <span className="text-[9px] text-emerald-400 font-medium">Health Covered</span>
                                                  )}
                                                </div>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="py-2.5 text-center space-y-1">
                                              <div className="text-muted-foreground text-xs italic">No dependents registered</div>
                                              <div className="text-[10px] text-muted-foreground">Emergency Contact: On HR File</div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })()}
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                  <div className="text-[11px] text-muted-foreground">
                                    Hire Date: <span className="font-mono text-foreground">{emp.hireDate}</span> • Azure AD Claim: <span className="text-emerald-400 font-mono">Active</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => setEditingUser(emp)}
                                      className="bg-[#23ace3] hover:bg-[#1b97ca] text-white text-xs font-semibold h-8 rounded-xl px-3 gap-1.5 cursor-pointer"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                      <span>Edit Employee Record</span>
                                    </Button>

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleExpandEmp(emp.id)}
                                      className="text-xs h-8 rounded-xl px-3 cursor-pointer"
                                    >
                                      Collapse Record
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* WORKSPACE DIRECTORY: DEPARTMENT & WORKSPACE CARDS                         */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* WORKSPACE CONTENT: SINGLE COMPANY WORKSPACE vs MULTI-DEPARTMENT CARDS */}
          {workspaceMode === 'company' ? (
            /* IF WHOLE COMPANY WORKSPACE: DON'T SHOW INDIVIDUAL DEPARTMENTS! SHOW 1 WHOLE COMPANY WORKSPACE CARD! */
            <Card className="border-2 border-[#23ace3] bg-gradient-to-br from-card via-card to-[#23ace3]/10 shadow-lg rounded-2xl overflow-hidden transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-[#23ace3] to-[#ef8d46] text-white shadow-md">
                      <Globe className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-foreground text-lg">
                        {tenant?.name || 'Sampath Bank PLC'} Whole Company Workspace
                      </h4>
                      <div className="text-xs text-[#23ace3] font-mono font-semibold">
                        Single Unified Enterprise Workspace • {employees.length} Active Members
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setIsAddModalOpen(true)}
                      className="bg-[#23ace3] text-white text-xs font-semibold rounded-xl gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Add Employee</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWorkspaceMode('departments')}
                      className="text-xs text-muted-foreground rounded-xl"
                    >
                      Switch to Departments Mode
                    </Button>
                  </div>
                </div>

                {/* Company Personnel Directory Table Embedded */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Company Personnel Directory ({employees.length} Records)
                    </h5>
                    <div className="w-64">
                      <Input
                        placeholder="Search company staff..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="h-8 text-xs bg-background rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 overflow-hidden bg-background">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="border-border/50">
                          <TableHead className="text-xs">Employee</TableHead>
                          <TableHead className="text-xs">Role & Title</TableHead>
                          <TableHead className="text-xs">Biometric Status</TableHead>
                          <TableHead className="text-xs">Joined</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmployees.map(emp => (
                          <TableRow key={emp.id} className="border-border/40 hover:bg-muted/30">
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#23ace3]/20 font-bold text-xs text-[#23ace3]">
                                  {emp.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-xs text-foreground">{emp.name}</div>
                                  <div className="text-[10px] text-muted-foreground font-mono">{emp.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-xs text-foreground">{emp.jobTitle}</div>
                              <Badge variant="outline" className="text-[9px] capitalize mt-0.5">
                                {emp.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                                <Fingerprint className="h-3.5 w-3.5" />
                                <span>Active Biometric</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">{emp.hireDate}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingUser(emp)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : selectedDept ? (
            /* ======================================================================= */
            /* INSIDE VIEW: SELECTED DEPARTMENT (Tabs: 1. Staff Members, 2. Rules)   */
            /* ======================================================================= */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Back Navigation Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <button
                  type="button"
                  onClick={() => setSelectedDept(null)}
                  className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-[#23ace3] transition-colors cursor-pointer group"
                >
                  <ArrowLeft className="h-4 w-4 text-[#23ace3] group-hover:-translate-x-1 transition-transform" />
                  <span>Back to All Workspaces</span>
                </button>
              </div>

              {/* Department Hero Banner */}
              <div className="bg-gradient-to-r from-card via-card to-[#23ace3]/10 border border-border/70 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30 shadow-xs">
                    <Building className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground tracking-tight">{selectedDept.name} Workspace</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {deptDescInput || selectedDept.description || 'Department workspace division for operational staffing and approvals.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                      <span className="text-[#23ace3] font-medium font-mono">Lead: {deptLeadInput || selectedDept.head || 'Unassigned'}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-foreground font-semibold">
                        {employees.filter(e => e.department.toLowerCase() === selectedDept.name.toLowerCase() && e.role !== 'manager').length} Assigned Members
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-emerald-400 font-medium">SLA: {deptSlaInput}</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditDeptName(selectedDept.name)
                    setEditDeptDesc(deptDescInput || selectedDept.description || '')
                    setEditDeptHead(deptLeadInput || selectedDept.head || '')
                    setEditDeptSla(deptSlaInput || selectedDept.threshold || '75% min staffing')
                    setIsEditDeptModalOpen(true)
                  }}
                  className="border-border/70 hover:border-[#23ace3]/50 bg-card/80 hover:bg-[#23ace3]/10 text-foreground text-xs font-bold px-3.5 h-9 rounded-xl shadow-xs gap-1.5 cursor-pointer shrink-0 transition-all self-start md:self-center"
                >
                  <Edit2 className="h-3.5 w-3.5 text-[#23ace3]" />
                  <span>Edit Settings</span>
                </Button>
              </div>

              {/* Navigation Tabs Inside Department: Staff Members, Rules */}
              <div className="flex items-center gap-2 border-b border-border/60 pb-1">
                <button
                  type="button"
                  onClick={() => setDeptActiveTab('staff')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${deptActiveTab === 'staff'
                    ? 'bg-[#23ace3] text-white shadow-xs'
                    : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
                    }`}
                >
                  <Users className="h-4 w-4" />
                  <span>
                    Staff Members ({employees.filter(e => e.department.toLowerCase() === selectedDept.name.toLowerCase() && e.role !== 'manager').length})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeptActiveTab('rules')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${deptActiveTab === 'rules'
                    ? 'bg-[#23ace3] text-white shadow-xs'
                    : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
                    }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Rules</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeptActiveTab('policies')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${deptActiveTab === 'policies'
                    ? 'bg-[#23ace3] text-white shadow-xs'
                    : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
                    }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Policies</span>
                </button>
              </div>

              {/* TAB CONTENT: STAFF MEMBERS */}
              {deptActiveTab === 'staff' && (
                <div className="space-y-4">
                  {/* Search & Actions Bar */}
                  <div className="flex items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/60">
                    <div className="relative flex-1 max-w-xl">
                      <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={`Search ${selectedDept.name} staff by name, email, or designation...`}
                        value={deptSearchTerm}
                        onChange={e => setDeptSearchTerm(e.target.value)}
                        className="pl-10 h-9 text-xs bg-background rounded-xl w-full"
                      />
                    </div>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setSelectedAssignUserId('')
                        setAssignSearchTerm('')
                        setAssignSuccessMsg(null)
                        setIsAssignModalOpen(true)
                      }}
                      className="bg-[#23ace3] hover:bg-[#1b97ca] text-white text-xs font-bold px-4 h-9 rounded-xl shadow-xs gap-1.5 cursor-pointer shrink-0"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Assign Staff Member</span>
                    </Button>
                  </div>

                  {/* Staff Table */}
                  <div className="rounded-2xl border border-border/60 overflow-hidden bg-card shadow-xs">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="border-border/50">
                          <TableHead className="text-xs">Employee</TableHead>
                          <TableHead className="text-xs">Designation</TableHead>
                          <TableHead className="text-xs">Role</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Joined</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const currentDeptMembers = employees
                            .filter(e => e.department.toLowerCase() === selectedDept.name.toLowerCase() && e.role !== 'manager')
                            .filter(e =>
                              !deptSearchTerm.trim() ||
                              e.name.toLowerCase().includes(deptSearchTerm.toLowerCase()) ||
                              e.email.toLowerCase().includes(deptSearchTerm.toLowerCase()) ||
                              e.jobTitle.toLowerCase().includes(deptSearchTerm.toLowerCase())
                            )
                            .sort((a, b) => {
                              const priorityDiff = getRolePriority(a.role) - getRolePriority(b.role)
                              if (priorityDiff !== 0) return priorityDiff
                              return a.name.localeCompare(b.name)
                            })

                          if (currentDeptMembers.length === 0) {
                            return (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-xs space-y-2">
                                  <Users className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                                  <div>No personnel found in {selectedDept.name}.</div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedAssignUserId('')
                                      setAssignSearchTerm('')
                                      setAssignSuccessMsg(null)
                                      setIsAssignModalOpen(true)
                                    }}
                                    className="text-xs mt-2"
                                  >
                                    + Assign Staff to this Department
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          }

                          return currentDeptMembers.map(emp => (
                            <TableRow key={emp.id} className="border-border/40 hover:bg-muted/30">
                              <TableCell>
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#23ace3]/20 font-bold text-xs text-[#23ace3]">
                                    {emp.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-xs text-foreground">{emp.name}</div>
                                    <div className="text-[10px] text-muted-foreground font-mono">{emp.email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-foreground font-medium">{emp.jobTitle}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    emp.role === 'admin'
                                      ? 'destructive'
                                      : emp.role === 'manager'
                                        ? 'info'
                                        : 'outline'
                                  }
                                  className="text-[10px] capitalize font-mono"
                                >
                                  {emp.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Active</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground font-mono">{emp.hireDate}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingUser(emp)}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                                  title="Edit Staff Member"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: RULES */}
              {deptActiveTab === 'rules' && (
                <div className="space-y-6">
                  {rulesSavedMsg && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Department operational rules & leave quotas saved and applied to Kinetic AI engine!</span>
                    </div>
                  )}

                  {/* Leave Types & Statutory Quota Configuration */}
                  <Card className="border border-border/70 bg-card rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30">
                          <CalendarDays className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-foreground">
                            Leave Quotas & Approval Workflows
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Annual allowances, manager approvals, and governance rules for {selectedDept.name}.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 overflow-hidden bg-background/50">
                      <Table>
                        <TableHeader className="bg-muted/40">
                          <TableRow className="border-border/50">
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Leave Type</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Annual Allowance</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Approval Workflow</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Governance & Conditions</TableHead>
                            <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentDeptLeaveRules.map((cfg, i) => (
                            <TableRow key={i} className="border-border/40 hover:bg-muted/30 transition-colors">
                              <TableCell className="py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-xl bg-[#23ace3]/10 text-[#23ace3] border border-[#23ace3]/20 shrink-0">
                                    <CalendarDays className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-xs text-foreground flex items-center gap-2">
                                      <span>{cfg.name}</span>
                                      {cfg.emergency && cfg.emergency.startsWith('Yes') && (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] bg-rose-500/10 text-rose-400 border-rose-500/30 font-medium py-0 px-2"
                                        >
                                          Emergency Protocol
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground mt-0.5">
                                      Statutory entitlement • {selectedDept.name}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-3.5">
                                <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted/60 border border-border/60 text-xs font-bold text-foreground">
                                  {cfg.allowance}
                                </div>
                              </TableCell>
                              <TableCell className="py-3.5">
                                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                                  <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 shrink-0">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                  </div>
                                  <span>{cfg.approval}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-3.5">
                                <div className="text-xs font-semibold text-foreground">
                                  {cfg.thresholdRule}
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                  <span className="font-medium text-muted-foreground/80">Carry-forward:</span>
                                  <span>{cfg.carryForward}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-3.5 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setEditingLeaveRule({
                                      index: i,
                                      name: cfg.name,
                                      allowance: cfg.allowance,
                                      approval: cfg.approval,
                                      carryForward: cfg.carryForward,
                                      emergency: cfg.emergency,
                                      thresholdRule: cfg.thresholdRule,
                                    })
                                  }
                                  className="h-8 px-3 text-xs font-semibold rounded-xl border-border/70 hover:border-[#23ace3] hover:text-[#23ace3] hover:bg-[#23ace3]/10 cursor-pointer transition-all gap-1.5"
                                  title={`Configure ${cfg.name} Rule`}
                                >
                                  <Edit2 className="h-3.5 w-3.5 text-[#23ace3]" />
                                  <span>Edit</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>

                  <Card className="border border-border/70 bg-card rounded-2xl p-6 shadow-xs space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-[#23ace3]" />
                        <span>Operational & AI Automation Rules — {selectedDept.name}</span>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Configure staffing thresholds, Kinetic AI auto-approval parameters, and notice requirements for this workspace.
                      </p>
                    </div>

                    {rulesSavedMsg && (
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Department operational rules saved and applied to Kinetic AI policy engine!</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Rule 1: Staffing SLA Threshold */}
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                          Staffing SLA Coverage Threshold
                        </label>
                        <Select
                          value={deptSlaInput}
                          onChange={e => setDeptSlaInput(e.target.value)}
                          className="bg-background h-9 text-xs rounded-xl"
                        >
                          <option value="60% min staffing">60% Minimum Staffing</option>
                          <option value="70% min staffing">70% Minimum Staffing (Standard)</option>
                          <option value="75% min staffing">75% Minimum Staffing</option>
                          <option value="80% min staffing">80% Minimum Staffing</option>
                          <option value="85% min staffing">85% Minimum Staffing (High Security)</option>
                          <option value="90% min staffing">90% Minimum Staffing</option>
                        </Select>
                        <p className="text-[11px] text-muted-foreground">
                          Kinetic AI uses this threshold to ensure minimum coverage before auto-approving leave requests.
                        </p>
                      </div>

                      {/* Rule 2: Department Lead */}
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                          Department Lead / Reporting Head
                        </label>
                        <Select
                          value={deptLeadInput}
                          onChange={e => setDeptLeadInput(e.target.value)}
                          className="bg-background h-9 text-xs rounded-xl"
                        >
                          <option value="">-- Select Manager as Department Lead --</option>
                          {deptLeadInput && !employees.filter(e => e.role?.toLowerCase() === 'manager').some(m => m.name === deptLeadInput) && (
                            <option value={deptLeadInput}>{deptLeadInput} (Current Lead)</option>
                          )}
                          {employees
                            .filter(e => e.role?.toLowerCase() === 'manager')
                            .map(emp => (
                              <option key={emp.id} value={emp.name}>
                                {emp.name} — {emp.jobTitle} ({emp.employeeNumber || emp.id})
                              </option>
                            ))}
                        </Select>
                        <p className="text-[11px] text-muted-foreground">
                          Primary approver when Kinetic AI encounters scheduling conflicts or leave collisions.
                        </p>
                      </div>

                      {/* Rule 3: Kinetic AI Auto-Approval Toggle */}
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Kinetic AI Auto-Approval Engine
                          </label>
                          <input
                            type="checkbox"
                            checked={aiAutoApproval}
                            onChange={e => setAiAutoApproval(e.target.checked)}
                            className="h-4 w-4 rounded accent-[#23ace3] cursor-pointer"
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          When enabled, leaves under this department are auto-granted if staffing coverage is above {deptSlaInput}. Conflicts route directly to manager.
                        </p>
                      </div>

                      {/* Rule 4: Max Concurrent Out-of-Office */}
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                          Max Concurrent Team Out-of-Office
                        </label>
                        <Select
                          value={maxConcurrentLeaves}
                          onChange={e => setMaxConcurrentLeaves(e.target.value)}
                          className="bg-background h-9 text-xs rounded-xl"
                        >
                          <option value="1 Member">1 Member Maximum</option>
                          <option value="2 Members">2 Members Maximum</option>
                          <option value="3 Members">3 Members Maximum</option>
                          <option value="4 Members">4 Members Maximum</option>
                          <option value="Unlimited (SLA Only)">Unlimited (Governed strictly by SLA)</option>
                        </Select>
                        <p className="text-[11px] text-muted-foreground">
                          Maximum number of simultaneous team members who may take leave concurrently.
                        </p>
                      </div>

                      {/* Rule 5: Advance Notice Window */}
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                          Advance Notice Period
                        </label>
                        <Select
                          value={leaveNoticeDays}
                          onChange={e => setLeaveNoticeDays(e.target.value)}
                          className="bg-background h-9 text-xs rounded-xl"
                        >
                          <option value="1 Day Notice">1 Day Notice</option>
                          <option value="3 Days Notice">3 Days Notice</option>
                          <option value="7 Days Notice">7 Days Notice (1 Week)</option>
                          <option value="14 Days Notice">14 Days Notice (2 Weeks)</option>
                        </Select>
                        <p className="text-[11px] text-muted-foreground">
                          Minimum advance notice required before an employee can request planned annual leave.
                        </p>
                      </div>

                      {/* Rule 6: Core Working Shift */}
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                          Core Working & Shift Hours
                        </label>
                        <Select
                          value={coreHours}
                          onChange={e => setCoreHours(e.target.value)}
                          className="bg-background h-9 text-xs rounded-xl"
                        >
                          <option value="08:30 - 17:00">08:30 - 17:00 (Standard Shift)</option>
                          <option value="09:00 - 18:00">09:00 - 18:00 (Corporate Core)</option>
                          <option value="10:00 - 16:00 (Flexible Core)">10:00 - 16:00 (Flexible Core)</option>
                          <option value="24/7 Rotational Roster">24/7 Rotational Shift</option>
                        </Select>
                        <p className="text-[11px] text-muted-foreground">
                          Standard shift timetable used for attendance tracking and overtime calculations.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-border/50">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          selectedDept.head = deptLeadInput
                          selectedDept.threshold = deptSlaInput
                          selectedDept.description = deptDescInput
                          selectedDept.aiAutoApproval = aiAutoApproval
                          selectedDept.maxConcurrentLeaves = maxConcurrentLeaves
                          selectedDept.leaveNoticeDays = leaveNoticeDays
                          selectedDept.coreHours = coreHours
                          selectedDept.leaveRules = currentDeptLeaveRules
                          setDeptLeaveRulesMap(prev => ({
                            ...prev,
                            [selectedDept.name]: currentDeptLeaveRules,
                          }))
                          refetchDepts()
                          setRulesSavedMsg(true)
                          setTimeout(() => setRulesSavedMsg(false), 3000)
                        }}
                        className="bg-[#23ace3] hover:bg-[#1b97ca] text-white font-bold text-xs px-5 h-9 rounded-xl shadow-xs cursor-pointer"
                      >
                        Save Department Rules
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

              {/* TAB CONTENT: POLICIES */}
              {deptActiveTab === 'policies' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Policies Search & Add Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/60 shadow-xs">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={`Search ${selectedDept.name} policies by title, category, or summary...`}
                        value={policySearchTerm}
                        onChange={e => setPolicySearchTerm(e.target.value)}
                        className="pl-10 h-9 text-xs bg-background rounded-xl w-full"
                      />
                    </div>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleOpenAddPolicy()}
                      className="bg-[#23ace3] hover:bg-[#1b97ca] text-white text-xs font-bold px-4 h-9 rounded-xl shadow-xs gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Policy</span>
                    </Button>
                  </div>

                  {/* Policies Grid */}
                  {deptPolicies.length === 0 ? (
                    <Card className="p-8 text-center border-dashed border-border/60 bg-card/50 rounded-2xl space-y-2">
                      <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                      <div className="text-xs text-muted-foreground">No policies currently linked to this workspace.</div>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {deptPolicies
                        .filter(p =>
                          !policySearchTerm.trim() ||
                          p.title.toLowerCase().includes(policySearchTerm.toLowerCase()) ||
                          p.summary.toLowerCase().includes(policySearchTerm.toLowerCase()) ||
                          p.category.toLowerCase().includes(policySearchTerm.toLowerCase())
                        )
                        .map(policy => (
                          <PolicyCard
                            key={policy.id}
                            policy={policy}
                            onSelect={p => setSelectedPolicyDoc(p)}
                            onEdit={p => handleOpenEditPolicy(p)}
                          />
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* MULTI-DEPARTMENT CARDS GRID (CLICKABLE CARDS TO ENTER INSIDE VIEW) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {departments.map((dept: any, i: number) => {
                const deptMembers = employees.filter(
                  e => e.department.toLowerCase() === dept.name.toLowerCase()
                )

                return (
                  <Card
                    key={dept.id || i}
                    onClick={() => {
                      setSelectedDept(dept)
                      setDeptActiveTab('staff')
                      setDeptLeadInput(dept.head || '')
                      setDeptSlaInput(dept.threshold || '75% min staffing')
                      setDeptDescInput(dept.description || '')
                    }}
                    className="border border-border/70 hover:border-[#23ace3] bg-card hover:shadow-lg transition-all rounded-2xl overflow-hidden cursor-pointer group hover:scale-[1.01]"
                  >
                    <CardContent className="p-5 space-y-4">
                      {/* Card Top: Department Name & Arrow */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30 group-hover:scale-105 transition-transform">
                            <Building className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-foreground text-base tracking-tight group-hover:text-[#23ace3] transition-colors">
                              {dept.name}
                            </h4>
                            <div className="text-[11px] text-[#23ace3] font-mono">
                              Lead: {dept.head || 'Sarah Miller'}
                            </div>
                          </div>
                        </div>

                        <div className="p-1.5 rounded-lg text-muted-foreground group-hover:text-[#23ace3] group-hover:bg-[#23ace3]/10 transition-all">
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>

                      {/* Department Stats */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-3 rounded-xl border border-border/60">
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase font-semibold">Assigned Staff</div>
                          <div className="font-bold text-foreground text-sm">{deptMembers.length} Members</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase font-semibold">Staffing SLA</div>
                          <div className="font-bold text-emerald-400 text-sm">{dept.threshold || '75% Min'}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* ALL COMPANY PERSONNEL MASTER DIRECTORY SECTION (Hidden by default, shown when blue "Explore" is clicked) */}
          {showMasterDirectory && (
            <div className="pt-6 border-t border-border/60 space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/60">
                <div>
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#23ace3]" />
                    <span>All Company Personnel Master Directory ({employees.length})</span>
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Global roster across all departments, biometric status, and organizational roles.
                  </p>
                </div>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-[#23ace3] hover:bg-[#1b97ca] text-white text-xs font-semibold rounded-xl gap-1.5 cursor-pointer shrink-0"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>+ Add Single Employee</span>
                </Button>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees by name, title, email, or employee number..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 h-10 rounded-xl"
                  />
                </div>
                <div className="w-full sm:w-64">
                  <Select
                    value={selectedDeptFilter}
                    onChange={e => setSelectedDeptFilter(e.target.value)}
                    className="h-10 rounded-xl"
                  >
                    <option value="all">All Departments ({employees.length})</option>
                    {allDeptNames.map((d: any) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Master Employees Table */}
              <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="border-border/50">
                      <TableHead>Employee Personnel</TableHead>
                      <TableHead>Department & Designation</TableHead>
                      <TableHead>System Role</TableHead>
                      <TableHead>Biometric & Status</TableHead>
                      <TableHead>Hire Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-xs">
                          No employee records found matching your filter criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployees.map(emp => (
                        <TableRow key={emp.id} className="border-border/40 hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#23ace3]/15 font-bold text-xs text-[#23ace3] border border-[#23ace3]/30">
                                {emp.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                  <span>{emp.name}</span>
                                  <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded-md">
                                    {emp.employeeNumber}
                                  </span>
                                </div>
                                <div className="text-[11px] text-muted-foreground font-mono">{emp.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-foreground">
                            {emp.department && emp.department !== 'Unassigned' ? (
                              <>
                                <div className="font-semibold text-foreground flex items-center gap-1">
                                  <Building className="h-3 w-3 text-[#23ace3]" />
                                  <span>{emp.department}</span>
                                </div>
                                <div className="text-[11px] text-muted-foreground">{emp.jobTitle || 'Pending Assignment'}</div>
                              </>
                            ) : (
                              <div>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] text-amber-500 border-amber-500/30 bg-amber-500/10 cursor-pointer hover:bg-amber-500/20"
                                  onClick={() => setEditingUser(emp)}
                                  title="Click to assign to a workspace directory"
                                >
                                  Unassigned Workspace
                                </Badge>
                                <div className="text-[10px] text-muted-foreground mt-0.5">Pending Manager Role</div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                emp.role === 'admin' || emp.role === 'platform_admin'
                                  ? 'destructive'
                                  : emp.role === 'manager'
                                    ? 'info'
                                    : 'outline'
                              }
                              className="text-[10px] capitalize font-mono"
                            >
                              {emp.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant="success" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                Active
                              </Badge>
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Fingerprint className="h-3 w-3 text-[#23ace3]" />
                                <span>Biometric Linked</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">{emp.hireDate}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingUser(emp)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL: SELECTION DIALOG FOR "+ ADD NEW WORKSPACE"                    */}
      {/* ========================================================================= */}
      <Dialog open={isAddWorkspaceChoiceOpen} onOpenChange={setIsAddWorkspaceChoiceOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#23ace3]" />
            <span>Create Workspace Structure</span>
          </DialogTitle>
          <DialogDescription>
            Choose whether to create department divisions or a single unified company workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">
          {/* Choice A: Department Division Workspace */}
          <button
            type="button"
            onClick={() => {
              setIsAddWorkspaceChoiceOpen(false)
              setWorkspaceMode('departments')
              navigate('/admin/workforce/create-workspace')
            }}
            className="p-5 text-left rounded-2xl border-2 border-[#23ace3]/40 hover:border-[#23ace3] bg-gradient-to-br from-card via-card to-[#23ace3]/10 hover:shadow-lg transition-all cursor-pointer space-y-3 group"
          >
            <div className="p-3 rounded-xl bg-[#23ace3]/15 text-[#23ace3] w-fit group-hover:scale-105 transition-transform">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-sm flex items-center justify-between">
                <span>Create Department Division</span>
                <ArrowRight className="h-4 w-4 text-[#23ace3] group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Create a specific department division (Engineering, Risk Audit, Branch BOC-01). Department cards will be displayed.
              </p>
            </div>
          </button>

          {/* Choice B: Whole Company Workspace */}
          <button
            type="button"
            onClick={() => {
              setIsAddWorkspaceChoiceOpen(false)
              setWorkspaceMode('company')
            }}
            className="p-5 text-left rounded-2xl border-2 border-[#ef8d46]/40 hover:border-[#ef8d46] bg-gradient-to-br from-card via-card to-[#ef8d46]/10 hover:shadow-lg transition-all cursor-pointer space-y-3 group"
          >
            <div className="p-3 rounded-xl bg-[#ef8d46]/15 text-[#ef8d46] w-fit group-hover:scale-105 transition-transform">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-sm flex items-center justify-between">
                <span>Create Whole Company Workspace</span>
                <ArrowRight className="h-4 w-4 text-[#ef8d46] group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Create 1 unified workspace for the whole company. After this, individual department cards are hidden and only 1 company workspace card is displayed.
              </p>
            </div>
          </button>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setIsAddWorkspaceChoiceOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: ADD EMPLOYEE (MANUAL ENTRY OR BULK CSV UPLOAD)                     */}
      {/* ========================================================================= */}
      <Dialog
        open={isAddModalOpen}
        onOpenChange={open => {
          setIsAddModalOpen(open)
          if (!open) {
            setCsvFile(null)
            setCsvParsedRecords([])
            setCsvError(null)
            setCsvSuccessMsg(null)
            setNewName('')
            setNewEmail('')
            setNewPhone('')
            setNewBiometricCaptured(false)
            setNewBiometricToken('')
          }
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30">
              {addEmployeeMode === 'manual' ? <UserPlus className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
            </div>
            <div>
              <DialogTitle>
                {selectedDept ? `Add Staff to ${selectedDept.name}` : 'Add Employee to Workforce Directory'}
              </DialogTitle>
              <DialogDescription>
                {addEmployeeMode === 'manual'
                  ? 'Add an individual staff member.'
                  : 'Bulk import staff members via CSV.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Switcher: Manual Entry vs Upload CSV File */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <button
            type="button"
            onClick={() => setAddEmployeeMode('manual')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${addEmployeeMode === 'manual'
              ? 'bg-[#23ace3] text-white shadow-xs'
              : 'bg-muted/40 text-muted-foreground hover:text-foreground border border-border/50'
              }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Fill In Info</span>
          </button>
          <button
            type="button"
            onClick={() => setAddEmployeeMode('csv')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${addEmployeeMode === 'csv'
              ? 'bg-[#23ace3] text-white shadow-xs'
              : 'bg-muted/40 text-muted-foreground hover:text-foreground border border-border/50'
              }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload CSV File</span>
          </button>
        </div>

        {addEmployeeMode === 'manual' ? (
          /* MANUAL ENTRY FORM */
          <>
            <div className="space-y-3 py-2 text-xs">
              <div>
                <label className="font-semibold block mb-1">Full Name</label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="E.g., Jane Cooper" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Work Email</label>
                  <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="jane.cooper@kinetictech.io" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold block">National ID / NIC No</label>
                    <span className="text-[10px] text-[#23ace3] font-medium">Default Password</span>
                  </div>
                  <Input
                    value={newIdNumber}
                    onChange={e => setNewIdNumber(e.target.value)}
                    placeholder="E.g., 200084102941 or NIC"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Contact Phone</label>
                  <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="E.g., +1 (555) 234-5678" />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Role</label>
                  <Select value={newRole} onChange={e => setNewRole(e.target.value as UserRole)}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">HR Admin</option>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Assigned Branch / Location</label>
                  <Select
                    value={newLocation}
                    onChange={e => {
                      const val = e.target.value
                      setNewLocation(val)
                      const found = branches.find(b => b.name === val)
                      if (found) setNewBranchId(found.id)
                      else setNewBranchId('')
                    }}
                    className="text-xs"
                  >
                    <option value="">Select an operating branch...</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.name}>
                        {b.name} ({b.city} — {b.type})
                      </option>
                    ))}
                    <option value="Remote / Work From Home">Remote / Work From Home</option>
                    <option value="Colombo HQ — Floor 04">Colombo HQ — Floor 04 (Headquarters)</option>
                  </Select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Home Address</label>
                  <Input
                    value={newAddress}
                    onChange={e => setNewAddress(e.target.value)}
                    placeholder="E.g., No. 42, Temple Road, Colombo"
                  />
                </div>
              </div>

              {/* Informational Notice */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border/60 text-muted-foreground flex items-start gap-2.5">
                <Briefcase className="h-4 w-4 text-[#23ace3] shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-semibold text-foreground">Workspace & Job Title Assignment: </span>
                  Department assignment can be done from the Workspace Directory anytime after adding. Job title will be configured directly by the workspace manager.
                </div>
              </div>

              {/* Biometrics Section - Taken from Employee */}
              <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#23ace3]/15 text-[#23ace3]">
                      <Fingerprint className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-foreground">Biometrics (Taken from Employee)</span>
                      <p className="text-[11px] text-muted-foreground">Fingerprint biometric passkey registration</p>
                    </div>
                  </div>
                  {newBiometricCaptured ? (
                    <Badge variant="success" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Biometric Linked</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/60">
                      Pending Capture
                    </Badge>
                  )}
                </div>

                {newBiometricCaptured ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span className="text-[11px] font-mono font-medium">Biometric Token #{newBiometricToken || 'FP-8842-ACT'} Active</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNewBiometricCaptured(false)
                        setNewBiometricToken('')
                      }}
                      className="text-[10px] text-muted-foreground hover:text-foreground h-6 px-2"
                    >
                      Re-scan
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Capture fingerprint passkey directly from employee reader or permit self-service capture upon initial sign-in.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isCapturingBiometric}
                      onClick={handleCaptureBiometric}
                      className="text-xs shrink-0 border-[#23ace3]/50 text-[#23ace3] hover:bg-[#23ace3]/15 gap-1.5 rounded-xl font-semibold cursor-pointer h-8"
                    >
                      <Fingerprint className="h-3.5 w-3.5" />
                      <span>{isCapturingBiometric ? 'Scanning...' : 'Capture Biometrics'}</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => addEmployeeMutation.mutate()}
                disabled={!newName || !newEmail || addEmployeeMutation.isPending}
                className="bg-[#23ace3] hover:bg-[#1b97ca] text-white font-bold"
              >
                {addEmployeeMutation.isPending ? 'Provisioning...' : 'Provision Employee'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* CSV UPLOAD MODE */
          <>
            <div className="space-y-3.5 py-2 text-xs">
              {/* Dropzone Container */}
              <div
                onClick={() => {
                  const input = document.getElementById('csv-file-input')
                  input?.click()
                }}
                className="border-2 border-dashed border-border/80 hover:border-[#23ace3] bg-muted/20 hover:bg-[#23ace3]/5 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
              >
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleCsvFileUpload(file)
                  }}
                />
                <div className="p-3 rounded-full bg-[#23ace3]/15 text-[#23ace3] w-fit mx-auto group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold text-foreground text-sm">
                    {csvFile ? csvFile.name : 'Click to select CSV roster or drag & drop'}
                  </div>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    {csvFile
                      ? `${(csvFile.size / 1024).toFixed(1)} KB • Click to choose a different file`
                      : 'Accepts standard CSV file with headers: Name, Email, Department, Job Title, Role'}
                  </p>
                </div>
              </div>

              {/* Sample Template & Guidelines */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60">
                <div className="text-[11px] text-muted-foreground">
                  Need the required CSV format?
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="text-xs text-[#23ace3] hover:text-[#1b97ca] hover:bg-[#23ace3]/10 gap-1.5 h-8 font-semibold cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Sample CSV</span>
                </Button>
              </div>

              {/* Error Message */}
              {csvError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                  {csvError}
                </div>
              )}

              {/* Success Message */}
              {csvSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{csvSuccessMsg}</span>
                </div>
              )}

              {/* Parsed Records Preview */}
              {csvParsedRecords.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{csvParsedRecords.length} Employees Detected & Validated</span>
                    </span>
                    <span className="text-muted-foreground font-mono text-[11px]">Previewing entries</span>
                  </div>

                  <div className="max-h-36 overflow-y-auto rounded-xl border border-border/60 bg-background text-[11px]">
                    <table className="w-full text-left">
                      <thead className="bg-muted/50 border-b border-border/50 sticky top-0 text-muted-foreground font-mono">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Email</th>
                          <th className="p-2">Department</th>
                          <th className="p-2">Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {csvParsedRecords.slice(0, 10).map((r, idx) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="p-2 font-medium text-foreground">{r.name}</td>
                            <td className="p-2 font-mono text-muted-foreground">{r.email}</td>
                            <td className="p-2 text-muted-foreground">{r.department}</td>
                            <td className="p-2 capitalize font-mono text-xs">{r.role}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddModalOpen(false)
                  setCsvFile(null)
                  setCsvParsedRecords([])
                }}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleRunBulkCsvImport}
                disabled={csvParsedRecords.length === 0 || isCsvImporting}
                className="bg-[#23ace3] hover:bg-[#1b97ca] text-white font-bold gap-1.5"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>
                  {isCsvImporting
                    ? 'Importing...'
                    : `Import ${csvParsedRecords.length > 0 ? `${csvParsedRecords.length} Employees` : 'CSV'}`}
                </span>
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN EXISTING STAFF MEMBER TO DEPARTMENT WORKSPACE               */}
      {/* ========================================================================= */}
      <Dialog
        open={isAssignModalOpen}
        onOpenChange={open => {
          setIsAssignModalOpen(open)
          if (!open) {
            setSelectedAssignUserId('')
            setAssignSearchTerm('')
            setAssignSuccessMsg(null)
          }
        }}
      >
        {selectedDept && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle>Assign Staff to {selectedDept.name} Workspace</DialogTitle>
                  <DialogDescription>
                    Select an employee to assign.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              {/* Search Workforce Directory */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-foreground">Search Workforce Directory</label>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Search by ID, Name or Email
                  </span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by employee ID, name, or email..."
                    value={assignSearchTerm}
                    onChange={e => setAssignSearchTerm(e.target.value)}
                    className="pl-9 pr-8 h-9 text-xs bg-background rounded-xl"
                    autoFocus
                  />
                  {assignSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setAssignSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground text-xs"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Filtered Employee Direct Selection List (No Dropdown) */}
              <div>
                {(() => {
                  const term = assignSearchTerm.trim().toLowerCase()
                  const filteredCandidates = employees
                    .filter(e => e.department.toLowerCase() !== selectedDept.name.toLowerCase())
                    .filter(e => {
                      if (!term) return true
                      const matchName = e.name?.toLowerCase().includes(term)
                      const matchEmail = e.email?.toLowerCase().includes(term)
                      const matchEmpNum = e.employeeNumber?.toLowerCase().includes(term)
                      const matchId = e.id?.toLowerCase().includes(term)
                      const matchTitle = e.jobTitle?.toLowerCase().includes(term)
                      return matchName || matchEmail || matchEmpNum || matchId || matchTitle
                    })

                  return (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                        <span>Select Employee ({filteredCandidates.length} available)</span>
                        {selectedAssignUserId && (
                          <button
                            type="button"
                            onClick={() => setSelectedAssignUserId('')}
                            className="text-[#23ace3] hover:underline"
                          >
                            Deselect
                          </button>
                        )}
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                        {filteredCandidates.length === 0 ? (
                          <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/60">
                            No employees found matching &quot;{assignSearchTerm}&quot;
                          </div>
                        ) : (
                          filteredCandidates.map(emp => {
                            const isSelected = selectedAssignUserId === emp.id
                            return (
                              <div
                                key={emp.id}
                                onClick={() => setSelectedAssignUserId(emp.id)}
                                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                  isSelected
                                    ? 'border-[#23ace3] bg-[#23ace3]/10 ring-1 ring-[#23ace3]'
                                    : 'border-border/60 bg-card/60 hover:bg-muted/40 hover:border-border'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                      isSelected
                                        ? 'bg-[#23ace3] text-white'
                                        : 'bg-[#23ace3]/15 text-[#23ace3]'
                                    }`}
                                  >
                                    {emp.name.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-xs text-foreground truncate">
                                        {emp.name}
                                      </span>
                                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50 shrink-0">
                                        ID: {emp.employeeNumber || emp.id}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-muted-foreground truncate font-mono">
                                      {emp.email}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                      <span className="font-medium text-foreground">{emp.jobTitle}</span>
                                      <span>•</span>
                                      <span>Current: {emp.department || 'Unassigned'}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="shrink-0 flex items-center">
                                  <div
                                    className={`h-4 w-4 rounded-full flex items-center justify-center border transition-colors ${
                                      isSelected
                                        ? 'border-[#23ace3] bg-[#23ace3] text-white'
                                        : 'border-muted-foreground/40'
                                    }`}
                                  >
                                    {isSelected && <CheckCircle2 className="h-3 w-3 stroke-[3]" />}
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Selected Employee Preview Card */}
              {(() => {
                const selectedEmp = employees.find(e => e.id === selectedAssignUserId)
                if (!selectedEmp) return null

                return (
                  <div className="p-3 rounded-xl bg-card border border-[#23ace3]/40 shadow-xs space-y-1.5 animate-in fade-in">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Ready to Assign
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">{selectedEmp.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">({selectedEmp.employeeNumber || selectedEmp.id})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {selectedEmp.department || 'Unassigned'}
                        </span>
                        <span className="text-[11px] text-[#23ace3] font-bold mx-1.5">➔</span>
                        <span className="text-[11px] text-[#23ace3] font-bold">
                          {selectedDept.name}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Success Feedback */}
              {assignSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{assignSuccessMsg}</span>
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between pt-2 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAssignModalOpen(false)
                  setSelectedAssignUserId('')
                  setAssignSearchTerm('')
                }}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleAssignStaffToDept}
                disabled={!selectedAssignUserId}
                className="bg-[#23ace3] hover:bg-[#1b97ca] text-white font-bold text-xs px-4 h-9 rounded-xl shadow-xs cursor-pointer"
              >
                Assign to {selectedDept.name}
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>

      {/* Edit Department Modal */}
      <Dialog open={editingDept !== null} onOpenChange={open => !open && setEditingDept(null)}>
        {editingDept && (
          <>
            <DialogHeader>
              <DialogTitle>Edit Department Workspace: {editingDept.name}</DialogTitle>
              <DialogDescription>Update leadership, staffing SLAs, and description.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div>
                <label className="font-semibold block mb-1">Department Lead</label>
                <Select
                  value={editingDept.head || ''}
                  onChange={e => setEditingDept({ ...editingDept, head: e.target.value })}
                  className="bg-background h-9 text-xs rounded-xl"
                >
                  <option value="">-- Select Manager as Department Lead --</option>
                  {editingDept.head && !employees.filter(e => e.role?.toLowerCase() === 'manager').some(m => m.name === editingDept.head) && (
                    <option value={editingDept.head}>{editingDept.head} (Current Lead)</option>
                  )}
                  {employees
                    .filter(e => e.role?.toLowerCase() === 'manager')
                    .map(emp => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name} — {emp.jobTitle} ({emp.employeeNumber || emp.id})
                      </option>
                    ))}
                </Select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Staffing Threshold SLA</label>
                <Input
                  value={editingDept.threshold || ''}
                  onChange={e => setEditingDept({ ...editingDept, threshold: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setEditingDept(null)}>
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  refetchDepts()
                  setEditingDept(null)
                }}
                className="bg-[#23ace3] text-white"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>

      {/* Edit Employee Modal */}
      <Dialog open={editingUser !== null} onOpenChange={open => !open && setEditingUser(null)}>
        {editingUser && (
          <>
            <DialogHeader>
              <DialogTitle>Edit Employee: {editingUser.name}</DialogTitle>
              <DialogDescription>Update department assignments and system permissions.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div>
                <label className="font-semibold block mb-1">Role Assignment</label>
                <Select
                  value={editingUser.role}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">HR Admin</option>
                </Select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Department Workspace</label>
                <Select
                  value={editingUser.department || 'Unassigned'}
                  onChange={e => setEditingUser({ ...editingUser, department: e.target.value })}
                >
                  <option value="Unassigned">-- Unassigned Workspace --</option>
                  {allDeptNames.map((d: any) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="font-semibold block mb-1">National ID / NIC No</label>
                <Input
                  value={editingUser.idNumber || ''}
                  onChange={e => setEditingUser({ ...editingUser, idNumber: e.target.value })}
                  placeholder="E.g., 200084102941 or NIC"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Contact Details (Phone)</label>
                <Input
                  value={editingUser.phone || ''}
                  onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                  placeholder="E.g., +1 (555) 234-5678"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Assigned Branch / Location</label>
                  <Select
                    value={editingUser.location || editingUser.branchName || ''}
                    onChange={e => {
                      const val = e.target.value
                      const found = branches.find(b => b.name === val)
                      setEditingUser({
                        ...editingUser,
                        location: val,
                        branchName: val,
                        branchId: found ? found.id : editingUser.branchId,
                      })
                    }}
                  >
                    <option value="">Select an operating branch...</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.name}>
                        {b.name} ({b.city} — {b.type})
                      </option>
                    ))}
                    <option value="Remote / Work From Home">Remote / Work From Home</option>
                    <option value="Colombo HQ — Floor 04">Colombo HQ — Floor 04 (Headquarters)</option>
                  </Select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Home Address</label>
                  <Input
                    value={editingUser.address || ''}
                    onChange={e => setEditingUser({ ...editingUser, address: e.target.value })}
                    placeholder="E.g., No. 42, Temple Road, Colombo"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={async () => {
                  await employeeService.updateEmployee(editingUser.id, {
                    role: editingUser.role,
                    department: editingUser.department,
                    phone: editingUser.phone,
                    idNumber: editingUser.idNumber,
                    location: editingUser.location,
                    address: editingUser.address,
                    jobTitle: editingUser.jobTitle,
                  })
                  refetchEmployees()
                  refetchDepts()
                  setEditingUser(null)
                }}
                className="bg-[#23ace3] text-white font-semibold"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>

      {/* POLICY VIEWER DIALOG */}
      <Dialog open={!!selectedPolicyDoc} onOpenChange={open => !open && setSelectedPolicyDoc(null)}>
        {selectedPolicyDoc && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    {selectedPolicyDoc.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs font-mono">
                    Version {selectedPolicyDoc.version} • {selectedPolicyDoc.category}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="p-4 rounded-xl bg-muted/40 border border-border/70 text-xs text-foreground leading-relaxed">
                {selectedPolicyDoc.summary}
              </div>

              {selectedPolicyDoc.contentExcerpt && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Policy Content Excerpt
                  </span>
                  <div className="p-4 rounded-xl bg-background border border-border/80 text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {selectedPolicyDoc.contentExcerpt}
                  </div>
                </div>
              )}

              {/* Attached Document File Pill in Viewer */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate font-mono">
                      {selectedPolicyDoc.fileName || `${selectedPolicyDoc.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_v${selectedPolicyDoc.version}.pdf`}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      <span>{selectedPolicyDoc.fileSize || '340 KB'}</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const blob = new Blob([selectedPolicyDoc.contentExcerpt || selectedPolicyDoc.summary], { type: 'application/pdf' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = selectedPolicyDoc.fileName || `${selectedPolicyDoc.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_v${selectedPolicyDoc.version}.pdf`
                    a.click()
                  }}
                  className="h-8 px-3 text-xs rounded-xl border-border/70 hover:border-[#23ace3] hover:text-[#23ace3] hover:bg-[#23ace3]/10 gap-1.5 shrink-0 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download PDF</span>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedPolicyDoc.keyTerms.map((term, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] bg-background">
                    #{term}
                  </Badge>
                ))}
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPolicyDoc(null)}
                className="text-xs rounded-xl"
              >
                Close
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const p = selectedPolicyDoc
                    setSelectedPolicyDoc(null)
                    handleOpenEditPolicy(p)
                  }}
                  className="text-xs rounded-xl gap-1.5 cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5 text-[#23ace3]" />
                  <span>Edit Policy</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSelectedPolicyDoc(null)}
                  className="text-xs bg-[#23ace3] hover:bg-[#1b97ca] text-white font-bold rounded-xl cursor-pointer"
                >
                  Acknowledge & Close
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: EDIT DEPARTMENT SETTINGS                                           */}
      {/* ========================================================================= */}
      <Dialog open={isEditDeptModalOpen} onOpenChange={setIsEditDeptModalOpen}>
        {selectedDept && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Edit Department Settings
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Update workspace profile, leadership, and operational SLA parameters for {selectedDept.name}.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3.5 py-2 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-foreground">Department Workspace Name</label>
                <Input
                  value={editDeptName}
                  onChange={e => setEditDeptName(e.target.value)}
                  placeholder="E.g., Engineering, Finance, Operations"
                  className="bg-background h-9 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-foreground">Department Description</label>
                <textarea
                  value={editDeptDesc}
                  onChange={e => setEditDeptDesc(e.target.value)}
                  rows={3}
                  placeholder="Brief summary of department responsibilities and division scope..."
                  className="w-full text-xs p-3 rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:border-[#23ace3] transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-foreground">Department Lead / Head</label>
                  <Select
                    value={editDeptHead}
                    onChange={e => setEditDeptHead(e.target.value)}
                    className="bg-background h-9 text-xs rounded-xl"
                  >
                    <option value="">-- Select Manager as Department Lead --</option>
                    {editDeptHead && !employees.filter(e => e.role?.toLowerCase() === 'manager').some(m => m.name === editDeptHead) && (
                      <option value={editDeptHead}>{editDeptHead} (Current Lead)</option>
                    )}
                    {employees
                      .filter(e => e.role?.toLowerCase() === 'manager')
                      .map(emp => (
                        <option key={emp.id} value={emp.name}>
                          {emp.name} — {emp.jobTitle} ({emp.employeeNumber || emp.id})
                        </option>
                      ))}
                  </Select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-foreground">SLA Staffing Threshold</label>
                  <Input
                    value={editDeptSla}
                    onChange={e => setEditDeptSla(e.target.value)}
                    placeholder="E.g., 70% min staffing"
                    className="bg-background h-9 text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between pt-2 border-t border-border/50">
              <Button variant="outline" size="sm" onClick={() => setIsEditDeptModalOpen(false)} className="text-xs rounded-xl">
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  selectedDept.name = editDeptName || selectedDept.name
                  selectedDept.description = editDeptDesc
                  selectedDept.head = editDeptHead
                  selectedDept.threshold = editDeptSla
                  setDeptDescInput(editDeptDesc)
                  setDeptLeadInput(editDeptHead)
                  setDeptSlaInput(editDeptSla)
                  refetchDepts()
                  setIsEditDeptModalOpen(false)
                }}
                className="bg-[#23ace3] hover:bg-[#1b97ca] text-white font-bold text-xs px-4 h-9 rounded-xl shadow-xs cursor-pointer"
              >
                Save Settings
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
      {/* ========================================================================= */}
      {/* MODAL: CONFIGURE LEAVE RULE                                               */}
      {/* ========================================================================= */}
      <Dialog open={!!editingLeaveRule} onOpenChange={open => !open && setEditingLeaveRule(null)}>
        {editingLeaveRule && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Configure Leave Rule — {editingLeaveRule.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Update allowance, approval workflow, carry-forward, and governance rules for {selectedDept?.name || 'this department'}.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3.5 py-2 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-foreground">Leave Type</label>
                <Input
                  value={editingLeaveRule.name}
                  onChange={e => setEditingLeaveRule({ ...editingLeaveRule, name: e.target.value })}
                  className="bg-background h-9 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-foreground">Default Annual Allowance</label>
                  <Input
                    value={editingLeaveRule.allowance}
                    onChange={e => setEditingLeaveRule({ ...editingLeaveRule, allowance: e.target.value })}
                    placeholder="E.g., 20 days, Discretionary"
                    className="bg-background h-9 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-foreground">Emergency Protocol</label>
                  <Select
                    value={editingLeaveRule.emergency}
                    onChange={e => setEditingLeaveRule({ ...editingLeaveRule, emergency: e.target.value })}
                    className="bg-background h-9 text-xs rounded-xl"
                  >
                    <option value="No">No</option>
                    <option value="Yes (Dependent Illness Sec 4.2)">Yes (Dependent Illness Sec 4.2)</option>
                    <option value="Case by Case">Case by Case</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-foreground">Approval Workflow</label>
                <Input
                  value={editingLeaveRule.approval}
                  onChange={e => setEditingLeaveRule({ ...editingLeaveRule, approval: e.target.value })}
                  placeholder="E.g., Required (Direct Manager), Auto-approved up to 2 days"
                  className="bg-background h-9 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-foreground">Carry-Forward Rule</label>
                <Input
                  value={editingLeaveRule.carryForward}
                  onChange={e => setEditingLeaveRule({ ...editingLeaveRule, carryForward: e.target.value })}
                  placeholder="E.g., Max 5 days into Q1, Non-accruing"
                  className="bg-background h-9 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-foreground">Threshold Governance & Prerequisites</label>
                <Input
                  value={editingLeaveRule.thresholdRule}
                  onChange={e => setEditingLeaveRule({ ...editingLeaveRule, thresholdRule: e.target.value })}
                  placeholder="E.g., Checked against 70% department presence quota, Medical cert required if > 3 days"
                  className="bg-background h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between pt-2 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingLeaveRule(null)}
                className="text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  handleSaveLeaveRule(
                    {
                      name: editingLeaveRule.name,
                      allowance: editingLeaveRule.allowance,
                      approval: editingLeaveRule.approval,
                      carryForward: editingLeaveRule.carryForward,
                      emergency: editingLeaveRule.emergency,
                      thresholdRule: editingLeaveRule.thresholdRule,
                    },
                    editingLeaveRule.index
                  )
                }}
                className="bg-[#23ace3] hover:bg-[#1b97ca] text-white font-bold text-xs px-4 h-9 rounded-xl shadow-xs cursor-pointer"
              >
                Save Leave Rule
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT POLICY DOCUMENT                                         */}
      {/* ========================================================================= */}
      <Dialog open={isPolicyModalOpen} onOpenChange={setIsPolicyModalOpen}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {editingPolicyId ? 'Edit Policy Document' : 'Add Policy Document'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {editingPolicyId
                  ? 'Update document details and uploaded file.'
                  : `Add an official policy document for ${selectedDept?.name || 'this department'}.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-2 text-xs">
          {/* Document Upload Area */}
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 space-y-2">
            <label className="font-semibold block text-foreground">
              Policy Document File (PDF / DOCX)
            </label>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-border/80 hover:border-[#23ace3] bg-background hover:bg-[#23ace3]/5 cursor-pointer transition-colors text-xs text-muted-foreground hover:text-foreground shrink-0">
                <UploadCloud className="h-4 w-4 text-[#23ace3]" />
                <span>{selectedPolicyFile ? 'Change File' : (editPolicyFileName ? 'Replace File' : 'Upload File (PDF / DOCX)')}</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0]
                      setSelectedPolicyFile(file)
                      setEditPolicyFileName(file.name)
                      setEditPolicyFileSize(`${Math.round(file.size / 1024)} KB`)
                      if (!editPolicyTitle) {
                        setEditPolicyTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '))
                      }
                    }
                  }}
                />
              </label>

              {(selectedPolicyFile || editPolicyFileName) && (
                <div className="flex items-center gap-2 min-w-0 flex-1 p-2 rounded-xl bg-card border border-border/60">
                  <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[11px] font-semibold text-foreground truncate">
                      {selectedPolicyFile?.name || editPolicyFileName}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {selectedPolicyFile ? `${Math.round(selectedPolicyFile.size / 1024)} KB` : editPolicyFileSize}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1 text-foreground">Policy Document Title *</label>
            <Input
              value={editPolicyTitle}
              onChange={e => setEditPolicyTitle(e.target.value)}
              placeholder="E.g., Engineering Remote Work & Incident SLA Policy"
              className="bg-background h-9 text-xs rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-foreground">Category *</label>
              <Select
                value={editPolicyCategory}
                onChange={e => setEditPolicyCategory(e.target.value)}
                className="bg-background h-9 text-xs rounded-xl"
              >
                <option value="Leave & Attendance">Leave & Attendance</option>
                <option value="Workplace & Remote">Workplace & Remote</option>
                <option value="Compensation & Benefits">Compensation & Benefits</option>
                <option value="Conduct & Compliance">Conduct & Compliance</option>
                <option value="Statutory">Statutory</option>
                <option value="Operational">Operational</option>
                <option value="Health & Safety">Health & Safety</option>
              </Select>
            </div>

            <div>
              <label className="font-semibold block mb-1 text-foreground">Version *</label>
              <Input
                value={editPolicyVersion}
                onChange={e => setEditPolicyVersion(e.target.value)}
                placeholder="E.g., 1.0 or 2.1"
                className="bg-background h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1 text-foreground">Executive Summary</label>
            <textarea
              value={editPolicySummary}
              onChange={e => setEditPolicySummary(e.target.value)}
              rows={2}
              placeholder="Brief summary of policy coverage, eligibility, and employee obligations..."
              className="w-full text-xs p-3 rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:border-[#23ace3] transition-all resize-none"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-foreground">Policy Content Excerpt & Guidelines</label>
            <textarea
              value={editPolicyExcerpt}
              onChange={e => setEditPolicyExcerpt(e.target.value)}
              rows={4}
              placeholder="Authorized enterprise policy guidelines, statutory sections, or standard operating procedures..."
              className="w-full text-xs p-3 rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:border-[#23ace3] transition-all resize-none"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-foreground">Key Terms & Hashtags (comma-separated)</label>
            <Input
              value={editPolicyKeyTerms}
              onChange={e => setEditPolicyKeyTerms(e.target.value)}
              placeholder="E.g., Remote, On-Call, Incident SLA, Engineering"
              className="bg-background h-9 text-xs rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between pt-2 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPolicyModalOpen(false)}
            className="text-xs rounded-xl cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            disabled={!editPolicyTitle.trim() || isSavingPolicy}
            onClick={handleSavePolicy}
            className="bg-[#23ace3] hover:bg-[#1b97ca] text-white font-bold text-xs px-4 h-9 rounded-xl shadow-xs cursor-pointer"
          >
            {isSavingPolicy ? 'Saving...' : (editingPolicyId ? 'Save Policy Changes' : 'Add Policy')}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
