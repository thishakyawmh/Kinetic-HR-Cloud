import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { policyService } from '@/services/policyService'
import { PolicyDocument } from '@/types'
import { PageHeader } from '@/components/common/PageHeader'
import { PolicyCard } from '@/components/policy/PolicyCard'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Search, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const EmployeePolicies: React.FC = () => {
  const { tenant } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [activePolicy, setActivePolicy] = useState<PolicyDocument | null>(null)

  const { data: policies = [] } = useQuery({
    queryKey: ['policies', tenant?.id, selectedCategory, searchTerm],
    queryFn: () => (tenant?.id ? policyService.getPolicies(tenant.id, selectedCategory, searchTerm) : []),
    enabled: !!tenant?.id,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company HR Policies"
        subtitle="Search and review official company regulations, workplace guidelines, and benefit entitlements."
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search policies by keyword (e.g. 'Emergency', 'Parental', 'Remote', 'Overtime')..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-card border-border/60 text-foreground"
          />
        </div>
        <div className="w-full sm:w-64">
          <Select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="h-10 rounded-xl"
          >
            <option value="all">All Categories</option>
            <option value="Leave & Attendance">Leave & Attendance</option>
            <option value="Compensation & Benefits">Compensation & Benefits</option>
            <option value="Workplace & Remote">Workplace & Remote</option>
            <option value="Conduct & Compliance">Conduct & Compliance</option>
          </Select>
        </div>
      </div>

      {/* Policy Grid */}
      {policies.length === 0 ? (
        <div className="p-12 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-dashed border-border/80">
          No policies match your search query. Try searching for "Leave", "Remote", or "Payroll".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {policies.map(policy => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              onSelect={p => setActivePolicy(p)}
            />
          ))}
        </div>
      )}

      {/* Policy Detailed Viewer Modal */}
      <Dialog open={activePolicy !== null} onOpenChange={open => !open && setActivePolicy(null)}>
        {activePolicy && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px]">
                  v{activePolicy.version}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {activePolicy.category}
                </Badge>
              </div>
              <DialogTitle className="text-lg text-foreground">{activePolicy.title}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Last updated on {activePolicy.uploadedDate} • File size: {activePolicy.fileSize}
              </DialogDescription>
            </DialogHeader>

            <div className="py-3 space-y-4 text-xs">
              <div>
                <h5 className="font-semibold text-foreground mb-1">Executive Summary</h5>
                <p className="text-muted-foreground leading-relaxed bg-muted/40 p-3.5 rounded-xl border border-border/60">
                  {activePolicy.summary}
                </p>
              </div>

              {activePolicy.contentExcerpt && (
                <div>
                  <h5 className="font-semibold text-foreground mb-1">Policy Excerpt</h5>
                  <div className="text-foreground bg-muted/30 p-3.5 rounded-xl border border-border/60 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto">
                    {activePolicy.contentExcerpt}
                  </div>
                </div>
              )}

              <div>
                <h5 className="font-semibold text-foreground mb-1.5">Indexed Terms</h5>
                <div className="flex flex-wrap gap-1.5">
                  {activePolicy.keyTerms.map((t, idx) => (
                    <Badge key={idx} variant="outline" className="text-[11px] bg-muted/40 border-border/60 text-muted-foreground">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-border/50 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await policyService.getDownloadUrl(activePolicy.id)
                      if (res?.downloadUrl) {
                        window.open(res.downloadUrl, '_blank')
                      }
                    } catch (e) {
                      console.error('Download policy failed', e)
                    }
                  }}
                  className="text-xs gap-1.5 rounded-xl border-border bg-[#23ace3]/10 text-[#23ace3] hover:bg-[#23ace3]/20"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Document PDF</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </Dialog>
    </div>
  )
}
