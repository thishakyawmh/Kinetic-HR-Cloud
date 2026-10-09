import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { branchService } from '@/services/branchService'
import { employeeService } from '@/services/employeeService'
import { Branch, BranchType, BranchHoliday } from '@/types'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Building2,
  MapPin,
  Users,
  Phone,
  Mail,
  Clock,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Crown,
  Calendar,
  CalendarDays,
  Shield,
  Sparkles,
  Lock,
} from 'lucide-react'

export const AdminBranches: React.FC = () => {
  const navigate = useNavigate()
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  // Guard: Only Business & Enterprise plans have multi-branch management
  const isEligible = tenant?.plan === 'Business' || tenant?.plan === 'Enterprise'

  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Modals state
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Branch Holiday Modal state
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false)
  const [targetBranchForHoliday, setTargetBranchForHoliday] = useState<Branch | null>(null)
  const [holidayScope, setHolidayScope] = useState<'all' | 'selected' | 'single'>('all')
  const [selectedBranchIdsForHoliday, setSelectedBranchIdsForHoliday] = useState<string[]>([])
  const [holidayError, setHolidayError] = useState('')
  const [newHolidayName, setNewHolidayName] = useState('')
  const [newHolidayDate, setNewHolidayDate] = useState('')
  const [newHolidayType, setNewHolidayType] = useState('Regional Holiday')
  const [newHolidayNotes, setNewHolidayNotes] = useState('')

  // Branch Form state
  const [branchName, setBranchName] = useState('')
  const [branchCode, setBranchCode] = useState('')
  const [branchType, setBranchType] = useState<BranchType>('Regional Branch')
  const [branchAddress, setBranchAddress] = useState('')
  const [branchCity, setBranchCity] = useState('')
  const [branchCountry, setBranchCountry] = useState('Sri Lanka')
  const [branchPhone, setBranchPhone] = useState('')
  const [branchEmail, setBranchEmail] = useState('')
  const [branchTimezone, setBranchTimezone] = useState('Asia/Colombo (UTC+5:30)')
  const [branchManagerId, setBranchManagerId] = useState('')
  const [isHeadquarters, setIsHeadquarters] = useState(false)
  const [branchStatus, setBranchStatus] = useState<'Active' | 'Inactive'>('Active')
  const [formError, setFormError] = useState('')

  // Queries
  const { data: branches = [], isLoading: isLoadingBranches } = useQuery({
    queryKey: ['branches', tenant?.id],
    queryFn: () => branchService.getBranches(tenant?.id),
    enabled: !!tenant,
  })

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', tenant?.id],
    queryFn: () => (tenant?.id ? employeeService.getEmployees(tenant.id) : []),
    enabled: !!tenant?.id,
  })

  // Mutations
  const createBranchMutation = useMutation({
    mutationFn: async () => {
      if (!tenant) throw new Error('Tenant missing')
      const manager = employees.find(e => e.id === branchManagerId)
      return branchService.createBranch({
        tenantId: tenant.id,
        name: branchName.trim(),
        code: branchCode.trim() || `BR-${Math.floor(100 + Math.random() * 900)}`,
        type: branchType,
        address: branchAddress.trim(),
        city: branchCity.trim(),
        country: branchCountry.trim(),
        phone: branchPhone.trim(),
        email: branchEmail.trim(),
        timezone: branchTimezone,
        branchManagerId: branchManagerId || undefined,
        branchManagerName: manager ? manager.name : undefined,
        isHeadquarters,
        status: branchStatus,
        holidays: [],
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      closeBranchModal()
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to save branch')
    },
  })

  const updateBranchMutation = useMutation({
    mutationFn: async () => {
      if (!editingBranch) return
      const manager = employees.find(e => e.id === branchManagerId)
      return branchService.updateBranch(editingBranch.id, {
        name: branchName.trim(),
        code: branchCode.trim(),
        type: branchType,
        address: branchAddress.trim(),
        city: branchCity.trim(),
        country: branchCountry.trim(),
        phone: branchPhone.trim(),
        email: branchEmail.trim(),
        timezone: branchTimezone,
        branchManagerId: branchManagerId || undefined,
        branchManagerName: manager ? manager.name : undefined,
        isHeadquarters,
        status: branchStatus,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      closeBranchModal()
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update branch')
    },
  })

  const deleteBranchMutation = useMutation({
    mutationFn: async (id: string) => {
      return branchService.deleteBranch(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      setDeleteConfirmId(null)
    },
  })

  // Branch Holiday Mutation (supports all, selected, or single branch)
  const addHolidayMutation = useMutation({
    mutationFn: async () => {
      const targetIds =
        holidayScope === 'all'
          ? branches.map(b => b.id)
          : holidayScope === 'selected'
          ? selectedBranchIdsForHoliday
          : targetBranchForHoliday
          ? [targetBranchForHoliday.id]
          : []

      if (targetIds.length === 0) {
        throw new Error('Please select at least one branch for this holiday.')
      }

      const baseHoliday = {
        name: newHolidayName.trim(),
        date: newHolidayDate,
        type: newHolidayType,
        notes: newHolidayNotes.trim() || undefined,
      }

      await Promise.all(
        targetIds.map(async (branchId, idx) => {
          const br = branches.find(b => b.id === branchId)
          if (!br) return
          const newHoliday: BranchHoliday = {
            ...baseHoliday,
            id: `hol-${Date.now().toString(36)}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          }
          const existingHolidays = br.holidays || []
          return branchService.updateBranch(br.id, {
            holidays: [...existingHolidays, newHoliday],
          })
        })
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      setIsHolidayModalOpen(false)
      setTargetBranchForHoliday(null)
      setSelectedBranchIdsForHoliday([])
      setNewHolidayName('')
      setNewHolidayDate('')
      setNewHolidayNotes('')
      setHolidayError('')
    },
    onError: (err: any) => {
      setHolidayError(err.message || 'Failed to apply holiday')
    },
  })

  const removeHolidayMutation = useMutation({
    mutationFn: async ({ branch, holidayId }: { branch: Branch; holidayId: string }) => {
      const updatedHolidays = (branch.holidays || []).filter(h => h.id !== holidayId)
      return branchService.updateBranch(branch.id, {
        holidays: updatedHolidays,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
    },
  })

  const openBatchHolidayModal = () => {
    setHolidayScope('all')
    setSelectedBranchIdsForHoliday(branches.map(b => b.id))
    setTargetBranchForHoliday(null)
    setNewHolidayName('')
    setNewHolidayDate(new Date().toISOString().substring(0, 10))
    setNewHolidayType('Regional Holiday')
    setNewHolidayNotes('')
    setHolidayError('')
    setIsHolidayModalOpen(true)
  }

  const openAddBranchModal = () => {
    setEditingBranch(null)
    setBranchName('')
    setBranchCode('')
    setBranchType('Regional Branch')
    setBranchAddress('')
    setBranchCity('')
    setBranchCountry('Sri Lanka')
    setBranchPhone('')
    setBranchEmail('')
    setBranchTimezone('Asia/Colombo (UTC+5:30)')
    setBranchManagerId('')
    setIsHeadquarters(branches.length === 0)
    setBranchStatus('Active')
    setFormError('')
    setIsBranchModalOpen(true)
  }

  const openEditBranchModal = (branch: Branch) => {
    setEditingBranch(branch)
    setBranchName(branch.name)
    setBranchCode(branch.code)
    setBranchType(branch.type)
    setBranchAddress(branch.address || '')
    setBranchCity(branch.city)
    setBranchCountry(branch.country || 'Sri Lanka')
    setBranchPhone(branch.phone || '')
    setBranchEmail(branch.email || '')
    setBranchTimezone(branch.timezone || 'Asia/Colombo (UTC+5:30)')
    setBranchManagerId(branch.branchManagerId || '')
    setIsHeadquarters(branch.isHeadquarters)
    setBranchStatus(branch.status)
    setFormError('')
    setIsBranchModalOpen(true)
  }

  const closeBranchModal = () => {
    setIsBranchModalOpen(false)
    setEditingBranch(null)
    setFormError('')
  }

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!branchName.trim()) {
      setFormError('Please enter a branch name.')
      return
    }
    if (!branchCity.trim()) {
      setFormError('Please enter a city or regional location.')
      return
    }
    if (editingBranch) {
      updateBranchMutation.mutate()
    } else {
      createBranchMutation.mutate()
    }
  }

  // Filter branches
  const filteredBranches = branches.filter(b => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.address && b.address.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = typeFilter === 'all' || b.type === typeFilter
    return matchesSearch && matchesType
  })

  // Statistics
  const hqBranch = branches.find(b => b.isHeadquarters)
  const totalBranchHeadcount = branches.reduce((acc, b) => acc + (b.employeeCount || 0), 0)
  const totalHolidaysCount = branches.reduce((acc, b) => acc + (b.holidays?.length || 0), 0)

  // Manager candidates
  const managerCandidates = employees.filter(e => e.role === 'manager' || e.role === 'admin' || e.role === 'employee')

  // Upgrade banner for Starter plan
  if (!isEligible) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-6 text-center font-sans">
        <div className="h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Multi-Branch Architecture</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Multi-branch operations, regional office management, and branch-specific holiday calendars are available on <span className="font-semibold text-foreground">Business</span> and <span className="font-semibold text-foreground">Enterprise</span> subscription plans.
        </p>
        <div className="pt-2">
          <Button
            onClick={() => navigate('/admin/dashboard')}
            className="bg-[#23ace3] hover:bg-[#1f98c9] text-white text-xs font-semibold rounded-xl"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <PageHeader
            title="Branches & Operating Sites"
            subtitle="Manage office branches, managers, and regional holiday calendars."
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={openBatchHolidayModal}
            className="text-xs font-semibold rounded-xl border-border/70 hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 gap-1.5 cursor-pointer h-9 shadow-2xs"
          >
            <CalendarDays className="h-4 w-4 text-purple-500" />
            <span>Set Holiday for Branches</span>
          </Button>

          <Button
            onClick={openAddBranchModal}
            className="bg-[#23ace3] hover:bg-[#1f98c9] text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer gap-1.5 h-9"
          >
            <Plus className="h-4 w-4" />
            <span>Add Branch</span>
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border/60 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Operating Branches
              </div>
              <div className="text-2xl font-bold text-foreground mt-1">
                {branches.length}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Physical sites & hubs
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#23ace3]/15 text-[#23ace3] flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Headquarters
              </div>
              <div className="text-base font-bold text-foreground mt-1 truncate max-w-[150px]">
                {hqBranch ? hqBranch.city : 'Not Designated'}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[150px]">
                {hqBranch ? hqBranch.name : 'Designate primary site'}
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Crown className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Regional Holidays
              </div>
              <div className="text-2xl font-bold text-foreground mt-1">
                {totalHolidaysCount}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <CalendarDays className="h-3 w-3 text-[#23ace3]" /> Branch calendars
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border/60 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search branches by name, city, code..."
            className="pl-9 text-xs rounded-xl w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <label className="text-xs text-muted-foreground font-semibold shrink-0">Filter Type:</label>
          <Select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="text-xs rounded-xl h-9 min-w-[160px]"
          >
            <option value="all">All Branch Types</option>
            <option value="Headquarters">Headquarters</option>
            <option value="Regional Branch">Regional Branch</option>
            <option value="Hub">Innovation Hub</option>
            <option value="Warehouse / Facility">Warehouse / Facility</option>
            <option value="Remote Hub">Remote Hub</option>
          </Select>
        </div>
      </div>

      {/* Branches List */}
      {isLoadingBranches ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          Loading organizational branch directory...
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card">
          <Building2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <div className="text-sm font-semibold text-foreground">No branches found</div>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No branches match your search query.'
              : 'Add your first branch location to manage regional sites and local holidays.'}
          </p>
          {!searchQuery && (
            <Button
              onClick={openAddBranchModal}
              className="mt-4 bg-[#23ace3] hover:bg-[#1f98c9] text-white text-xs font-semibold rounded-xl"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add First Branch
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBranches.map(branch => {
            const branchHolidays = branch.holidays || []

            return (
              <Card
                key={branch.id}
                className={`rounded-2xl border transition-all duration-200 hover:shadow-md relative overflow-hidden flex flex-col justify-between ${
                  branch.isHeadquarters
                    ? 'border-amber-500/40 dark:border-amber-500/30 bg-gradient-to-br from-card via-card to-amber-500/5'
                    : 'border-border/60 bg-card'
                }`}
              >
                {/* Top Strip for Headquarters */}
                {branch.isHeadquarters && (
                  <div className="bg-amber-500 text-amber-950 font-bold text-[10px] uppercase tracking-wider py-0.5 px-3 text-center flex items-center justify-center gap-1 shadow-2xs">
                    <Crown className="h-3 w-3" /> Primary Corporate Headquarters
                  </div>
                )}

                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-bold text-foreground">
                          {branch.name}
                        </CardTitle>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/50">
                          {branch.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3.5 w-3.5 text-[#23ace3] shrink-0" />
                        <span>{branch.city}, {branch.country}</span>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold shrink-0 ${
                        branch.type === 'Headquarters'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          : branch.type === 'Regional Branch'
                          ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
                          : 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                      }`}
                    >
                      {branch.type}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3 flex-1 flex flex-col justify-between">
                  {/* Physical Address & Contact Info */}
                  <div className="space-y-2 text-xs text-muted-foreground">
                    {branch.address && (
                      <div className="text-[11px] leading-relaxed text-foreground/80 line-clamp-2">
                        {branch.address}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-1 pt-1 border-t border-border/40 text-[11px]">
                      {branch.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3 text-muted-foreground/80 shrink-0" />
                          <span className="truncate">{branch.phone}</span>
                        </div>
                      )}
                      {branch.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3 w-3 text-muted-foreground/80 shrink-0" />
                          <span className="truncate">{branch.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3 w-3 text-muted-foreground/80 shrink-0" />
                        <span className="truncate">{branch.timezone || 'Asia/Colombo (UTC+5:30)'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Leadership & Personnel Footnote */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 rounded-full bg-[#23ace3]/20 text-[#23ace3] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {branch.branchManagerName ? branch.branchManagerName[0] : 'U'}
                      </div>
                      <div className="truncate">
                        <div className="text-[10px] text-muted-foreground leading-none">Branch Manager</div>
                        <div className="text-[11px] font-semibold text-foreground truncate mt-0.5">
                          {branch.branchManagerName || 'Unassigned Manager'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-lg bg-muted/60 text-foreground font-semibold text-[11px]">
                      <Users className="h-3 w-3 text-[#23ace3]" />
                      <span>{branch.employeeCount || 0} Staff</span>
                    </div>
                  </div>

                  {/* Local Branch Holidays Section */}
                  <div className="pt-2.5 border-t border-border/40">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                        <CalendarDays className="h-3 w-3 text-[#23ace3]" />
                        Branch Holidays ({branchHolidays.length})
                      </span>
                    </div>

                    {branchHolidays.length === 0 ? (
                      <div className="text-[10px] text-muted-foreground italic bg-muted/30 p-2 rounded-lg">
                        Observes global company holidays only.
                      </div>
                    ) : (
                      <div className="space-y-1 max-h-24 overflow-y-auto no-scrollbar">
                        {branchHolidays.map(h => (
                          <div
                            key={h.id}
                            className="flex items-center justify-between p-1.5 rounded-lg bg-muted/40 text-[11px] group"
                          >
                            <div className="truncate">
                              <span className="font-semibold text-foreground mr-1">{h.name}</span>
                              <span className="text-[10px] font-mono text-muted-foreground">({h.date})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeHolidayMutation.mutate({ branch, holidayId: h.id })}
                              className="text-muted-foreground hover:text-destructive p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Remove holiday"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/40">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditBranchModal(branch)}
                      className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1 text-[#23ace3]" /> Edit Details
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(branch.id)}
                      className="h-8 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                      disabled={branch.isHeadquarters}
                      title={branch.isHeadquarters ? 'Headquarters cannot be deleted' : 'Delete branch'}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT BRANCH                                                  */}
      {/* ========================================================================= */}
      <Dialog open={isBranchModalOpen} onOpenChange={setIsBranchModalOpen}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {editingBranch ? 'Edit Branch Location' : 'Provision New Branch'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {editingBranch
                  ? `Update operating details, contact channels, and leadership for ${editingBranch.name}.`
                  : `Establish an operating branch or regional office under ${tenant?.name || 'Sampath Bank PLC'}.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleBranchSubmit} className="space-y-4 text-xs font-sans mt-2">
          {formError && (
            <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="font-semibold block mb-1 text-foreground">
                Branch / Site Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={branchName}
                onChange={e => setBranchName(e.target.value)}
                placeholder="E.g., Kandy Regional Branch"
                className="text-xs rounded-xl"
                required
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-foreground">
                Branch Code
              </label>
              <Input
                value={branchCode}
                onChange={e => setBranchCode(e.target.value.toUpperCase())}
                placeholder="E.g., KDY-01"
                className="text-xs rounded-xl font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-foreground">
                Branch Type
              </label>
              <Select
                value={branchType}
                onChange={e => setBranchType(e.target.value as BranchType)}
                className="text-xs rounded-xl"
              >
                <option value="Headquarters">Headquarters</option>
                <option value="Regional Branch">Regional Branch</option>
                <option value="Hub">Innovation Hub</option>
                <option value="Warehouse / Facility">Warehouse / Facility</option>
                <option value="Remote Hub">Remote Hub</option>
              </Select>
            </div>

            <div>
              <label className="font-semibold block mb-1 text-foreground">
                Assigned Branch Manager
              </label>
              <Select
                value={branchManagerId}
                onChange={e => setBranchManagerId(e.target.value)}
                className="text-xs rounded-xl"
              >
                <option value="">Unassigned Manager</option>
                {managerCandidates.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.department || m.role})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1 text-foreground">
              Physical Street Address
            </label>
            <Input
              value={branchAddress}
              onChange={e => setBranchAddress(e.target.value)}
              placeholder="E.g., No. 45, Dalada Veediya"
              className="text-xs rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-foreground">
                City / Region <span className="text-destructive">*</span>
              </label>
              <Input
                value={branchCity}
                onChange={e => setBranchCity(e.target.value)}
                placeholder="E.g., Kandy"
                className="text-xs rounded-xl"
                required
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-foreground">
                Country
              </label>
              <Input
                value={branchCountry}
                onChange={e => setBranchCountry(e.target.value)}
                placeholder="E.g., Sri Lanka"
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-foreground">
                Contact Phone
              </label>
              <Input
                value={branchPhone}
                onChange={e => setBranchPhone(e.target.value)}
                placeholder="E.g., +94 81 223 4455"
                className="text-xs rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-foreground">
                Official Email
              </label>
              <Input
                value={branchEmail}
                onChange={e => setBranchEmail(e.target.value)}
                placeholder="E.g., kandy@company.com"
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Headquarters Checkbox & Status */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isHqCheckBranches"
                checked={isHeadquarters}
                onChange={e => setIsHeadquarters(e.target.checked)}
                className="rounded h-4 w-4 text-[#23ace3] focus:ring-[#23ace3]"
              />
              <label htmlFor="isHqCheckBranches" className="text-xs font-semibold text-foreground cursor-pointer">
                Primary Organization Headquarters
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-muted-foreground">Status:</label>
              <Select
                value={branchStatus}
                onChange={e => setBranchStatus(e.target.value as 'Active' | 'Inactive')}
                className="text-xs rounded-lg h-7 py-0"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeBranchModal}
              className="text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createBranchMutation.isPending || updateBranchMutation.isPending}
              className="bg-[#23ace3] hover:bg-[#1f98c9] text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              {editingBranch ? 'Update Branch' : 'Establish Branch'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: ADD BRANCH HOLIDAY                                                 */}
      {/* ========================================================================= */}
      <Dialog open={isHolidayModalOpen} onOpenChange={setIsHolidayModalOpen}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 border border-purple-500/30">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {holidayScope === 'all'
                  ? 'Set Holiday for All Branches'
                  : holidayScope === 'selected'
                  ? `Set Holiday for Selected Branches (${selectedBranchIdsForHoliday.length})`
                  : `Add Holiday for ${targetBranchForHoliday?.name || 'Branch'}`}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Configure regional observances, public holidays, or festivals across your operating sites.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={e => {
            e.preventDefault()
            addHolidayMutation.mutate()
          }}
          className="space-y-3.5 text-xs font-sans mt-2"
        >
          {holidayError && (
            <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium">
              {holidayError}
            </div>
          )}

          {/* Scope Selector: All / Selected / Single */}
          <div className="space-y-1.5">
            <label className="font-semibold block text-foreground">
              Target Branches Scope
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setHolidayScope('all')
                  setSelectedBranchIdsForHoliday(branches.map(b => b.id))
                }}
                className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                  holidayScope === 'all'
                    ? 'bg-[#23ace3]/15 border-[#23ace3] text-[#23ace3]'
                    : 'bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>All Branches</span>
                </div>
                <div className="text-[10px] font-normal opacity-80 mt-0.5">
                  {branches.length} locations
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setHolidayScope('selected')
                  if (selectedBranchIdsForHoliday.length === 0) {
                    setSelectedBranchIdsForHoliday(branches.map(b => b.id))
                  }
                }}
                className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                  holidayScope === 'selected'
                    ? 'bg-[#23ace3]/15 border-[#23ace3] text-[#23ace3]'
                    : 'bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Selected</span>
                </div>
                <div className="text-[10px] font-normal opacity-80 mt-0.5">
                  {selectedBranchIdsForHoliday.length} of {branches.length}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setHolidayScope('single')
                  if (!targetBranchForHoliday && branches.length > 0) {
                    setTargetBranchForHoliday(branches[0])
                  }
                }}
                className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                  holidayScope === 'single'
                    ? 'bg-[#23ace3]/15 border-[#23ace3] text-[#23ace3]'
                    : 'bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Single Branch</span>
                </div>
                <div className="text-[10px] font-normal opacity-80 mt-0.5 truncate">
                  {targetBranchForHoliday ? targetBranchForHoliday.name : 'Choose one'}
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Branch Selection Area */}
          {holidayScope === 'all' && (
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 text-xs flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-purple-500" />
              <span>This holiday will be automatically scheduled across all <strong>{branches.length}</strong> active branches.</span>
            </div>
          )}

          {holidayScope === 'selected' && (
            <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  Choose Branches to Receive Holiday ({selectedBranchIdsForHoliday.length}/{branches.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBranchIdsForHoliday(branches.map(b => b.id))}
                    className="text-[11px] text-[#23ace3] hover:underline font-semibold cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedBranchIdsForHoliday([])}
                    className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {branches.map(b => {
                  const isChecked = selectedBranchIdsForHoliday.includes(b.id)
                  return (
                    <label
                      key={b.id}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-[#23ace3]/10 border-[#23ace3]/40 text-foreground'
                          : 'bg-card border-border/40 text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedBranchIdsForHoliday(prev => [...prev, b.id])
                            } else {
                              setSelectedBranchIdsForHoliday(prev => prev.filter(id => id !== b.id))
                            }
                          }}
                          className="rounded accent-[#23ace3] h-4 w-4 cursor-pointer"
                        />
                        <span className="font-semibold text-foreground">{b.name}</span>
                        <span className="text-[11px] text-muted-foreground">({b.city})</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] py-0">
                        {b.code}
                      </Badge>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {holidayScope === 'single' && (
            <div>
              <label className="font-semibold block mb-1 text-foreground">
                Branch Location <span className="text-destructive">*</span>
              </label>
              <Select
                value={targetBranchForHoliday?.id || ''}
                onChange={e => {
                  const found = branches.find(b => b.id === e.target.value)
                  if (found) setTargetBranchForHoliday(found)
                }}
                className="text-xs rounded-xl"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city}) - {b.code}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <label className="font-semibold block mb-1 text-foreground">
              Holiday Name <span className="text-destructive">*</span>
            </label>
            <Input
              value={newHolidayName}
              onChange={e => setNewHolidayName(e.target.value)}
              placeholder="E.g., Sinhala & Tamil New Year / Poson Poya"
              className="text-xs rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-foreground">
                Holiday Date <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={newHolidayDate}
                onChange={e => setNewHolidayDate(e.target.value)}
                className="text-xs rounded-xl"
                required
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-foreground">
                Holiday Category
              </label>
              <Select
                value={newHolidayType}
                onChange={e => setNewHolidayType(e.target.value)}
                className="text-xs rounded-xl"
              >
                <option value="Regional Holiday">Regional Festival</option>
                <option value="Provincial Holiday">Provincial Holiday</option>
                <option value="Local Bank Holiday">Local Bank Holiday</option>
                <option value="Company Site Holiday">Company Site Holiday</option>
                <option value="Public Holiday">Public Holiday</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1 text-foreground">
              Observance Notes (Optional)
            </label>
            <Input
              value={newHolidayNotes}
              onChange={e => setNewHolidayNotes(e.target.value)}
              placeholder="E.g., Site closed; on-call support schedule active."
              className="text-xs rounded-xl"
            />
          </div>

          <DialogFooter className="flex items-center justify-between pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsHolidayModalOpen(false)}
              className="text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={
                addHolidayMutation.isPending ||
                !newHolidayName ||
                !newHolidayDate ||
                (holidayScope === 'selected' && selectedBranchIdsForHoliday.length === 0) ||
                (holidayScope === 'single' && !targetBranchForHoliday)
              }
              className="bg-[#23ace3] hover:bg-[#1f98c9] text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              {addHolidayMutation.isPending
                ? 'Saving...'
                : holidayScope === 'all'
                ? `Apply to All (${branches.length}) Branches`
                : holidayScope === 'selected'
                ? `Apply to ${selectedBranchIdsForHoliday.length} Branches`
                : 'Add Branch Holiday'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: DELETE CONFIRMATION                                                */}
      {/* ========================================================================= */}
      <Dialog open={!!deleteConfirmId} onOpenChange={open => !open && setDeleteConfirmId(null)}>
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-destructive">
            Delete Branch Location?
          </DialogTitle>
          <DialogDescription className="text-xs">
            Are you sure you want to remove this branch? Any assigned staff will remain in the workforce directory.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex items-center justify-between pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDeleteConfirmId(null)}
            className="text-xs rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => deleteConfirmId && deleteBranchMutation.mutate(deleteConfirmId)}
            className="bg-destructive hover:bg-destructive/90 text-white text-xs font-semibold rounded-xl"
          >
            Confirm Delete
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
