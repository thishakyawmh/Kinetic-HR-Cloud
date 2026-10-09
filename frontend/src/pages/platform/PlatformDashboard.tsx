import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { platformService } from '@/services/platformService'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Building2,
  Users,
  CreditCard,
  Activity,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  Server,
  Layers,
  ExternalLink,
} from 'lucide-react'

export const PlatformDashboard: React.FC = () => {
  const navigate = useNavigate()

  const { data: metrics } = useQuery({
    queryKey: ['platformMetrics'],
    queryFn: () => platformService.getPlatformMetrics(),
  })

  const { data: organizations = [], refetch } = useQuery({
    queryKey: ['platformOrganizations'],
    queryFn: () => platformService.getOrganizations(),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kinetic SaaS Platform Command"
        subtitle="Global multi-tenant cloud orchestration, subscription tiers, and Azure service fleet diagnostics."
        badge={
          <Badge variant="outline" className="text-xs bg-[#23ace3]/15 text-[#23ace3] border-[#23ace3]/30">
            SaaS Root Control
          </Badge>
        }
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/platform/system-health')}
          className="gap-1.5 text-xs rounded-xl border-border hover:bg-muted"
        >
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span>Azure Health Fleet</span>
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => navigate('/platform/organizations?register=true')}
          className="gap-1.5 text-xs bg-[#23ace3] hover:bg-[#1b97ca] text-white rounded-xl shadow-xs"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Onboard Organization</span>
        </Button>
      </PageHeader>

      {/* Global SaaS Platform Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Organizations"
          value={metrics?.totalOrganizations || organizations.length}
          subtitle="Isolated enterprise tenants"
          icon={Building2}
          iconColor="text-[#23ace3] bg-[#23ace3]/15"
        />
        <StatCard
          title="Total Provisioned Users"
          value={metrics?.totalUsers || 24}
          subtitle="Employees, managers & admins"
          icon={Users}
          iconColor="text-indigo-400 bg-indigo-500/15"
        />
        <StatCard
          title="Annual Recurring Revenue"
          value={`$${(metrics?.arr || 28760).toLocaleString()}`}
          subtitle="Active SaaS plan contracts"
          icon={CreditCard}
          iconColor="text-emerald-400 bg-emerald-500/15"
        />
        <StatCard
          title="Fleet Gateway Latency (P99)"
          value="24ms"
          subtitle="99.99% availability SLA"
          icon={Activity}
          iconColor="text-[#ef8d46] bg-[#ef8d46]/15"
          badge={<Badge variant="success" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Operational</Badge>}
        />
      </div>

      {/* Primary Customer Tenant Roster */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Registered Organizations</h3>
            <p className="text-xs text-muted-foreground">
              Tenants operating with strict data, RAG, and query isolation.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/platform/organizations')}
            className="text-xs text-[#23ace3] hover:bg-[#23ace3]/15 rounded-lg"
          >
            <span>Manage all tenants</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/50">
                <TableHead>Organization Name</TableHead>
                <TableHead>Tenant ID</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Subscription Tier</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map(org => (
                <TableRow
                  key={org.id}
                  onClick={() => navigate('/platform/organizations')}
                  className="border-border/40 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <TableCell className="font-bold text-xs text-foreground">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#23ace3]/15 text-[#23ace3] font-bold text-xs">
                        {org.name.charAt(0)}
                      </div>
                      <div>
                        <div>{org.name}</div>
                        <div className="text-[10px] text-muted-foreground font-normal">{org.industry || 'Technology'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono font-medium text-[#23ace3]">
                    {org.id}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {org.domain}
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
                  <TableCell className="text-xs font-semibold text-foreground">
                    {org.employeeCount || 1}
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
                        navigate('/platform/organizations')
                      }}
                      className="text-xs text-[#23ace3] hover:bg-[#23ace3]/15 rounded-lg"
                    >
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Azure Managed Infrastructure Fabric Banner */}
      <Card className="border-border/60 bg-gradient-to-r from-card via-[#23ace3]/10 to-card rounded-2xl shadow-sm">
        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-[#23ace3]" />
              <h4 className="text-sm font-bold text-foreground">
                Azure Managed SaaS Cloud Infrastructure Fleet
              </h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Kinetic HR Cloud operates across Microsoft Azure Functions (Serverless Node.js 20), Cosmos DB for NoSQL (/tenantId partition sharding), Azure Blob Storage (90-day cool tiering), and Azure Key Vault HSM keys with automated multi-zone ZRS redundancy.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/platform/system-health')}
              className="text-xs border-[#23ace3]/40 text-[#23ace3] hover:bg-[#23ace3]/10 rounded-xl"
            >
              <Activity className="h-3.5 w-3.5 mr-1.5" />
              <span>Inspect Health Fleet</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/platform/subscriptions')}
              className="text-xs border-border text-foreground hover:bg-muted rounded-xl"
            >
              <Layers className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
              <span>Subscription Plans</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

