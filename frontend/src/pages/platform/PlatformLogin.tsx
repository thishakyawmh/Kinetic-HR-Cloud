import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Card } from '@/components/ui/card'
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sun,
  Moon,
  AlertCircle,
  User,
} from 'lucide-react'

export const PlatformLogin: React.FC = () => {
  const { companyId: routeCompanyId } = useParams<{ companyId?: string }>()
  const { allTenants, loginPlatformAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // Resolve tenant matching route company or default to Sampath Bank
  const effectiveCompanyId = routeCompanyId || 'sampath'
  const currentTenant = allTenants.find(
    t =>
      t.code.toLowerCase() === effectiveCompanyId.toLowerCase() ||
      t.id.toLowerCase() === effectiveCompanyId.toLowerCase() ||
      t.name.toLowerCase().includes(effectiveCompanyId.toLowerCase())
  ) || {
    id: 'tenant-sampath',
    name: 'Sampath Bank PLC',
    code: 'SAMPATH',
    domain: 'sampath.lk',
    plan: 'Enterprise' as const,
  }

  const [adminId, setAdminId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminId.trim()) {
      setError('Please enter your Administrator ID')
      return
    }
    if (!password.trim()) {
      setError('Please enter your password')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await loginPlatformAdmin(adminId.trim(), password.trim())
      navigate('/platform/dashboard', { replace: true })
    } catch (err: any) {
      console.error('Platform login error:', err)
      setError(
        err.message || 'Authentication failed. Please verify your Administrator ID and password.'
      )
    } finally {
      setLoading(false)
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
        {/* Brand Banner with official Kinetic logo and consistent colors */}
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
            Sign in to {currentTenant.name}
          </p>
        </div>

        {/* Login Shell Card matching consistent styling */}
        <Card className="border border-border/80 bg-card shadow-lg hover:shadow-xl transition-all rounded-[28px] p-6 sm:p-8 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-destructive/10 text-destructive border border-destructive/20 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Administrator ID Field */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="adminId"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider"
              >
                Administrator ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="adminId"
                  type="text"
                  value={adminId}
                  onChange={e => {
                    setAdminId(e.target.value)
                    if (error) setError(null)
                  }}
                  placeholder="Enter Administrator ID"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#23ace3] focus:ring-1 focus:ring-[#23ace3] transition-all"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    if (error) setError(null)
                  }}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-10 py-2.5 bg-background border border-border/80 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#23ace3] focus:ring-1 focus:ring-[#23ace3] transition-all"
                  required
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#23ace3] hover:bg-[#1b97ca] disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              <span>{loading ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </Card>

        {/* Footer Disclaimer */}
        <p className="text-center text-xs text-muted-foreground/80">
          Kinetic HR Cloud is an enterprise multi-tenant HR system.
        </p>
      </div>
    </div>
  )
}
