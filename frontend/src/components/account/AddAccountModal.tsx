import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types'
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  User,
  UserCheck,
  ShieldAlert,
  Building,
  Briefcase,
  Mail,
  Sparkles,
  Plus,
  CheckCircle2,
} from 'lucide-react'

interface AddAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose }) => {
  const { addAccount } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('employee')
  const [department, setDepartment] = useState('Engineering')
  const [jobTitle, setJobTitle] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter a full name')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid work email')
      return
    }

    setError('')
    try {
      const createdUser = addAccount({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        department,
        jobTitle: jobTitle.trim() || undefined,
      })

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        // Reset form
        setName('')
        setEmail('')
        setRole('employee')
        setDepartment('Engineering')
        setJobTitle('')

        // Navigate to appropriate workspace
        if (createdUser.role === 'employee') {
          navigate('/employee/dashboard')
        } else if (createdUser.role === 'manager') {
          navigate('/manager/dashboard')
        } else if (createdUser.role === 'admin') {
          navigate('/admin/dashboard')
        }
      }, 700)
    } catch (err: any) {
      setError(err?.message || 'Failed to create account')
    }
  }

  const roleOptions: {
    role: UserRole
    label: string
    desc: string
    icon: React.FC<{ className?: string }>
  }[] = [
    {
      role: 'employee',
      label: 'Employee',
      desc: 'Submit leaves, payslips & chat with KineticHR',
      icon: User,
    },
    {
      role: 'manager',
      label: 'Manager',
      desc: 'Team approvals, availability & employee oversight',
      icon: UserCheck,
    },
    {
      role: 'admin',
      label: 'HR Admin',
      desc: 'Company policies, leave rules & audit telemetry',
      icon: ShieldAlert,
    },
  ]

  const departments = [
    'Engineering',
    'Human Resources',
    'Product & Design',
    'Finance & Accounting',
    'Marketing',
    'Operations',
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="space-y-4">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-full bg-[#23ace3]/15 text-[#23ace3] flex items-center justify-center">
              <Plus className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg font-semibold text-foreground">
              Add Another Account
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Create and switch to a new persona inside your organization.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center animate-in fade-in">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Account Created!</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Switching session to {name}...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {error && (
              <div className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            {/* Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#23ace3] focus:ring-1 focus:ring-[#23ace3] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Work Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. alex@kinetic.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#23ace3] focus:ring-1 focus:ring-[#23ace3] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Account Role *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {roleOptions.map(opt => {
                  const Icon = opt.icon
                  const isSelected = role === opt.role
                  return (
                    <button
                      key={opt.role}
                      type="button"
                      onClick={() => setRole(opt.role)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#23ace3] bg-[#23ace3]/10 text-foreground shadow-xs'
                          : 'border-border/60 bg-background/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div
                          className={`p-1.5 rounded-lg ${
                            isSelected
                              ? 'bg-[#23ace3] text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        {isSelected && (
                          <span className="h-2 w-2 rounded-full bg-[#23ace3]" />
                        )}
                      </div>
                      <div className="text-xs font-semibold text-foreground">
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                        {opt.desc}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Department & Job Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Department
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:border-[#23ace3] focus:ring-1 focus:ring-[#23ace3] transition-all cursor-pointer"
                  >
                    {departments.map(d => (
                      <option key={d} value={d} className="bg-popover text-foreground">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Job Title (Optional)
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type="text"
                    placeholder={
                      role === 'admin'
                        ? 'HR Administrator'
                        : role === 'manager'
                        ? 'Engineering Manager'
                        : 'Software Engineer'
                    }
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#23ace3] focus:ring-1 focus:ring-[#23ace3] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/50">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-xl bg-[#23ace3] hover:bg-[#1f9cd0] text-white shadow-xs cursor-pointer transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Create & Switch</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  )
}
