import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Server,
  Database,
  Search,
  Cpu,
  ShieldCheck,
  Zap,
  Globe,
  Lock,
  Activity,
  CheckCircle2,
} from 'lucide-react'

export const PlatformSystemHealth: React.FC = () => {
  const azureServices = [
    {
      name: 'Azure Static Web Apps',
      spec: 'React 19 + TypeScript SPA Hosting (§32)',
      status: 'Operational',
      uptime: '100.0%',
      latency: '24ms',
      region: 'East US 2',
      icon: Globe,
    },
    {
      name: 'Azure API Management (APIM)',
      spec: 'Tenant Routing, Rate Limiting & Auth Policies (§36)',
      status: 'Operational',
      uptime: '99.99%',
      latency: '18ms',
      region: 'East US 2',
      icon: Zap,
    },
    {
      name: 'Azure Container Apps',
      spec: 'ASP.NET Core Action Gateway & Business Rules (§37)',
      status: 'Operational',
      uptime: '99.98%',
      latency: '35ms',
      region: 'East US 2',
      icon: Server,
    },
    {
      name: 'Azure Database for PostgreSQL',
      spec: 'Transactional HR Source of Truth (§22)',
      status: 'Operational',
      uptime: '99.99%',
      latency: '12ms',
      region: 'East US 2',
      icon: Database,
    },
    {
      name: 'Azure Cosmos DB for NoSQL',
      spec: 'AI Agent Conversation Memory & Session Partitions (§21)',
      status: 'Operational',
      uptime: '99.999%',
      latency: '8ms',
      region: 'East US 2',
      icon: Database,
    },
    {
      name: 'Azure AI Search',
      spec: 'Tenant-Scoped Semantic Vector RAG Index (§19)',
      status: 'Operational',
      uptime: '99.95%',
      latency: '85ms',
      region: 'East US 2',
      icon: Search,
    },
    {
      name: 'Microsoft Foundry Agent Service & Azure OpenAI',
      spec: 'GPT-4o Reasoning & Tool Orchestration Layer (§18)',
      status: 'Operational',
      uptime: '99.94%',
      latency: '410ms',
      region: 'East US 2',
      icon: Cpu,
    },
    {
      name: 'Azure Key Vault',
      spec: 'HSM Enterprise Secrets & Integration Tokens (§42)',
      status: 'Operational',
      uptime: '100.0%',
      latency: '6ms',
      region: 'East US 2',
      icon: Lock,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Azure Cloud Infrastructure Fleet Diagnostics"
        subtitle="Live telemetry and health monitoring across managed Microsoft Azure services (§31 & §61)."
        badge={
          <Badge variant="success" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            Fleet: 100% Operational
          </Badge>
        }
      />

      {/* Grid of Azure Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {azureServices.map((svc, i) => {
          const Icon = svc.icon
          return (
            <Card key={i} className="bg-card border-border/60 rounded-2xl shadow-xs hover:border-[#23ace3]/40 transition-all">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-xl bg-[#23ace3]/15 text-[#23ace3] flex items-center justify-center">
                    <Icon className="h-4 w-4" />
                  </div>
                  <Badge variant="success" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    {svc.status}
                  </Badge>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-foreground leading-tight">{svc.name}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{svc.spec}</p>
                </div>

                <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-sans">Uptime</span>
                    <span className="font-bold text-foreground">{svc.uptime}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-sans">Latency</span>
                    <span className="font-bold text-[#23ace3]">{svc.latency}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
