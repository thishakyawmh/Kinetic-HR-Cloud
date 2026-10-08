import React, { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeService } from '@/services/employeeService'
import { roleService } from '@/services/roleService'
import { User, WorkspaceRole } from '@/types'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Search,
  Eye,
  ShieldCheck,
  Heart,
  Briefcase,
  DollarSign,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

interface MemberDependent {
  name: string
  relation: string
  contact?: string
  covered?: boolean
}

// Helper for dependent/emergency info
const getMemberDependents = (emp: User): MemberDependent[] => {
  const dependentDirectory: Record<string, MemberDependent[]> = {
    'user-david': [{ name: 'Clara Wilson', relation: 'Spouse', contact: '+1 (555) 443-8999', covered: true }],
    'user-sarah': [{ name: 'Lucas Miller', relation: 'Child (Son)', contact: '+1 (555) 789-0199', covered: true }],
    'user-carlos': [{ name: 'Maria Mendoza', relation: 'Spouse', contact: '+1 (555) 234-9988', covered: true }],
    'user-claire': [{ name: 'Frank Underwood', relation: 'Spouse', contact: '+1 (555) 678-1122', covered: true }],
  }

  if (dependentDirectory[emp.id]) {
    return dependentDirectory[emp.id]
  }

  if ((emp as any).dependents && Array.isArray((emp as any).dependents)) {
    return (emp as any).dependents
  }

  if (emp.name.length % 2 === 0) {
    return [
      { name: `${emp.name.split(' ')[0]}'s Spouse`, relation: 'Spouse', contact: '+1 (555) 345-6789', covered: true },
    ]
  }

  return []
}

export const ManagerWorkforce: React.FC = () => {
  const { user, tenant } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] = useState<User | null>(null)

  const handleAskAI = (emp: User) => {
    navigate(
      `/manager/assistant?prompt=${encodeURIComponent(
        `Provide a detailed overview for ${emp.name} (${emp.jobTitle}) including compensation breakdown, attendance history, and department role allocations.`
      )}`
    )
  }

  // Set Role Modal state
  const [memberToSetRole, setMemberToSetRole] = useState<User | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [setRoleSuccessMsg, setSetRoleSuccessMsg] = useState<string | null>(null)

  // Fetch all employees in tenant
  const { data: allEmployees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees', tenant?.id],
    queryFn: () => (tenant?.id ? employeeService.getEmployees(tenant.id) : []),
    enabled: !!tenant?.id,
  })

  // Fetch departments to determine workspace details
  const { data: departments = [] } = useQuery({
    queryKey: ['departments', tenant?.id],
    queryFn: () => employeeService.getDepartments(tenant?.id),
    enabled: !!tenant?.id,
  })

  // Determine current manager's department workspace
  const currentDept = useMemo(() => {
    if (!departments.length) return null
    return (
      departments.find(
        d =>
          (user?.department && d.name.toLowerCase() === user.department.toLowerCase()) ||
          (user?.name && d.head?.toLowerCase() === user.name.toLowerCase())
      ) ||
      departments.find(d => d.name.toLowerCase() === 'engineering') ||
      departments[0]
    )
  }, [departments, user])

  const deptWorkspaceName = currentDept?.name || user?.department || 'Engineering'

  // Fetch defined workspace roles
  const { data: roles = [] } = useQuery({
    queryKey: ['workspaceRoles', deptWorkspaceName],
    queryFn: () => roleService.getRoles(deptWorkspaceName),
  })

  // Exclude lead account since the logged in account belongs to the lead
  const leadName = (currentDept?.head || user?.name || '').toLowerCase()
  const leadId = user?.id || ''
  const leadEmail = (user?.email || '').toLowerCase()

  // Filter staff members assigned by HR Admin for this particular workspace only
  const workspaceStaff = useMemo(() => {
    return allEmployees.filter(emp => {
      const inDept = emp.department && emp.department.toLowerCase() === deptWorkspaceName.toLowerCase()
      if (!inDept) return false

      // Filter out lead accounts
      const isLead =
        emp.id === leadId ||
        (leadEmail && emp.email.toLowerCase() === leadEmail) ||
        (leadName && emp.name.toLowerCase().includes(leadName))
      return !isLead
    })
  }, [allEmployees, deptWorkspaceName, leadName, leadId, leadEmail])

  // Filter staff based on search query
  const filteredStaff = useMemo(() => {
    return workspaceStaff.filter(emp => {
      const query = searchQuery.trim().toLowerCase()
      if (!query) return true
      return (
        emp.name.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        (emp.employeeNumber && emp.employeeNumber.toLowerCase().includes(query)) ||
        (emp.jobTitle && emp.jobTitle.toLowerCase().includes(query)) ||
        (emp.id && emp.id.toLowerCase().includes(query))
      )
    })
  }, [workspaceStaff, searchQuery])

  // Helper to find matching role configuration for an employee
  const getRoleForEmployee = (emp: User): WorkspaceRole | undefined => {
    return roles.find(r => r.name.toLowerCase() === emp.jobTitle.toLowerCase())
  }

  // Mutation: Assign Role to Member
  const assignRoleMutation = useMutation({
    mutationFn: async () => {
      if (!memberToSetRole || !selectedRoleId) return
      const chosenRole = roles.find(r => r.id === selectedRoleId)
      if (!chosenRole) return

      await employeeService.updateEmployee(memberToSetRole.id, {
        jobTitle: chosenRole.name,
      })
      return chosenRole
    },
    onSuccess: (chosenRole) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['workspaceRoles'] })
      if (selectedMember && memberToSetRole && selectedMember.id === memberToSetRole.id) {
        setSelectedMember({
          ...selectedMember,
          jobTitle: chosenRole?.name || selectedMember.jobTitle,
        })
      }
      setSetRoleSuccessMsg(`Role set to "${chosenRole?.name}" successfully!`)
      setTimeout(() => {
        setMemberToSetRole(null)
        setSelectedRoleId('')
        setSetRoleSuccessMsg(null)
      }, 700)
    },
  })

  const openSetRoleModal = (emp: User) => {
    setMemberToSetRole(emp)
    const currentRole = getRoleForEmployee(emp)
    setSelectedRoleId(currentRole?.id || roles[0]?.id || '')
    setSetRoleSuccessMsg(null)
  }

  const selectedRolePreview = roles.find(r => r.id === selectedRoleId)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans animate-in fade-in">
      {/* Page Header */}
      <PageHeader
        title="Workforce Management"
        subtitle={`Staff members assigned to ${deptWorkspaceName} Workspace`}
      />

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search staff by Employee ID, Name, Email, or Designation..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 pr-9 h-10 text-xs bg-card rounded-xl border-border/80 shadow-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground text-xs cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabular Format Directory */}
      {isLoadingEmployees ? (
        <div className="p-12 text-center text-muted-foreground text-xs">
          Loading assigned workspace personnel...
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-dashed border-border/70 text-xs space-y-2">
          <Users className="h-8 w-8 text-muted-foreground/60 mx-auto" />
          <div className="font-bold text-foreground">No staff members found</div>
          <div className="text-muted-foreground">
            {searchQuery
              ? `No personnel match "${searchQuery}".`
              : `No staff members are currently assigned to this workspace.`}
          </div>
        </div>
      ) : (
        <Card className="rounded-2xl border-border/70 bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="text-xs font-bold text-foreground">Employee</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Employee ID</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Role / Designation</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map(emp => {
                const matchedRole = getRoleForEmployee(emp)
                return (
                  <TableRow key={emp.id} className="border-border/60 hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#23ace3]/15 text-[#23ace3] font-bold text-xs shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-foreground truncate">
                            {emp.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono truncate">
                            {emp.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {emp.employeeNumber || emp.id}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                          <span>{emp.jobTitle}</span>
                        </div>
                        {matchedRole && (
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                            <span className="text-emerald-500 font-bold">
                              ${matchedRole.baseSalary.toLocaleString()}/{matchedRole.salaryPeriod === 'annual' ? 'yr' : 'mo'}
                            </span>
                            <span>•</span>
                            <span className="text-[#23ace3] font-bold">
                              {matchedRole.overtimeMultiplier}x OT
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAskAI(emp)}
                          className="h-7 text-xs rounded-lg gap-1 border-[#23ace3]/40 text-[#23ace3] hover:bg-[#23ace3]/15 hover:border-[#23ace3] cursor-pointer"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>Ask AI</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSetRoleModal(emp)}
                          className="h-7 text-xs rounded-lg gap-1 border-border/80 hover:border-[#23ace3] hover:text-[#23ace3] cursor-pointer"
                        >
                          <Briefcase className="h-3 w-3" />
                          <span>Set Role</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMember(emp)}
                          className="h-7 text-xs rounded-lg gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Details</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SET ROLE FOR MEMBER                                                */}
      {/* ========================================================================= */}
      <Dialog open={memberToSetRole !== null} onOpenChange={open => !open && setMemberToSetRole(null)}>
        {memberToSetRole && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Set Role for {memberToSetRole.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Assign a workspace role with defined base salary and overtime rate.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3.5 py-2 text-xs">
              {/* Member Summary */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground">{memberToSetRole.name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">{memberToSetRole.email}</div>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {memberToSetRole.employeeNumber || memberToSetRole.id}
                </Badge>
              </div>

              {/* Role Selector */}
              <div>
                <label className="font-semibold block mb-1 text-foreground">Select Workspace Role</label>
                <Select
                  value={selectedRoleId}
                  onChange={e => setSelectedRoleId(e.target.value)}
                  className="h-9 text-xs bg-background rounded-xl"
                >
                  <option value="">-- Choose a Role --</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} — ${r.baseSalary.toLocaleString()}/{r.salaryPeriod === 'annual' ? 'yr' : 'mo'} ({r.overtimeMultiplier}x OT)
                    </option>
                  ))}
                </Select>
              </div>

              {/* Selected Role Compensation Preview */}
              {selectedRolePreview && (
                <div className="p-3.5 rounded-xl bg-card border border-[#23ace3]/40 shadow-xs space-y-2 animate-in fade-in">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Role Compensation & Terms
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-muted/40 space-y-0.5">
                      <div className="text-[10px] text-muted-foreground">Base Salary</div>
                      <div className="font-mono font-bold text-emerald-500 flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>${selectedRolePreview.baseSalary.toLocaleString()} {selectedRolePreview.currency}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">per {selectedRolePreview.salaryPeriod}</div>
                    </div>

                    <div className="p-2 rounded-lg bg-muted/40 space-y-0.5">
                      <div className="text-[10px] text-muted-foreground">Overtime Multiplier</div>
                      <div className="font-mono font-bold text-[#23ace3] flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{selectedRolePreview.overtimeMultiplier}x Standard Rate</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">applicable for approved overtime</div>
                    </div>
                  </div>

                  {selectedRolePreview.description && (
                    <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                      {selectedRolePreview.description}
                    </p>
                  )}
                </div>
              )}

              {/* Feedback Message */}
              {setRoleSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{setRoleSuccessMsg}</span>
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between pt-2 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMemberToSetRole(null)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => assignRoleMutation.mutate()}
                disabled={!selectedRoleId || assignRoleMutation.isPending}
                className="bg-[#23ace3] hover:bg-[#1b97ca] text-white font-bold text-xs px-4 h-9 rounded-xl shadow-xs cursor-pointer"
              >
                {assignRoleMutation.isPending ? 'Updating...' : 'Assign Role'}
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: STAFF MEMBER PROFILE DETAILS                                       */}
      {/* ========================================================================= */}
      <Dialog open={selectedMember !== null} onOpenChange={open => !open && setSelectedMember(null)}>
        {selectedMember && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#23ace3]/15 text-[#23ace3] font-bold text-sm border border-[#23ace3]/30">
                    {selectedMember.name.charAt(0)}
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                      <span>{selectedMember.name}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {selectedMember.employeeNumber || selectedMember.id}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      {selectedMember.jobTitle} • {deptWorkspaceName} Workspace
                    </DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* HR Assignment Badge Banner */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#23ace3]" />
                  <span className="font-semibold text-foreground">Workspace Member</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const emp = selectedMember
                      setSelectedMember(null)
                      openSetRoleModal(emp)
                    }}
                    className="h-7 text-xs rounded-lg gap-1 border-border/80 hover:border-[#23ace3] hover:text-[#23ace3] cursor-pointer"
                  >
                    <Briefcase className="h-3 w-3" />
                    <span>Change Role</span>
                  </Button>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    Active
                  </Badge>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-card border border-border/60 space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                    Official Email
                  </div>
                  <div className="font-mono text-xs text-foreground truncate">{selectedMember.email}</div>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border/60 space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                    Phone / Extension
                  </div>
                  <div className="font-mono text-xs text-foreground">
                    {selectedMember.phone || '+1 (555) 019-2831'}
                  </div>
                </div>

                {/* Role Compensation Information */}
                {(() => {
                  const role = getRoleForEmployee(selectedMember)
                  return (
                    <>
                      <div className="p-3 rounded-xl bg-card border border-border/60 space-y-1">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                          Base Salary Scale
                        </div>
                        <div className="text-xs font-bold text-emerald-500 font-mono">
                          {role
                            ? `$${role.baseSalary.toLocaleString()} ${role.currency} / ${role.salaryPeriod}`
                            : 'Standard Band'}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-card border border-border/60 space-y-1">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                          Overtime Multiplier
                        </div>
                        <div className="text-xs font-bold text-[#23ace3] font-mono">
                          {role ? `${role.overtimeMultiplier}x Standard Rate` : '1.5x'}
                        </div>
                      </div>
                    </>
                  )
                })()}

                <div className="p-3 rounded-xl bg-card border border-border/60 space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                    Work Location
                  </div>
                  <div className="text-xs text-foreground">
                    {selectedMember.location || 'Seattle, WA (Office)'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border/60 space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                    Hire Date / Tenure
                  </div>
                  <div className="font-mono text-xs text-foreground">
                    {selectedMember.hireDate || '2023-04-15'}
                  </div>
                </div>
              </div>

              {/* Dependents & Emergency Contact */}
              {(() => {
                const dependents = getMemberDependents(selectedMember)
                if (dependents.length === 0) return null

                return (
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5 text-rose-400" />
                      <span>Family & Emergency Contacts</span>
                    </div>
                    <div className="space-y-1.5">
                      {dependents.map((dep, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-muted/20 border border-border/50 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-foreground">{dep.name}</span>
                            <span className="text-muted-foreground text-[11px] ml-1.5">({dep.relation})</span>
                          </div>
                          {dep.contact && (
                            <span className="font-mono text-[11px] text-muted-foreground">{dep.contact}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>

            <DialogFooter className="flex items-center justify-end pt-2 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMember(null)}
                className="text-xs rounded-xl"
              >
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  )
}
