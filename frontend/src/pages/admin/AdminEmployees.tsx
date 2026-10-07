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
  Users,
  Database,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Fingerprint,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Plus,
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

  // Tab state (Default to Departments & Workspaces as requested)
  const [activeTab, setActiveTab] = useState<'departments' | 'import' | 'directory'>('departments')

  // Search and Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all')

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // Single Employee Form State
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('employee')
  const [newDept, setNewDept] = useState('Engineering')
  const [newTitle, setNewTitle] = useState('')

  // Ingestion / Import State
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

  // Run Bulk Dataset Ingestion
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

  // Calculate unique departments from employee records + static departments
  const allDeptNames = Array.from(
    new Set([...departments.map((d: any) => d.name), ...employees.map(e => e.department)])
  )

  return (
    <div className="space-y-6">
      {/* Page Header (Clean, without top buttons as requested) */}
      <PageHeader
        title="Workforce, Directory & Department Hub"
        subtitle="Unified department division workspaces, legacy biometric dataset ingestion pool, and employee directory."
        badge={
          <Badge variant="outline" className="text-xs bg-[#23ace3]/10 border-[#23ace3]/30 text-[#23ace3]">
            {tenant?.plan || 'Enterprise'} Plan • {employees.length} Active Personnel
          </Badge>
        }
      />

      {/* Primary Navigation Tabs in Requested Order */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex gap-2">
          {/* TAB 1: DEPARTMENTS & WORKSPACES */}
          <button
            onClick={() => setActiveTab('departments')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'departments'
                ? 'bg-[#23ace3] text-white shadow-xs'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
            }`}
          >
            <Building className="h-4 w-4" />
            <span>Departments & Workspaces ({allDeptNames.length})</span>
          </button>

          {/* TAB 2: DATABASE & FINGERPRINT INGESTION POOL */}
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

          {/* TAB 3: EMPLOYEE DIRECTORY */}
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-[#23ace3] text-white shadow-xs'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Employee Directory ({employees.length})</span>
          </button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            refetchEmployees()
            refetchDepts()
          }}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Data</span>
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DEPARTMENTS & WORKSPACE DIVISIONS (FIRST TAB)                      */}
      {/* ========================================================================= */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          {/* Section Header with Add New Workspace Button */}
          <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border/60">
            <div>
              <h3 className="text-sm font-bold text-foreground">Active Department Divisions & Branch Workspaces</h3>
              <p className="text-xs text-muted-foreground">
                Manage department operational staffing thresholds, branch units, and assigned personnel.
              </p>
            </div>

            {/* Dedicated + Add New Workspace Button (Navigates to full new page) */}
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/admin/workforce/create-workspace')}
              className="bg-[#23ace3] hover:bg-[#1b97ca] text-white text-xs font-semibold px-4 h-9 rounded-xl shadow-xs gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add New Workspace</span>
            </Button>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border/60 bg-card rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#23ace3]/10 text-[#23ace3]">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Active Workspaces</div>
                  <div className="text-xl font-bold text-foreground">{allDeptNames.length} Divisions</div>
                </div>
              </div>
            </Card>

            <Card className="border-border/60 bg-card rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Total Personnel Assigned</div>
                  <div className="text-xl font-bold text-foreground">{employees.length} Members</div>
                </div>
              </div>
            </Card>

            <Card className="border-border/60 bg-card rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#ef8d46]/10 text-[#ef8d46]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Average Staffing SLA</div>
                  <div className="text-xl font-bold text-foreground">75% Min Quota</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Department Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept: any, i: number) => (
              <Card key={dept.id || i} className="border-border/60 hover:border-[#23ace3]/40 transition-all shadow-xs bg-card rounded-2xl">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[#23ace3]/10 text-[#23ace3]">
                        <Building className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-sm">{dept.name}</h4>
                        <div className="text-[10px] text-muted-foreground font-mono">ID: {dept.id}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      {dept.status || 'Active'}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {dept.description || 'Department workspace division for operational staffing and approvals.'}
                  </p>

                  <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/50">
                    <div className="flex justify-between">
                      <span>Department Lead:</span>
                      <span className="font-semibold text-foreground">{dept.head || 'Sarah Miller'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Assigned Personnel:</span>
                      <span className="font-semibold text-[#23ace3]">
                        {employees.filter(e => e.department.toLowerCase() === dept.name.toLowerCase()).length} Members
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Staffing SLA Threshold:</span>
                      <span className="font-semibold text-emerald-400">{dept.threshold || '75% Min'}</span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedDeptFilter(dept.name)
                      setActiveTab('directory')
                    }}
                    className="w-full text-xs text-[#23ace3] hover:bg-[#23ace3]/10 gap-1.5 mt-1 cursor-pointer"
                  >
                    <span>View Directory Personnel ({employees.filter(e => e.department.toLowerCase() === dept.name.toLowerCase()).length})</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LEGACY DATABASE & FINGERPRINT SCANNER INGESTION POOL (SECOND TAB)  */}
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
      {/* TAB 3: EMPLOYEE DIRECTORY & ROSTER (THIRD TAB)                             */}
      {/* ========================================================================= */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Filter, Search, and Add Single Employee Button Bar inside Tab 3 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/60">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
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

            {/* Dedicated + Add Single Employee Button inside Employee Directory tab */}
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="gap-1.5 text-xs bg-[#23ace3] hover:bg-[#1b97ca] text-white rounded-xl shadow-xs h-10 px-4 whitespace-nowrap cursor-pointer shrink-0"
            >
              <UserPlus className="h-4 w-4" />
              <span>+ Add Single Employee</span>
            </Button>
          </div>

          {/* Employees Table */}
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

      {/* ========================================================================= */}
      {/* MODAL: ADD SINGLE EMPLOYEE                                                */}
      {/* ========================================================================= */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogHeader>
          <DialogTitle>Add Single Employee</DialogTitle>
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
                className="bg-[#23ace3] text-white"
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
