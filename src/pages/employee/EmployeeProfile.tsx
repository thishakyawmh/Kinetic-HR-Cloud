import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Building, MapPin, Calendar, ShieldCheck, Phone } from 'lucide-react'

export const EmployeeProfile: React.FC = () => {
  const { user, tenant } = useAuth()

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Employee Profile"
        subtitle="Manage your employee identity, contact preferences, and reporting structure."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Avatar & Key Role Identity Card */}
        <Card className="text-center p-6 border-slate-200">
          <CardContent className="space-y-4 p-0">
            <div className="h-24 w-24 rounded-full bg-slate-900 text-white font-bold text-3xl flex items-center justify-center mx-auto shadow-md">
              {user?.name?.[0] || 'U'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{user?.name}</h3>
              <p className="text-xs text-muted-foreground">{user?.jobTitle}</p>
              <Badge variant="outline" className="mt-2 text-xs">
                {user?.employeeNumber}
              </Badge>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800">{tenant?.name}</div>
              <div className="text-[11px] text-muted-foreground">Tenant: {tenant?.code}</div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Information */}
        <div className="md:col-span-2 space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Organizational Hierarchy & Department</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-100">
                <span className="text-muted-foreground">Department:</span>
                <span className="font-semibold text-slate-900">{user?.department}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-100">
                <span className="text-muted-foreground">Direct Manager:</span>
                <span className="font-semibold text-sky-700">{user?.managerName || 'David Wilson'}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-100">
                <span className="text-muted-foreground">Start / Hire Date:</span>
                <span className="font-semibold text-slate-900">{user?.hireDate}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-100">
                <span className="text-muted-foreground">Work Location:</span>
                <span className="font-semibold text-slate-900">{user?.location || 'Hybrid'}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 py-2">
                <span className="text-muted-foreground">Work Email:</span>
                <span className="font-semibold text-slate-900">{user?.email}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Authentication & Security</CardTitle>
              <CardDescription className="text-xs">
                Identity verified via corporate Single Sign-On
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-sky-50/70 border border-sky-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-sky-600" />
                  <span className="font-semibold text-sky-950">Microsoft Entra ID (Azure AD)</span>
                </div>
                <Badge variant="success" className="text-[10px]">
                  Enrolled & Active
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Sensitive financial credentials (bank account number, full SSN/tax number) are protected by Azure Key Vault and never exposed in the browser.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
