import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { platformService, OrganizationRegistrationInput } from '@/services/platformService'
import { Tenant, SubscriptionTier } from '@/types'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  Building2,
  PlusCircle,
  Search,
  CheckCircle2,
  Shield,
  Layers,
  Sparkles,
  Users,
  CreditCard,
  Copy,
  Check,
} from 'lucide-react'

export const PlatformOrganizations: React.FC = () => {
  const location = useLocation()
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<Tenant | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Registration Form State
  const [orgName, setOrgName] = useState('')
  const [orgDomain, setOrgDomain] = useState('')
  const [orgIndustry, setOrgIndustry] = useState('Technology & Cloud')
  const [orgCountry, setOrgCountry] = useState('United States')
  const [orgPlan, setOrgPlan] = useState<SubscriptionTier>('Business')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')

  // Newly registered outcome
  const [registeredOutcome, setRegisteredOutcome] = useState<{ tenant: Tenant; adminUser: any } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('register') === 'true') {
      setIsRegisterOpen(true)
    }
  }, [location.search])

  const { data: organizations = [], refetch } = useQuery({
    queryKey: ['platformOrganizations'],
    queryFn: () => platformService.getOrganizations(),
  })

  const registerMutation = useMutation({
    mutationFn: (data: OrganizationRegistrationInput) =>
      Promise.resolve(platformService.registerOrganization(data)),
    onSuccess: outcome => {
      queryClient.invalidateQueries({ queryKey: ['platformOrganizations'] })
      queryClient.invalidateQueries({ queryKey: ['platformMetrics'] })
      setRegisteredOutcome(outcome)
    },
  })

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgName.trim() || !orgDomain.trim() || !adminEmail.trim()) return

    registerMutation.mutate({
      name: orgName,
      domain: orgDomain,
      industry: orgIndustry,
      country: orgCountry,
      plan: orgPlan,
      adminName: adminName || 'Tenant Administrator',
      adminEmail: adminEmail,
    })
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredOrgs = organizations.filter(o => {
    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase()
    return o.name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || o.domain.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenant Organizations Directory"
        subtitle="Manage logical enterprise tenant boundaries, unique Tenant IDs, and assigned subscription tiers."
        badge={
          <Badge variant="outline" className="text-xs bg-[#23ace3]/15 text-[#23ace3] border-[#23ace3]/30">
            {organizations.length} Active Tenants
          </Badge>
        }
      >
        <Button
          variant="default"
          size="sm"
          onClick={() => {
            setRegisteredOutcome(null)
            setIsRegisterOpen(true)
          }}
          className="gap-1.5 text-xs bg-[#23ace3] hover:bg-[#1b97ca] text-white rounded-xl shadow-xs"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Register New Organization</span>
        </Button>
      </PageHeader>

      {/* Search and Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations by name, tenant ID, or domain..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>
      </div>

      {/* Organizations Table */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/50">
              <TableHead>Organization</TableHead>
              <TableHead>Unique Tenant ID</TableHead>
              <TableHead>Domain & Region</TableHead>
              <TableHead>Subscription Plan</TableHead>
              <TableHead>Workforce</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrgs.map(org => (
              <TableRow
                key={org.id}
                onClick={() => setSelectedOrg(org)}
                className="border-border/40 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <TableCell className="font-bold text-xs text-foreground">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#23ace3]/15 text-[#23ace3] font-bold text-xs">
                      {org.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">{org.name}</div>
                      <div className="text-[11px] text-muted-foreground font-normal">{org.industry}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#23ace3] bg-[#23ace3]/10 px-2 py-0.5 rounded-lg border border-[#23ace3]/20">
                      {org.id}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleCopyId(org.id)
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      title="Copy Tenant ID"
                    >
                      {copiedId === org.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">
                  <div>{org.domain}</div>
                  <div className="text-[10px] text-muted-foreground/80 font-sans">{org.country}</div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      org.plan === 'Enterprise'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : org.plan === 'Business'
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {org.plan} Tier
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-medium text-foreground">
                  {org.employeeCount || 1} employees
                </TableCell>
                <TableCell>
                  <Badge variant="success" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    Active
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation()
                      setSelectedOrg(org)
                    }}
                    className="text-xs text-[#23ace3] hover:bg-[#23ace3]/15 rounded-lg"
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Organization Detail Dialog */}
      <Dialog open={selectedOrg !== null} onOpenChange={open => !open && setSelectedOrg(null)}>
        {selectedOrg && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] font-mono text-[#23ace3] border-[#23ace3]/30">
                  {selectedOrg.id}
                </Badge>
                <Badge variant="success" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  {selectedOrg.status || 'Active'}
                </Badge>
              </div>
              <DialogTitle className="text-lg text-foreground">{selectedOrg.name}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Domain: {selectedOrg.domain} • Subscribed to {selectedOrg.plan} Tier
              </DialogDescription>
            </DialogHeader>

            <div className="py-3 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-muted/30 border border-border/50">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                    Assigned Plan
                  </span>
                  <span className="text-sm font-bold text-foreground">{selectedOrg.plan}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                    Enrolled Employees
                  </span>
                  <span className="text-sm font-bold text-[#23ace3]">{selectedOrg.employeeCount || 1}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                    Industry Sector
                  </span>
                  <span className="text-xs font-medium text-foreground">{selectedOrg.industry || 'Technology'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                    Operating Jurisdiction
                  </span>
                  <span className="text-xs font-medium text-foreground">{selectedOrg.country || 'United States'}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-1">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Tenant Isolation Boundary Guarantees (§13)</span>
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  PostgreSQL row security policies, Azure AI Search vector indexes, and Cosmos DB conversation partitions are strictly bounded to Tenant ID <strong className="text-foreground">{selectedOrg.id}</strong>.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setSelectedOrg(null)} className="rounded-xl">
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>

      {/* Organization Onboarding Wizard Modal (§5 & §52) */}
      <Dialog
        open={isRegisterOpen}
        onOpenChange={open => {
          if (!open) {
            setIsRegisterOpen(false)
            setRegisteredOutcome(null)
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg text-foreground">
            {registeredOutcome ? 'Organization Provisioned Successfully' : 'Onboard New Customer Organization (§5 & §52)'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {registeredOutcome
              ? 'Tenant ID generated and initial HR Administrator provisioned.'
              : 'Provision a new customer company environment on Kinetic HR Cloud.'}
          </DialogDescription>
        </DialogHeader>

        {registeredOutcome ? (
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-foreground">
                {registeredOutcome.tenant.name} is Ready
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                The organization has been provisioned with logical tenant isolation.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-muted-foreground">Generated Tenant ID:</span>
                <span className="font-mono font-bold text-sm text-[#23ace3] bg-[#23ace3]/15 px-2.5 py-0.5 rounded-lg border border-[#23ace3]/30">
                  {registeredOutcome.tenant.id}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Subscription Plan:</span>
                <span className="font-semibold text-foreground">{registeredOutcome.tenant.plan} Tier</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Initial HR Administrator:</span>
                <span className="font-semibold text-foreground">{registeredOutcome.adminUser.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Admin Login Email:</span>
                <span className="font-mono text-muted-foreground">{registeredOutcome.adminUser.email}</span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setIsRegisterOpen(false)
                  setRegisteredOutcome(null)
                }}
                className="w-full bg-[#23ace3] hover:bg-[#1b97ca] text-white rounded-xl shadow-xs"
              >
                Complete Onboarding
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground block">Company / Organization Name *</label>
              <Input
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="E.g., Quantum Dynamics Corp"
                required
                className="h-9 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">Corporate Domain *</label>
                <Input
                  value={orgDomain}
                  onChange={e => setOrgDomain(e.target.value)}
                  placeholder="e.g. quantumdynamics.com"
                  required
                  className="h-9 rounded-xl font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">Industry</label>
                <Input
                  value={orgIndustry}
                  onChange={e => setOrgIndustry(e.target.value)}
                  placeholder="e.g. Fintech, Healthcare"
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block">Subscription Tier Selection *</label>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {(['Starter', 'Business', 'Enterprise'] as SubscriptionTier[]).map(tier => (
                  <div
                    key={tier}
                    onClick={() => setOrgPlan(tier)}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                      orgPlan === tier
                        ? 'border-[#23ace3] bg-[#23ace3]/15 text-foreground shadow-xs'
                        : 'border-border/60 hover:border-border bg-card text-muted-foreground'
                    }`}
                  >
                    <div className="font-bold text-xs">{tier}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {tier === 'Starter' ? 'Up to 25 seats' : tier === 'Business' ? 'Up to 100 seats' : '1000+ seats'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-border/50 space-y-3">
              <span className="font-semibold text-foreground block text-xs">
                Initial HR Administrator Account Provisioning (§7 & §52)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground block">Admin Full Name</label>
                  <Input
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    placeholder="e.g. Sarah Miller"
                    className="h-9 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground block">Admin Corporate Email *</label>
                  <Input
                    type="email"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="e.g. s.miller@quantum.com"
                    required
                    className="h-9 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRegisterOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={registerMutation.isPending || !orgName.trim() || !orgDomain.trim()}
                className="bg-[#23ace3] hover:bg-[#1b97ca] text-white rounded-xl shadow-xs"
              >
                {registerMutation.isPending ? 'Generating Tenant ID...' : 'Provision Organization'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>
    </div>
  )
}
