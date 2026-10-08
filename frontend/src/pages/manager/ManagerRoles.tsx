import React, { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { roleService } from '@/services/roleService'
import { employeeService } from '@/services/employeeService'
import { WorkspaceRole } from '@/types'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  Briefcase,
  Plus,
  Search,
  Edit2,
  Trash2,
  DollarSign,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

export const ManagerRoles: React.FC = () => {
  const { user, tenant } = useAuth()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<WorkspaceRole | null>(null)
  const [deleteConfirmRole, setDeleteConfirmRole] = useState<WorkspaceRole | null>(null)

  // Form states
  const [formName, setFormName] = useState('')
  const [formSalary, setFormSalary] = useState<number>(120000)
  const [formCurrency, setFormCurrency] = useState('USD')
  const [formPeriod, setFormPeriod] = useState<'annual' | 'monthly' | 'hourly'>('annual')
  const [formOvertimeMultiplier, setFormOvertimeMultiplier] = useState<number>(1.5)
  const [formDescription, setFormDescription] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const deptName = user?.department || 'Engineering'

  // Fetch roles
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['workspaceRoles', deptName],
    queryFn: () => roleService.getRoles(deptName),
  })

  // Fetch employees to count assignments
  const { data: employees = [] } = useQuery({
    queryKey: ['employees', tenant?.id],
    queryFn: () => (tenant?.id ? employeeService.getEmployees(tenant.id) : []),
    enabled: !!tenant?.id,
  })

  // Mutation: Save Role (Create or Update)
  const saveRoleMutation = useMutation({
    mutationFn: async () => {
      if (!formName.trim()) {
        throw new Error('Please enter a valid Role Name.')
      }
      if (formSalary <= 0) {
        throw new Error('Base salary must be greater than 0.')
      }
      if (formOvertimeMultiplier < 1.0) {
        throw new Error('Overtime multiplier must be at least 1.0x.')
      }

      if (editingRole) {
        return roleService.updateRole(editingRole.id, {
          name: formName.trim(),
          baseSalary: Number(formSalary),
          currency: formCurrency,
          salaryPeriod: formPeriod,
          overtimeMultiplier: Number(formOvertimeMultiplier),
          description: formDescription.trim(),
          department: deptName,
        })
      } else {
        return roleService.createRole({
          name: formName.trim(),
          baseSalary: Number(formSalary),
          currency: formCurrency,
          salaryPeriod: formPeriod,
          overtimeMultiplier: Number(formOvertimeMultiplier),
          description: formDescription.trim(),
          department: deptName,
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaceRoles'] })
      setSuccessMsg(editingRole ? 'Role updated successfully!' : 'New role created successfully!')
      setTimeout(() => {
        setIsModalOpen(false)
        setEditingRole(null)
        setSuccessMsg(null)
      }, 700)
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to save role.')
    },
  })

  // Mutation: Delete Role
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      return roleService.deleteRole(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaceRoles'] })
      setDeleteConfirmRole(null)
    },
  })

  const openCreateModal = () => {
    setEditingRole(null)
    setFormName('')
    setFormSalary(120000)
    setFormCurrency('USD')
    setFormPeriod('annual')
    setFormOvertimeMultiplier(1.5)
    setFormDescription('')
    setFormError(null)
    setSuccessMsg(null)
    setIsModalOpen(true)
  }

  const openEditModal = (role: WorkspaceRole) => {
    setEditingRole(role)
    setFormName(role.name)
    setFormSalary(role.baseSalary)
    setFormCurrency(role.currency || 'USD')
    setFormPeriod(role.salaryPeriod || 'annual')
    setFormOvertimeMultiplier(role.overtimeMultiplier || 1.5)
    setFormDescription(role.description || '')
    setFormError(null)
    setSuccessMsg(null)
    setIsModalOpen(true)
  }

  // Filter roles by search
  const filteredRoles = useMemo(() => {
    return roles.filter(r => {
      const q = searchQuery.trim().toLowerCase()
      if (!q) return true
      return (
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
      )
    })
  }, [roles, searchQuery])

  // Count assigned employees per role
  const getAssignedCount = (roleName: string) => {
    return employees.filter(
      e =>
        e.department &&
        e.department.toLowerCase() === deptName.toLowerCase() &&
        e.jobTitle.toLowerCase() === roleName.toLowerCase()
    ).length
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans animate-in fade-in">
      {/* Page Header */}
      <PageHeader
        title="Roles & Compensation"
        subtitle={`Define job roles, base salary scales, and overtime multipliers for ${deptName}`}
      >
        <Button
          variant="default"
          size="sm"
          onClick={openCreateModal}
          className="bg-[#23ace3] hover:bg-[#1b97ca] text-white text-xs font-bold px-4 h-9 rounded-xl shadow-xs gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Role</span>
        </Button>
      </PageHeader>

      {/* Search Toolbar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search roles by title or description..."
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

      {/* Roles Tabular Directory */}
      {isLoadingRoles ? (
        <div className="p-12 text-center text-muted-foreground text-xs">
          Loading workspace roles...
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-dashed border-border/70 text-xs space-y-3">
          <Briefcase className="h-8 w-8 text-muted-foreground/60 mx-auto" />
          <div className="font-bold text-foreground">No roles found</div>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? `No roles match "${searchQuery}".`
              : 'Start by configuring job titles, base salaries, and overtime multipliers for your workspace.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={openCreateModal}
            className="text-xs rounded-xl"
          >
            Create First Role
          </Button>
        </div>
      ) : (
        <Card className="rounded-2xl border-border/70 bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="text-xs font-bold text-foreground">Role Title</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Base Salary</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Overtime Multiplier</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Assigned Staff</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Description</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map(role => {
                const assignedCount = getAssignedCount(role.name)
                return (
                  <TableRow key={role.id} className="border-border/60 hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30 shrink-0">
                          <Briefcase className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-foreground block">
                            {role.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {role.department || deptName}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 font-mono font-bold text-xs text-foreground">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>
                          {role.baseSalary.toLocaleString()} {role.currency}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          /{role.salaryPeriod === 'annual' ? 'yr' : role.salaryPeriod === 'monthly' ? 'mo' : 'hr'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-xs font-bold px-2.5 py-0.5 bg-[#23ace3]/10 text-[#23ace3] border-[#23ace3]/40"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {role.overtimeMultiplier}x
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-bold text-foreground">{assignedCount}</span>
                        <span className="text-muted-foreground text-[11px]">members</span>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-xs">
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {role.description || 'Standard workspace responsibilities.'}
                      </p>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(role)}
                          className="h-8 text-xs rounded-xl gap-1 border-border/80 hover:border-[#23ace3] hover:text-[#23ace3] cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmRole(role)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-xl cursor-pointer"
                          title="Delete role"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
      {/* MODAL: ADD / EDIT ROLE                                                    */}
      {/* ========================================================================= */}
      <Dialog open={isModalOpen} onOpenChange={open => !open && setIsModalOpen(false)}>
        {isModalOpen && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    {editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Workspace Role'}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Configure role name, base compensation, and overtime multipliers.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3.5 py-2 text-xs">
              {/* Role Title */}
              <div>
                <label className="font-semibold block mb-1 text-foreground">Role Title / Designation</label>
                <Input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="E.g., Senior Frontend Engineer, DevOps Lead"
                  className="h-9 text-xs bg-background rounded-xl"
                  autoFocus
                />
              </div>

              {/* Base Salary & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1 text-foreground">Base Salary Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="number"
                      value={formSalary}
                      onChange={e => setFormSalary(Number(e.target.value))}
                      placeholder="120000"
                      className="pl-8 h-9 text-xs bg-background rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-foreground">Frequency</label>
                  <Select
                    value={formPeriod}
                    onChange={e => setFormPeriod(e.target.value as any)}
                    className="h-9 text-xs bg-background rounded-xl"
                  >
                    <option value="annual">Per Year</option>
                    <option value="monthly">Per Month</option>
                    <option value="hourly">Per Hour</option>
                  </Select>
                </div>
              </div>

              {/* Overtime Multiplier */}
              <div>
                <label className="font-semibold block mb-1 text-foreground">
                  Overtime Multiplier Rate
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1.25, 1.5, 1.75, 2.0].map(multiplier => (
                    <button
                      key={multiplier}
                      type="button"
                      onClick={() => setFormOvertimeMultiplier(multiplier)}
                      className={`py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        formOvertimeMultiplier === multiplier
                          ? 'border-[#23ace3] bg-[#23ace3]/15 text-[#23ace3] ring-1 ring-[#23ace3]'
                          : 'border-border/70 bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {multiplier}x Rate
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">Custom Multiplier:</span>
                  <Input
                    type="number"
                    step="0.05"
                    min="1.0"
                    max="5.0"
                    value={formOvertimeMultiplier}
                    onChange={e => setFormOvertimeMultiplier(Number(e.target.value))}
                    className="w-24 h-7 text-xs bg-background rounded-lg font-mono"
                  />
                  <span className="text-[11px] text-muted-foreground">x standard hourly</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold block mb-1 text-foreground">Role Responsibilities</label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Key scope of work, technical requirements, or deliverables..."
                  className="w-full text-xs p-2.5 rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:border-[#23ace3] resize-none"
                />
              </div>

              {/* Error & Success Feedback */}
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between pt-2 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => saveRoleMutation.mutate()}
                disabled={saveRoleMutation.isPending}
                className="bg-[#23ace3] hover:bg-[#1b97ca] text-white font-bold text-xs px-4 h-9 rounded-xl shadow-xs cursor-pointer"
              >
                {saveRoleMutation.isPending ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: DELETE ROLE CONFIRMATION                                           */}
      {/* ========================================================================= */}
      <Dialog open={deleteConfirmRole !== null} onOpenChange={open => !open && setDeleteConfirmRole(null)}>
        {deleteConfirmRole && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 text-rose-400">
                <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Delete Role: {deleteConfirmRole.name}?
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    This action cannot be undone. Any employees assigned to this role will remain with their title.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="py-2 text-xs space-y-2">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
                <div>Base Salary: <strong className="text-foreground">${deleteConfirmRole.baseSalary.toLocaleString()}</strong></div>
                <div>Overtime Multiplier: <strong className="text-foreground">{deleteConfirmRole.overtimeMultiplier}x</strong></div>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between pt-2 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmRole(null)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteRoleMutation.mutate(deleteConfirmRole.id)}
                disabled={deleteRoleMutation.isPending}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 h-9 rounded-xl cursor-pointer"
              >
                {deleteRoleMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  )
}
