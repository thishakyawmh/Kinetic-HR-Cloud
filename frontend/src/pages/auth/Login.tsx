import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import {
  Building2,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  AlertCircle,
} from 'lucide-react'

export const Login: React.FC = () => {
  const { companyId: routeCompanyId } = useParams<{ companyId?: string }>()
  const { allTenants, loginWithCredentials, validateOrganization } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // Form states
  const [companyInput, setCompanyInput] = useState(routeCompanyId || '')
  const [employeeIdInput, setEmployeeIdInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Resolve tenant matching current routeCompanyId
  const currentTenant = allTenants.find(
    t =>
      t.code.toLowerCase() === (routeCompanyId || '').toLowerCase() ||
      t.id.toLowerCase() === (routeCompanyId || '').toLowerCase() ||
      t.name.toLowerCase().includes((routeCompanyId || '').toLowerCase())
  ) || (routeCompanyId ? {
    id: `tenant-${routeCompanyId.toLowerCase()}`,
    name: routeCompanyId.charAt(0).toUpperCase() + routeCompanyId.slice(1),
    code: routeCompanyId.toUpperCase(),
    domain: `${routeCompanyId.toLowerCase()}.com`,
    plan: 'Enterprise' as const,
    primaryColor: '#0284c7',
  } : allTenants[0])

  // Step 1: Handle Organization ID Submission
  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanId = companyInput.trim().toLowerCase()
    if (!cleanId) {
      setErrorMessage('Please enter a valid Organization ID')
      return
    }
    setErrorMessage('')
    setIsLoading(true)

    try {
      await validateOrganization(cleanId)
      navigate(`/login/${encodeURIComponent(cleanId)}`)
    } catch (err: any) {
      setErrorMessage(err.message || `Organization "${cleanId}" not found`)
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Handle Employee ID & Password Login Submission
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!employeeIdInput.trim()) {
      setErrorMessage('Please enter your Employee ID')
      return
    }
    if (!passwordInput.trim()) {
      setErrorMessage('Please enter your password')
      return
    }

    setIsLoading(true)
    try {
      const targetTenantId = currentTenant ? currentTenant.id : 'tenant-kinetic'
      const session = await loginWithCredentials(
        targetTenantId,
        employeeIdInput.trim(),
        passwordInput.trim()
      )
      const targetRoute =
        session.user.role === 'admin'
          ? '/admin/dashboard'
          : session.user.role === 'manager'
            ? '/manager/dashboard'
            : session.user.role === 'platform_admin'
              ? '/platform/dashboard'
              : '/employee/dashboard'
      navigate(targetRoute)
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify your Employee ID and password.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-4 sm:p-6 relative overflow-hidden font-sans transition-colors duration-200">
      {/* Ambient background brand glows matching employee workspace (#23ace3 & #ef8d46) */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#23ace3]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#ef8d46]/10 blur-3xl pointer-events-none" />

      {/* Top Controls: Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted border border-border/50 bg-card/60 backdrop-blur-sm transition-all cursor-pointer shadow-2xs"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <div className="w-full max-w-lg space-y-6 relative z-10">
        {/* Brand Banner with official Kinetic logo and colors */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2.5 mb-1">
            <img
              src="/kenetic_logo.webp"
              alt="Kinetic"
              className="h-10 sm:h-11 w-auto object-contain"
              onError={e => {
                const target = e.currentTarget
                if (!target.src.endsWith('kenetic_logo.wbp')) {
                  target.src = '/kenetic_logo.wbp'
                }
              }}
            />
            <span className="font-semibold text-2xl sm:text-3xl tracking-tight text-foreground flex items-center">
              Kinetic
              <span className="font-bold ml-1.5 flex items-center">
                <span className="text-[#23ace3]">H</span>
                <span className="text-[#ef8d46]">R</span>
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#23ace3]/10 text-[#23ace3] border border-[#23ace3]/20">
                Cloud
              </span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {routeCompanyId
              ? `Sign in to ${currentTenant?.name || routeCompanyId.toUpperCase()}`
              : 'Your intelligent HR workspace'}
          </p>
        </div>

        {/* Login Shell Card */}
        <Card className="border border-border/80 bg-card shadow-lg hover:shadow-xl transition-all rounded-[28px] p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-destructive/10 text-destructive border border-destructive/20 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Enter Organization ID */}
          {!routeCompanyId ? (
            <form onSubmit={handleCompanySubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="organizationId"
                  className="block text-xs font-semibold text-foreground uppercase tracking-wider"
                >
                  Organization ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <input
                    id="organizationId"
                    type="text"
                    value={companyInput}
                    onChange={e => {
                      setCompanyInput(e.target.value)
                      if (errorMessage) setErrorMessage('')
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#23ace3] focus:ring-1 focus:ring-[#23ace3] transition-all"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-muted-foreground pt-0.5">
                  Enter your organization's unique domain or organization code to proceed.
                </p>

                {/* Quick Demo Organization Shortcuts */}
                <div className="pt-2">
                  <div className="text-[11px] text-muted-foreground mb-1.5 font-medium">Demo Organizations:</div>
                  <div className="flex flex-wrap gap-2">
                    {allTenants.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setCompanyInput(t.code)
                          navigate(`/login/${encodeURIComponent(t.code.toLowerCase())}`)
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg border border-border/70 hover:border-[#23ace3]/50 bg-background hover:bg-muted text-foreground transition-all cursor-pointer font-medium"
                      >
                        {t.name} ({t.code})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Organization ID Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-[#23ace3] hover:bg-[#1b97ca] disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>{isLoading ? 'Verifying...' : 'Continue'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            /* STEP 2: Enter Employee ID and Password */
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              {/* Organization Identification pill */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-background/80 border border-border/60 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[#23ace3]/15 text-[#23ace3] flex items-center justify-center font-bold">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {currentTenant?.name || routeCompanyId.toUpperCase()}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      Org ID: {routeCompanyId.toUpperCase()}
                    </div>
                  </div>
                </div>

                <Link
                  to="/login"
                  className="text-xs text-[#23ace3] hover:text-[#1b97ca] hover:underline flex items-center gap-1 font-medium transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Change</span>
                </Link>
              </div>

              {/* Quick Demo Roles */}
              <div className="pt-1">
                <div className="text-[11px] text-muted-foreground mb-1.5 font-medium">Quick Demo Accounts:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setEmployeeIdInput('KT-8842')
                      setPasswordInput('password123')
                    }}
                    className="p-2 text-left rounded-xl border border-border/70 hover:border-[#23ace3]/50 bg-background hover:bg-muted text-foreground transition-all cursor-pointer"
                  >
                    <div className="font-semibold text-[11px] text-[#23ace3]">Standard Employee</div>
                    <div className="text-[10px] text-muted-foreground truncate">Alice (KT-8842)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmployeeIdInput('KC-0001')
                      setPasswordInput('password123')
                    }}
                    className="p-2 text-left rounded-xl border border-border/70 hover:border-[#23ace3]/50 bg-background hover:bg-muted text-foreground transition-all cursor-pointer"
                  >
                    <div className="font-semibold text-[11px] text-[#23ace3]">Platform Admin</div>
                    <div className="text-[10px] text-muted-foreground truncate">Alex (KC-0001)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmployeeIdInput('KT-1044')
                      setPasswordInput('password123')
                    }}
                    className="p-2 text-left rounded-xl border border-border/70 hover:border-[#23ace3]/50 bg-background hover:bg-muted text-foreground transition-all cursor-pointer"
                  >
                    <div className="font-semibold text-[11px] text-[#23ace3]">Manager Account</div>
                    <div className="text-[10px] text-muted-foreground truncate">David (KT-1044 - Approvals)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmployeeIdInput('KT-1044-EMP')
                      setPasswordInput('password123')
                    }}
                    className="p-2 text-left rounded-xl border border-border/70 hover:border-[#23ace3]/50 bg-background hover:bg-muted text-foreground transition-all cursor-pointer"
                  >
                    <div className="font-semibold text-[11px] text-[#ef8d46]">David's Employee Account</div>
                    <div className="text-[10px] text-muted-foreground truncate">David (KT-1044-EMP)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmployeeIdInput('KT-0012')
                      setPasswordInput('password123')
                    }}
                    className="p-2 text-left rounded-xl border border-border/70 hover:border-[#23ace3]/50 bg-background hover:bg-muted text-foreground transition-all cursor-pointer"
                  >
                    <div className="font-semibold text-[11px] text-[#23ace3]">HR Admin Account</div>
                    <div className="text-[10px] text-muted-foreground truncate">Sarah (KT-0012 - HR Hub)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmployeeIdInput('KT-0012-EMP')
                      setPasswordInput('password123')
                    }}
                    className="p-2 text-left rounded-xl border border-border/70 hover:border-[#23ace3]/50 bg-background hover:bg-muted text-foreground transition-all cursor-pointer"
                  >
                    <div className="font-semibold text-[11px] text-[#ef8d46]">Sarah's Employee Account</div>
                    <div className="text-[10px] text-muted-foreground truncate">Sarah (KT-0012-EMP)</div>
                  </button>
                </div>
              </div>

              {/* Employee ID Field */}
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="employeeId"
                  className="block text-xs font-semibold text-foreground uppercase tracking-wider"
                >
                  Employee ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="employeeId"
                    type="text"
                    value={employeeIdInput}
                    onChange={e => {
                      setEmployeeIdInput(e.target.value)
                      if (errorMessage) setErrorMessage('')
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#23ace3] focus:ring-1 focus:ring-[#23ace3] transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-foreground uppercase tracking-wider"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={e => {
                      setPasswordInput(e.target.value)
                      if (errorMessage) setErrorMessage('')
                    }}
                    className="w-full pl-10 pr-10 py-2.5 bg-background border border-border/80 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#23ace3] focus:ring-1 focus:ring-[#23ace3] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-[#23ace3] hover:bg-[#1b97ca] disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}
        </Card>

        {/* Footer Disclaimer */}
        <p className="text-center text-xs text-muted-foreground/80">
          Kinetic HR Cloud is an enterprise multi-tenant HR system.
        </p>
      </div>
    </div>
  )
}
