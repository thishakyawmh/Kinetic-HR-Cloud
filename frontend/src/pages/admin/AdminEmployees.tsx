import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeService } from '@/services/employeeService'
import { User, UserRole } from '@/types'
import { PageHeader } from '@/components/common/PageHeader'
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
  Database,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  Fingerprint,
  ShieldCheck,
  RefreshCw,
  Plus,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  ArrowRight,
  Eye,
  Globe,
  Layers,
} from 'lucide-react'

// Sample preset fingerprint scanner & legacy ERP database export
const SAMPLE_BIOMETRIC_DATASET = [
  {
    BiometricID: 'FP-9001',
    Name: 'Kasun Perera',
    Email: 'kasun.perera@kinetictech.io',
    Department: 'Branch Operations (BOC-01)',
    Role: 'employee',
    Designation: 'Branch Operations Specialist',
    FingerprintStatus: 'Enrolled (Sensor #04)',
    Joined: '2025-03-15',
  },
  {
    BiometricID: 'FP-9002',
    Name: 'Dilshan Fernando',
    Email: 'dilshan.f@kinetictech.io',
    Department: 'Branch Operations (BOC-01)',
    Role: 'manager',
    Designation: 'Senior Branch Manager',
    FingerprintStatus: 'Enrolled (Sensor #04)',
    Joined: '2024-01-10',
  },
  {
    BiometricID: 'FP-9003',
    Name: 'Nimali Jayasinghe',
    Email: 'nimali.j@kinetictech.io',
    Department: 'Risk & Compliance Audit',
    Role: 'admin',
    Designation: 'Lead Risk Auditor',
    FingerprintStatus: 'Enrolled (Sensor #01)',
    Joined: '2023-08-20',
  },
  {
    BiometricID: 'FP-9004',
    Name: 'Ruwan Silva',
    Email: 'ruwan.s@kinetictech.io',
    Department: 'Risk & Compliance Audit',
    Role: 'employee',
    Designation: 'Compliance Analyst',
    FingerprintStatus: 'Enrolled (Sensor #01)',
    Joined: '2025-06-01',
  },
  {
    BiometricID: 'FP-9005',
    Name: 'Tharindu Wickramasinghe',
    Email: 'tharindu.w@kinetictech.io',
    Department: 'Digital Banking & AI',
    Role: 'employee',
    Designation: 'Lead AI Platform Engineer',
    FingerprintStatus: 'Enrolled (Sensor #02)',
    Joined: '2026-02-12',
  },
  {
    BiometricID: 'FP-9006',
    Name: 'Senuri De Silva',
    Email: 'senuri.d@kinetictech.io',
    Department: 'Digital Banking & AI',
    Role: 'employee',
    Designation: 'Data & Machine Learning Specialist',
    FingerprintStatus: 'Enrolled (Sensor #02)',
    Joined: '2026-04-18',
  },
]

export const AdminEmployees: React.FC = () => {
  const navigate = useNavigate()
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  // 2 Navigation Tabs
  const [activeTab, setActiveTab] = useState<'departments' | 'import'>('departments')

  // Workspace Mode: 'departments' (Multiple divisions) vs 'company' (Single company workspace)
  const [workspaceMode, setWorkspaceMode] = useState<'departments' | 'company'>('departments')

  // Selection Modal state for "+ Add New Workspace"
  const [isAddWorkspaceChoiceOpen, setIsAddWorkspaceChoiceOpen] = useState(false)

  // Master directory is HIDDEN by default until user clicks blue "Explore" text inside Employee Count Card!
  const [showMasterDirectory, setShowMasterDirectory] = useState(false)

  // Three dots menu open state for department cards
  const [activeMenuDept, setActiveMenuDept] = useState<string | null>(null)

  // Expanded Department Card state for inline Employee Directory viewing
  const [expandedDept, setExpandedDept] = useState<string | null>(null)

  // Search & Filters for Master Directory
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all')

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingDept, setEditingDept] = useState<any | null>(null)

  // Single Employee Form State
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('employee')
  const [newDept, setNewDept] = useState('Engineering')
  const [newTitle, setNewTitle] = useState('')

  // Ingestion State
  const [importJsonText, setImportJsonText] = useState(JSON.stringify(SAMPLE_BIOMETRIC_DATASET, null, 2))
  const [deptColumnName, setDeptColumnName] = useState('Department')
  const [importStatus, setImportStatus] = useState<{
    success?: boolean
    message?: string
    count?: number
    createdDepts?: string[]
  } | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  // Queries
  const { data: employees = [], refetch: refetchEmployees } = useQuery({
    queryKey: ['adminEmployees', tenant?.id, selectedDeptFilter],
    queryFn: () => (tenant?.id ? employeeService.getEmployees(tenant.id, selectedDeptFilter) : []),
    enabled: !!tenant?.id,
  })

  const { data: departments = [], refetch: refetchDepts } = useQuery({
    queryKey: ['adminDepartments', tenant?.id],
    queryFn: () => employeeService.getDepartments(tenant?.id),
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
        role: newRole,
        department: newDept,
        jobTitle: newTitle || 'Team Member',
        employeeNumber: `KT-${Math.floor(1000 + Math.random() * 9000)}`,
        hireDate: new Date().toISOString().substring(0, 10),
      })
    },
    onSuccess: () => {
      refetchEmployees()
      refetchDepts()
      setIsAddModalOpen(false)
      setNewName('')
      setNewEmail('')
      setNewTitle('')
    },
  })

  // Run Bulk Ingestion
  const handleRunIngestion = async () => {
    setIsImporting(true)
    setImportStatus(null)
    try {
      const parsedData = JSON.parse(importJsonText)
      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        throw new Error('Dataset must be a non-empty array of employee objects')
      }

      const res = await employeeService.bulkImportEmployees({
        dataset: parsedData,
        departmentColumn: deptColumnName,
      })

      setImportStatus({
        success: true,
        message: `Successfully ingested ${res.importedCount} employee records into database!`,
        count: res.importedCount,
        createdDepts: res.createdDepartments,
      })

      refetchEmployees()
      refetchDepts()
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: err.message || 'Failed to process dataset ingestion',
      })
    } finally {
      setIsImporting(false)
    }
  }

  // Filter Employees
  const filteredEmployees = employees.filter(e => {
    const matchesSearch =
      !searchTerm.trim() ||
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDept = selectedDeptFilter === 'all' || e.department.toLowerCase() === selectedDeptFilter.toLowerCase()

    return matchesSearch && matchesDept
  })

  // Unique Department Names
  const allDeptNames = Array.from(
    new Set([...departments.map((d: any) => d.name), ...employees.map(e => e.department)])
  )

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <PageHeader title="Workforce, Directory & Department Hub" showBorder={false} />

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between pb-1 border-b border-border/50">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('departments')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'departments'
                ? 'bg-[#23ace3] text-white shadow-xs'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
            }`}
          >
            <Building className="h-4 w-4" />
            <span>
              {workspaceMode === 'company'
                ? 'Whole Company Workspace'
                : `Departments & Workspaces (${allDeptNames.length})`}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'bg-[#ef8d46] text-white shadow-xs'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span>Database & Fingerprint Ingestion Pool</span>
            <Badge variant="secondary" className="ml-1 text-[9px] bg-white/20 text-white">
              Biometric Legacy
            </Badge>
          </button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            refetchEmployees()
            refetchDepts()
          }}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Data</span>
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WORKSPACES & DEPARTMENTS                                           */}
      {/* ========================================================================= */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          {/* TOP OVERVIEW SUMMARY CARDS (Department/Workspace Count & Employee Count Card with Blue Explore Text) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CARD 1: DEPARTMENT / WORKSPACE COUNT CARD */}
            <Card className="border border-border/70 bg-card rounded-2xl p-5 shadow-sm hover:border-[#23ace3]/40 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="p-3.5 rounded-2xl bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30">
                    {workspaceMode === 'company' ? <Globe className="h-6 w-6" /> : <Building className="h-6 w-6" />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {workspaceMode === 'company' ? 'Active Enterprise Workspace' : 'Department Workspace Divisions'}
                    </div>
                    <div className="text-2xl font-black text-foreground mt-0.5">
                      {workspaceMode === 'company' ? '1 Whole Company Workspace' : `${allDeptNames.length} Departments`}
                    </div>
                  </div>
                </div>

                {workspaceMode === 'company' ? (
                  <button
                    type="button"
                    onClick={() => setWorkspaceMode('departments')}
                    className="text-xs text-[#23ace3] hover:underline font-semibold bg-[#23ace3]/10 px-2.5 py-1 rounded-lg border border-[#23ace3]/20 cursor-pointer"
                  >
                    Switch to Departments
                  </button>
                ) : (
                  <Badge variant="outline" className="text-xs bg-[#23ace3]/10 border-[#23ace3]/30 text-[#23ace3] font-mono">
                    Active Workspaces
                  </Badge>
                )}
              </div>
            </Card>

            {/* CARD 2: EMPLOYEE COUNT CARD WITH BLUE EXPLORE TEXT (Toggles Master Directory) */}
            <Card className="border border-border/70 bg-card rounded-2xl p-5 shadow-sm hover:border-[#23ace3]/40 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Total Active Personnel
                    </div>
                    <div className="text-2xl font-black text-foreground mt-0.5">
                      {employees.length} Members
                    </div>
                  </div>
                </div>

                {/* BLUE EXPLORE TEXT / BUTTON INSIDE EMPLOYEE CARD */}
                <button
                  type="button"
                  onClick={() => setShowMasterDirectory(!showMasterDirectory)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#23ace3]/10 hover:bg-[#23ace3]/20 border border-[#23ace3]/30 text-[#23ace3] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Click to view/hide master employee roster"
                >
                  <span>{showMasterDirectory ? 'Hide Master Roster' : 'Explore Master Directory'}</span>
                  <ArrowRight className={`h-3.5 w-3.5 transition-transform ${showMasterDirectory ? 'rotate-90' : ''}`} />
                </button>
              </div>
            </Card>
          </div>

          {/* ACTIVE DEPARTMENTS HEADER BAR WITH + ADD NEW WORKSPACE BUTTON (OPENS POPUP MODAL) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border/60 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {workspaceMode === 'company'
                  ? `${tenant?.name || 'Kinetic Technologies'} - Single Whole Company Workspace`
                  : 'Active Department Divisions & Branch Workspaces'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {workspaceMode === 'company'
                  ? 'All personnel are managed under one consolidated company workspace.'
                  : 'Manage department operational staffing thresholds, branch units, and assigned personnel.'}
              </p>
            </div>

            {/* + Add New Workspace Button OPENS POPUP DIALOG */}
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsAddWorkspaceChoiceOpen(true)}
              className="bg-[#23ace3] hover:bg-[#1b97ca] text-white text-xs font-bold px-4 h-9 rounded-xl shadow-xs gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add New Workspace</span>
            </Button>
          </div>

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
                        {tenant?.name || 'Kinetic Technologies'} Whole Company Workspace
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
                      <span>+ Add Employee</span>
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
          ) : (
            /* MULTI-DEPARTMENT CARDS GRID (With Three Dots Menu for Explore and Edit) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {departments.map((dept: any, i: number) => {
                const deptMembers = employees.filter(
                  e => e.department.toLowerCase() === dept.name.toLowerCase()
                )
                const isExpanded = expandedDept === dept.name
                const isMenuOpen = activeMenuDept === dept.name

                return (
                  <Card
                    key={dept.id || i}
                    className={`border transition-all shadow-sm rounded-2xl overflow-hidden relative ${
                      isExpanded
                        ? 'md:col-span-2 lg:col-span-3 border-[#23ace3] bg-card ring-2 ring-[#23ace3]/20'
                        : 'border-border/70 hover:border-[#23ace3]/60 bg-card hover:shadow-md'
                    }`}
                  >
                    <CardContent className="p-5 space-y-4">
                      {/* Card Top: Department Name & Three Dots (...) Dropdown Menu */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30">
                            <Building className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-foreground text-base tracking-tight">{dept.name}</h4>
                            <div className="text-[11px] text-[#23ace3] font-mono">
                              Lead: {dept.head || 'Sarah Miller'}
                            </div>
                          </div>
                        </div>

                        {/* THREE DOTS (...) MENU CONTAINER */}
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveMenuDept(isMenuOpen ? null : dept.name)}
                            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                            title="Department Actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>

                          {/* THREE DOTS DROPDOWN MENU WITH EXPLORE & EDIT FUNCTIONS */}
                          {isMenuOpen && (
                            <div className="absolute right-0 top-9 z-30 w-40 bg-card border border-border rounded-xl shadow-lg p-1.5 text-xs space-y-1 animate-in fade-in zoom-in-95">
                              {/* Option 1: Explore (Inline Directory) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedDept(isExpanded ? null : dept.name)
                                  setActiveMenuDept(null)
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#23ace3]/10 text-[#23ace3] font-medium flex items-center justify-between cursor-pointer"
                              >
                                <span>{isExpanded ? 'Close Roster' : 'Explore Roster'}</span>
                                <Eye className="h-3.5 w-3.5" />
                              </button>

                              {/* Option 2: Edit */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDept(dept)
                                  setActiveMenuDept(null)
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-foreground font-medium flex items-center justify-between cursor-pointer"
                              >
                                <span>Edit Details</span>
                                <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {dept.description || 'Department workspace division for operational staffing and approvals.'}
                      </p>

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

                      {/* Inline Action Row */}
                      <div className="flex items-center justify-between pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNewDept(dept.name)
                            setIsAddModalOpen(true)
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
                        >
                          <UserPlus className="h-3.5 w-3.5 text-[#23ace3]" />
                          <span>+ Add Staff</span>
                        </Button>

                        {/* Blue Explore Action Button */}
                        <button
                          type="button"
                          onClick={() => setExpandedDept(isExpanded ? null : dept.name)}
                          className="text-xs font-bold text-[#23ace3] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExpanded ? 'Hide Personnel' : 'Explore Personnel'}</span>
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {/* EMBEDDED EMPLOYEE DIRECTORY INSIDE DEPARTMENT CARD */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-border/60 space-y-3 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-foreground flex items-center gap-2">
                              <Users className="h-4 w-4 text-[#23ace3]" />
                              <span>{dept.name} Personnel Directory ({deptMembers.length} Members)</span>
                            </h5>
                          </div>

                          <div className="rounded-xl border border-border/60 overflow-hidden bg-background">
                            <Table>
                              <TableHeader className="bg-muted/40">
                                <TableRow className="border-border/50">
                                  <TableHead className="text-xs">Employee</TableHead>
                                  <TableHead className="text-xs">Designation</TableHead>
                                  <TableHead className="text-xs">Role</TableHead>
                                  <TableHead className="text-xs">Biometric</TableHead>
                                  <TableHead className="text-xs text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {deptMembers.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-xs">
                                      No personnel currently assigned to {dept.name}. Click "+ Add Staff" above to assign.
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  deptMembers.map(emp => (
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
                                      <TableCell className="text-xs text-foreground font-medium">{emp.jobTitle}</TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className="text-[9px] capitalize">
                                          {emp.role}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                                          <Fingerprint className="h-3 w-3" />
                                          <span>Active</span>
                                        </div>
                                      </TableCell>
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
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
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
                            <div className="font-semibold text-foreground flex items-center gap-1">
                              <Building className="h-3 w-3 text-[#23ace3]" />
                              <span>{emp.department}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground">{emp.jobTitle}</div>
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
      {/* TAB 2: LEGACY DATABASE & FINGERPRINT SCANNER INGESTION POOL             */}
      {/* ========================================================================= */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <Card className="border-[#ef8d46]/30 bg-card rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5 text-[#ef8d46]" />
                  <h3 className="text-base font-bold text-foreground">
                    Legacy HR Database & Fingerprint Scanner Ingestion Pool
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground max-w-3xl">
                  Enterprise organizations (like Bank of Ceylon) maintain legacy employee databases or fingerprint scanning attendance hardware.
                  Paste your raw dataset below, specify the <strong>Department Column Name</strong>, and Kinetic HR will automatically create all department workspace divisions and link personnel into the directory!
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportJsonText(JSON.stringify(SAMPLE_BIOMETRIC_DATASET, null, 2))}
                className="gap-1.5 text-xs border-[#ef8d46]/40 text-[#ef8d46] hover:bg-[#ef8d46]/10 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Reset Sample Fingerprint Dataset</span>
              </Button>
            </div>

            {/* Column Mapping Field */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  Department Column Name in Dataset
                </label>
                <Input
                  value={deptColumnName}
                  onChange={e => setDeptColumnName(e.target.value)}
                  placeholder="E.g., Department, Division, dept_name, or Branch"
                  className="bg-background h-9 text-xs rounded-xl"
                />
                <p className="text-[11px] text-muted-foreground">
                  Kinetic HR will inspect this column key to automatically partition & create department divisions.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  Biometric Hardware Integration Pipeline
                </label>
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Fingerprint Scanner Active (Auto-Link Biometric Serial IDs)</span>
                </div>
              </div>
            </div>

            {/* JSON Dataset Editor */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Raw Database Pool Payload (JSON / CSV Format)
              </label>
              <textarea
                value={importJsonText}
                onChange={e => setImportJsonText(e.target.value)}
                rows={10}
                className="w-full font-mono text-xs p-3.5 rounded-xl bg-slate-950 text-emerald-400 border border-slate-800 focus:outline-none focus:border-[#23ace3] transition-all"
              />
            </div>

            {/* Action Trigger & Feedback */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-muted-foreground">
                Loaded Record Pool: <strong>{SAMPLE_BIOMETRIC_DATASET.length} Biometric Entries</strong>
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={handleRunIngestion}
                disabled={isImporting || !importJsonText.trim()}
                className="bg-[#ef8d46] hover:bg-[#d97c38] text-white gap-2 rounded-xl text-xs px-5 shadow-xs cursor-pointer"
              >
                {isImporting ? (
                  <span>Ingesting Dataset...</span>
                ) : (
                  <>
                    <Database className="h-4 w-4" />
                    <span>Run Ingestion & Auto-Partition Departments</span>
                  </>
                )}
              </Button>
            </div>

            {/* Ingestion Status Banner */}
            {importStatus && (
              <div
                className={`p-4 rounded-xl text-xs border space-y-2 ${
                  importStatus.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-destructive/10 border-destructive/30 text-destructive'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {importStatus.success ? <CheckCircle2 className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                  <span>{importStatus.message}</span>
                </div>

                {importStatus.createdDepts && importStatus.createdDepts.length > 0 && (
                  <div className="pt-1">
                    <div className="font-semibold text-foreground mb-1">
                      ✨ Auto-Created New Department Divisions ({importStatus.createdDepts.length}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {importStatus.createdDepts.map(d => (
                        <Badge key={d} className="bg-[#23ace3] text-white">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
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
      {/* MODAL: ADD SINGLE EMPLOYEE                                                */}
      {/* ========================================================================= */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogHeader>
          <DialogTitle>Add Single Employee to {newDept || 'Workspace'}</DialogTitle>
          <DialogDescription>
            Enrolls the employee into {tenant?.name} with automated Microsoft Entra ID claim provisioning.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div>
            <label className="font-semibold block mb-1">Full Name</label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="E.g., Jane Cooper" />
          </div>
          <div>
            <label className="font-semibold block mb-1">Work Email</label>
            <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="jane.cooper@kinetictech.io" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Role</label>
              <Select value={newRole} onChange={e => setNewRole(e.target.value as UserRole)}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">HR Admin</option>
              </Select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Department</label>
              <Select value={newDept} onChange={e => setNewDept(e.target.value)}>
                {allDeptNames.map((d: any) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="font-semibold block mb-1">Job Title</label>
            <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="E.g., Senior Systems Architect" />
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
            className="bg-[#23ace3] text-white"
          >
            {addEmployeeMutation.isPending ? 'Provisioning...' : 'Provision Employee'}
          </Button>
        </DialogFooter>
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
                <Input
                  value={editingDept.head || ''}
                  onChange={e => setEditingDept({ ...editingDept, head: e.target.value })}
                />
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
                <label className="font-semibold block mb-1">Department</label>
                <Select
                  value={editingUser.department}
                  onChange={e => setEditingUser({ ...editingUser, department: e.target.value })}
                >
                  {allDeptNames.map((d: any) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
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
    </div>
  )
}
