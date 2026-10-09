import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { employeeService } from '@/services/employeeService'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  ArrowLeft,
  ShieldCheck,
  Users,
  MapPin,
  Sparkles,
  CheckCircle2,
  Layers,
  FileText,
} from 'lucide-react'

export const AdminCreateWorkspace: React.FC = () => {
  const navigate = useNavigate()
  const { tenant, user } = useAuth()
  const queryClient = useQueryClient()

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', tenant?.id],
    queryFn: () => employeeService.getEmployees(tenant!.id),
    enabled: !!tenant,
  })

  // Form state
  const [deptName, setDeptName] = useState('')
  const [deptCode, setDeptCode] = useState('')
  const [deptHead, setDeptHead] = useState(user?.name || '')
  const [staffingSla, setStaffingSla] = useState('75% min staffing')
  const [location, setLocation] = useState('Colombo Head Office')
  const [description, setDescription] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!deptName.trim()) {
        throw new Error('Please enter a valid Department / Division Name.')
      }
      return employeeService.createDepartment({
        name: deptName.trim(),
        head: deptHead.trim() || 'Unassigned Lead',
        threshold: staffingSla,
        description: description.trim() || `Operational workspace division under ${location}.`,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDepartments'] })
      setSuccessMessage(`Workspace "${deptName}" created successfully! Redirecting...`)
      setTimeout(() => {
        navigate('/admin/workforce')
      }, 1200)
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to create workspace. Please try again.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    createMutation.mutate()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans">
      {/* Back Button & Page Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/admin/workforce')}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 text-[#23ace3]" />
          <span>Back to Workforce & Departments</span>
        </button>

        <PageHeader
          title="Provision New Department Workspace"
          subtitle={`Establish a new organizational division, branch workspace, or department team under ${tenant?.name || 'Sampath Bank PLC'}.`}
          badge={
            <Badge variant="outline" className="text-xs bg-[#23ace3]/10 border-[#23ace3]/30 text-[#23ace3]">
              Multi-Tenant Partition: {tenant?.code || 'SAMPATH'}
            </Badge>
          }
        />
      </div>

      {/* Main Form Shell */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border border-border/70 bg-card rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Header Section Banner */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-[#23ace3]/10 via-background to-transparent border border-[#23ace3]/20">
              <div className="p-3 rounded-xl bg-[#23ace3] text-white shadow-xs">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Department Division Configuration</h3>
                <p className="text-xs text-muted-foreground">
                  Define workspace parameters, operational staffing SLAs, and team leadership.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Field Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Department Name */}
              <div className="space-y-2">
                <label className="block font-bold text-foreground tracking-wide">
                  Department / Workspace Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={deptName}
                  onChange={e => setDeptName(e.target.value)}
                  placeholder="E.g., Digital Banking & AI Division"
                  className="h-10 rounded-xl bg-background text-xs border-border/80 focus:border-[#23ace3]"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  This workspace name will appear across employee rosters and approval workflows.
                </p>
              </div>

              {/* Division Code */}
              <div className="space-y-2">
                <label className="block font-bold text-foreground tracking-wide">
                  Division Code / Cost Center
                </label>
                <Input
                  value={deptCode}
                  onChange={e => setDeptCode(e.target.value)}
                  placeholder="E.g., DIV-AI-04 or CC-8801"
                  className="h-10 rounded-xl bg-background text-xs font-mono border-border/80 focus:border-[#23ace3]"
                />
                <p className="text-[11px] text-muted-foreground">
                  Unique internal code used for ERP integration and payroll ledger allocation.
                </p>
              </div>

              {/* Designated Department Lead */}
              <div className="space-y-2">
                <label className="block font-bold text-foreground tracking-wide">
                  Designated Department Lead / Manager
                </label>
                <Select
                  value={deptHead}
                  onChange={e => setDeptHead(e.target.value)}
                  className="h-10 rounded-xl bg-background text-xs border-border/80 focus:border-[#23ace3]"
                >
                  <option value="">-- Select Manager as Department Lead --</option>
                  {deptHead && !employees.filter(e => e.role?.toLowerCase() === 'manager').some(m => m.name === deptHead) && (
                    <option value={deptHead}>{deptHead} (Selected Lead)</option>
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
                  Manager responsible for approving leave requests and team staffing SLAs.
                </p>
              </div>

              {/* Staffing Threshold SLA */}
              <div className="space-y-2">
                <label className="block font-bold text-foreground tracking-wide">
                  Minimum Operational Staffing SLA Quota
                </label>
                <Select
                  value={staffingSla}
                  onChange={e => setStaffingSla(e.target.value)}
                  className="h-10 rounded-xl bg-background text-xs border-border/80"
                >
                  <option value="60% min staffing">60% Minimum Staffing SLA</option>
                  <option value="70% min staffing">70% Minimum Staffing SLA</option>
                  <option value="75% min staffing">75% Minimum Staffing SLA (Standard)</option>
                  <option value="80% min staffing">80% Minimum Staffing SLA</option>
                  <option value="85% min staffing">85% High Availability SLA</option>
                  <option value="90% min staffing">90% Mission Critical SLA</option>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Automatic AI conflict alerts trigger if team absences drop below this percentage.
                </p>
              </div>

              {/* Location Assignment */}
              <div className="space-y-2 md:col-span-2">
                <label className="block font-bold text-foreground tracking-wide">
                  Primary Operating Location / Branch
                </label>
                <Select
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="h-10 rounded-xl bg-background text-xs border-border/80"
                >
                  <option value="Colombo Head Office">Colombo Head Office (BOC Tower)</option>
                  <option value="Kandy Regional Hub">Kandy Regional Hub</option>
                  <option value="Galle Digital Center">Galle Digital Center</option>
                  <option value="Jaffna Operations Unit">Jaffna Operations Unit</option>
                  <option value="Global Remote Division">Global Remote Division</option>
                </Select>
              </div>

              {/* Operational Scope & Description */}
              <div className="space-y-2 md:col-span-2">
                <label className="block font-bold text-foreground tracking-wide">
                  Operational Scope & Workspace Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe the department's core responsibilities, team function, and operational scope..."
                  className="w-full text-xs p-3.5 rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#23ace3] focus:ring-1 focus:ring-[#23ace3] transition-all"
                />
                <p className="text-[11px] text-muted-foreground">
                  This description is indexed by Kinetic AI Assistant to answer employee policy and organizational scope inquiries.
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="p-4 bg-muted/40 border-t border-border/60 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/workforce')}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending || !deptName.trim()}
              className="bg-[#23ace3] hover:bg-[#1b97ca] text-white text-xs font-semibold px-6 h-10 rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>{createMutation.isPending ? 'Provisioning Workspace...' : 'Create Workspace Division'}</span>
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
