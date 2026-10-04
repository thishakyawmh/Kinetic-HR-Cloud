import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building, Users, ShieldAlert, PlusCircle } from 'lucide-react'

export const AdminDepartments: React.FC = () => {
  const departments = [
    { name: 'Engineering', head: 'David Wilson', count: 142, threshold: '70% min staffing', status: 'Active' },
    { name: 'Human Resources', head: 'Sarah Miller', count: 18, threshold: '80% min staffing', status: 'Active' },
    { name: 'Product Management', head: 'Claire Underwood', count: 24, threshold: '75% min staffing', status: 'Active' },
    { name: 'Design & UX', head: 'Carlos Mendoza', count: 16, threshold: '65% min staffing', status: 'Active' },
    { name: 'Operations & Cloud', head: 'Brandon Lee', count: 48, threshold: '85% min staffing', status: 'Active' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments & Organizational Hierarchy"
        subtitle="Manage department staffing quotas, minimum operational thresholds, and designated approvals leads."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept, i) => (
          <Card key={i} className="border-slate-200 hover:border-slate-300 transition-all shadow-xs">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-sky-50 text-sky-700">
                    <Building className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{dept.name}</h4>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {dept.status}
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department Lead:</span>
                  <span className="font-semibold text-slate-900">{dept.head}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Headcount:</span>
                  <span className="font-semibold text-slate-900">{dept.count} members</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Staffing Threshold:</span>
                  <span className="font-semibold text-indigo-700">{dept.threshold}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
