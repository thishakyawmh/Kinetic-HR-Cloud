import React, { useState } from 'react'
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
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Search, UserPlus, Edit2, UserX, CheckCircle, ShieldCheck } from 'lucide-react'

export const AdminEmployees: React.FC = () => {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDept, setSelectedDept] = useState('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // New Employee Form State
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('employee')
  const [newDept, setNewDept] = useState('Engineering')
  const [newTitle, setNewTitle] = useState('')

  const { data: employees = [], refetch } = useQuery({
    queryKey: ['adminEmployees', tenant?.id, selectedDept],
    queryFn: () => (tenant?.id ? employeeService.getEmployees(tenant.id, selectedDept) : []),
    enabled: !!tenant?.id,
  })

  const addMutation = useMutation({
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
      refetch()
      setIsAddModalOpen(false)
      setNewName('')
      setNewEmail('')
      setNewTitle('')
    },
  })

  const filteredEmployees = employees.filter(e => {
    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase()
    return (
      e.name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.jobTitle.toLowerCase().includes(q) ||
      e.employeeNumber.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Directory & Roster"
        subtitle={`Tenant Employee Records (${employees.length} personnel) • Managed by HR Operations`}
        badge={
          <Badge variant="outline" className="text-xs bg-[#23ace3]/10 border-[#23ace3]/30 text-[#23ace3]">
            {tenant?.plan || 'Business'} Plan: {employees.length} / 100 Seats
          </Badge>
        }
      >
        <Button
          variant="default"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="gap-1.5 text-xs bg-[#23ace3] hover:bg-[#1b97ca] text-white rounded-xl shadow-xs"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Add Employee</span>
        </Button>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees by name, title, or employee number..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="h-10 rounded-xl"
          >
            <option value="all">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Design">Design</option>
            <option value="Product">Product</option>
            <option value="Operations">Operations</option>
          </Select>
        </div>
      </div>

      {/* Employees Table (Section 24) */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/50">
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map(emp => (
              <TableRow key={emp.id} className="border-border/40 hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#23ace3]/15 font-bold text-xs text-[#23ace3]">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-foreground">{emp.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{emp.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-foreground">
                  <div className="font-medium">{emp.department}</div>
                  <div className="text-[11px] text-muted-foreground">{emp.jobTitle}</div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={emp.role === 'admin' ? 'destructive' : emp.role === 'manager' ? 'info' : 'outline'}
                    className="text-[10px] capitalize"
                  >
                    {emp.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="success" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    Active
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{emp.hireDate}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingUser(emp)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Employee Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Enrolls the employee into {tenant?.name} with automated Microsoft Entra ID claim provisioning.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div>
            <label className="font-semibold block mb-1">Full Name</label>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="E.g., Jane Cooper"
            />
          </div>
          <div>
            <label className="font-semibold block mb-1">Work Email</label>
            <Input
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="jane.cooper@kinetictech.io"
            />
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
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Design">Design</option>
                <option value="Product">Product</option>
                <option value="Operations">Operations</option>
              </Select>
            </div>
          </div>
          <div>
            <label className="font-semibold block mb-1">Job Title</label>
            <Input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="E.g., Senior Systems Architect"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => addMutation.mutate()}
            disabled={!newName || !newEmail || addMutation.isPending}
            className="bg-sky-600 text-white"
          >
            {addMutation.isPending ? 'Provisioning...' : 'Provision Employee'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Edit Role / Department Modal */}
      <Dialog open={editingUser !== null} onOpenChange={open => !open && setEditingUser(null)}>
        {editingUser && (
          <>
            <DialogHeader>
              <DialogTitle>Edit Employee: {editingUser.name}</DialogTitle>
              <DialogDescription>
                Update department assignments and system permissions.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div>
                <label className="font-semibold block mb-1">Role Assignment</label>
                <Select
                  value={editingUser.role}
                  onChange={e =>
                    setEditingUser({ ...editingUser, role: e.target.value as UserRole })
                  }
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
                  onChange={e =>
                    setEditingUser({ ...editingUser, department: e.target.value })
                  }
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Design">Design</option>
                  <option value="Product">Product</option>
                  <option value="Operations">Operations</option>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setEditingUser(null)}>
                Close
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={async () => {
                  await employeeService.updateEmployee(editingUser.id, {
                    role: editingUser.role,
                    department: editingUser.department,
                  })
                  refetch()
                  setEditingUser(null)
                }}
                className="bg-sky-600 text-white"
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
