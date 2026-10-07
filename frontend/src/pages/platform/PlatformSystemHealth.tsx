import React, { useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
  HardDrive,
  Layers,
  Network,
  Cloud,
  DollarSign,
  TrendingDown,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Boxes,
  Code,
  Sparkles,
} from 'lucide-react'

export const PlatformSystemHealth: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'topology' | 'sharding' | 'finops'>('topology')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 600)
  }

  const azureServices = [
    {
      name: 'Azure Static Web Apps',
      spec: 'React 19 + TypeScript SPA Hosting',
      status: 'Operational',
      uptime: '100.0%',
      latency: '22ms',
      region: 'East US 2',
      tier: 'Standard Global CDN',
      icon: Globe,
    },
    {
      name: 'Azure API Management (APIM)',
      spec: 'Tenant Routing, Rate Limiting & Auth Policies',
      status: 'Operational',
      uptime: '99.99%',
      latency: '16ms',
      region: 'East US 2',
      tier: 'Standard V2',
      icon: Zap,
    },
    {
      name: 'Azure Functions (Serverless)',
      spec: 'Node.js 20 LTS Microservices Compute Tier',
      status: 'Operational',
      uptime: '99.98%',
      latency: '34ms',
      region: 'East US 2',
      tier: 'Consumption / Y1 ($0 Idle)',
      icon: Server,
    },
    {
      name: 'Azure Cosmos DB for NoSQL',
      spec: 'Multi-Tenant Partition Key: /tenantId',
      status: 'Operational',
      uptime: '99.999%',
      latency: '7ms',
      region: 'East US 2 (ZRS Replicated)',
      tier: 'Autoscale RU/s (400-4,000)',
      icon: Database,
    },
    {
      name: 'Azure AI Search',
      spec: 'Tenant-Scoped Semantic Vector RAG Index',
      status: 'Operational',
      uptime: '99.95%',
      latency: '82ms',
      region: 'East US 2',
      tier: 'Basic (Hybrid Search)',
      icon: Search,
    },
    {
      name: 'Azure OpenAI Service (GPT-4o)',
      spec: 'Reasoning & Grounded Decision Support',
      status: 'Operational',
      uptime: '99.94%',
      latency: '380ms',
      region: 'East US 2',
      tier: 'Pay-as-you-go TPM',
      icon: Cpu,
    },
    {
      name: 'Azure Blob Storage',
      spec: 'Payslip Archive with 90-Day Cool Lifecycle',
      status: 'Operational',
      uptime: '100.0%',
      latency: '12ms',
      region: 'East US 2',
      tier: 'Standard ZRS (Lifecycle Tiering)',
      icon: HardDrive,
    },
    {
      name: 'Azure Key Vault',
      spec: 'HSM Enterprise Secrets & Managed Identities',
      status: 'Operational',
      uptime: '100.0%',
      latency: '5ms',
      region: 'East US 2',
      tier: 'Standard HSM',
      icon: Lock,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Azure Cloud Infrastructure & Architecture Fleet"
        subtitle="Live telemetry, multi-tenant Cosmos DB sharding, and cloud topology across Microsoft Azure services."
        badge={
          <Badge variant="success" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Azure Fleet: 100% Operational</span>
          </Badge>
        }
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-1.5 text-xs rounded-xl border-border/80 hover:bg-muted/40 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </Button>
      </PageHeader>

      {/* Primary Subsystem Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
        <TabsList className="bg-muted/40 p-1 rounded-xl border border-border/60">
          <TabsTrigger value="topology" className="text-xs gap-1.5 data-[state=active]:bg-card rounded-lg">
            <Network className="h-3.5 w-3.5 text-[#23ace3]" />
            <span>Interactive Cloud Topology</span>
          </TabsTrigger>
          <TabsTrigger value="telemetry" className="text-xs gap-1.5 data-[state=active]:bg-card rounded-lg">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>Live Azure Telemetry</span>
          </TabsTrigger>
          <TabsTrigger value="sharding" className="text-xs gap-1.5 data-[state=active]:bg-card rounded-lg">
            <Boxes className="h-3.5 w-3.5 text-indigo-400" />
            <span>Multi-Tenant Sharding</span>
          </TabsTrigger>
          <TabsTrigger value="finops" className="text-xs gap-1.5 data-[state=active]:bg-card rounded-lg">
            <DollarSign className="h-3.5 w-3.5 text-[#ef8d46]" />
            <span>FinOps & Cloud Economics</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: INTERACTIVE CLOUD ARCHITECTURE TOPOLOGY */}
        <TabsContent value="topology" className="space-y-6 mt-4">
          <Card className="border border-border/60 bg-card/90 backdrop-blur-xs rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="py-4 px-6 border-b border-border/50 bg-muted/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/20">
                    <Cloud className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      End-to-End Microsoft Azure Serverless Pipeline
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Logical data flow from Anycast Edge through Serverless Microservices down to Multi-Tenant Storage
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[11px] font-mono border-border/60 text-muted-foreground">
                  East US 2 • ZRS Redundant
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Architecture Pipeline Stages */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Stage 1: Edge & Gateway */}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3 relative">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#23ace3] flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    <span>1. Edge & Ingestion</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-card border border-border/50 text-xs">
                      <div className="font-bold text-foreground">Azure Front Door</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">WAF OWASP Top 10 • Anycast CDN</div>
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border/50 text-xs">
                      <div className="font-bold text-foreground">Azure Static Web Apps</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">React 19 SPA • Sub-25ms TTFB</div>
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border/50 text-xs">
                      <div className="font-bold text-foreground">API Management (APIM)</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Tenant Rate Limiting • JWT Auth</div>
                    </div>
                  </div>
                </div>

                {/* Stage 2: Serverless Compute */}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3 relative">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5" />
                    <span>2. Serverless Microservices</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-card border border-border/50 text-xs">
                      <div className="font-bold text-foreground">Azure Functions v4</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Node.js 20 LTS • HTTP Triggers</div>
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border/50 text-xs">
                      <div className="font-bold text-foreground">Tenant Context Middleware</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Claims validation for /tenantId</div>
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border/50 text-xs">
                      <div className="font-bold text-foreground">Queue-Driven Payroll</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Async month-end batch workers</div>
                    </div>
                  </div>
                </div>

                {/* Stage 3: Cognitive AI Tier */}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3 relative">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5" />
                    <span>3. Cognitive AI & RAG</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-card border border-border/50 text-xs">
                      <div className="font-bold text-foreground">Azure AI Search</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Hybrid Vector + Semantic index</div>
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border/50 text-xs">
                      <div className="font-bold text-foreground">Azure OpenAI (GPT-4o)</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Policy RAG Reasoning Engine</div>
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border/50 text-xs">
                      <div className="font-bold text-foreground">Grounded Prompt Guard</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Zero-hallucination constraint</div>
                    </div>
                  </div>
                </div>

                {/* Stage 4: Multi-Tenant Data Store */}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3 relative">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#ef8d46] flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5" />
                    <span>4. Partitioned Data Tier</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-card border border-border/50 text-xs">
                      <div className="font-bold text-foreground">Cosmos DB NoSQL</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Partition Key: /tenantId (Sub-10ms)</div>
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border/50 text-xs">
                      <div className="font-bold text-foreground">Blob Storage Lifecycle</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Hot $\rightarrow$ Cool Tiering (&gt;90d payslips)</div>
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border/50 text-xs">
                      <div className="font-bold text-foreground">Azure Key Vault</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Managed Identities • HSM Secrets</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Infrastructure-as-Code Banner */}
              <div className="p-4 rounded-xl border border-[#23ace3]/30 bg-[#23ace3]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#23ace3]/20 text-[#23ace3]">
                    <Code className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Infrastructure as Code (Azure Bicep)</h5>
                    <p className="text-[11px] text-muted-foreground">
                      Provisioned via <span className="font-mono text-foreground">infra/main.bicep</span> with zone-redundancy and automated lifecycle rules.
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[11px] border-[#23ace3]/40 text-[#23ace3] bg-[#23ace3]/10">
                  Ready for CI/CD
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: LIVE TELEMETRY FLEET */}
        <TabsContent value="telemetry" className="space-y-4 mt-4">
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
                        <span className="text-[10px] text-muted-foreground block font-sans">SLA Uptime</span>
                        <span className="font-bold text-foreground">{svc.uptime}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-sans">P99 Latency</span>
                        <span className="font-bold text-[#23ace3]">{svc.latency}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* TAB 3: MULTI-TENANT SHARDING INSPECTOR */}
        <TabsContent value="sharding" className="space-y-4 mt-4">
          <Card className="border border-border/60 bg-card rounded-2xl p-6 shadow-xs">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-indigo-400" />
                  <span>Azure Cosmos DB Partition Boundary Visualizer (/tenantId)</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cosmos DB distributes tenant collections into physically segregated storage hash rings. Cross-tenant leakage is prevented at the storage engine layer.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Partition 1 */}
                <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs">
                      Partition Key: tenant-kinetic
                    </Badge>
                    <span className="text-xs text-emerald-400 font-mono">Status: Healthy</span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">Alyxra Digital (KINETIC)</h4>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
                    <div className="bg-card p-2 rounded-lg border border-border/40">
                      <span className="text-[10px] text-muted-foreground block font-sans">Active Users</span>
                      <span className="font-bold text-foreground">42</span>
                    </div>
                    <div className="bg-card p-2 rounded-lg border border-border/40">
                      <span className="text-[10px] text-muted-foreground block font-sans">Avg RU/s</span>
                      <span className="font-bold text-[#23ace3]">14.2</span>
                    </div>
                    <div className="bg-card p-2 rounded-lg border border-border/40">
                      <span className="text-[10px] text-muted-foreground block font-sans">Isolation</span>
                      <span className="font-bold text-emerald-400">100%</span>
                    </div>
                  </div>
                </div>

                {/* Partition 2 */}
                <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                      Partition Key: tenant-nova
                    </Badge>
                    <span className="text-xs text-emerald-400 font-mono">Status: Healthy</span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">Nova Systems (NOVA)</h4>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
                    <div className="bg-card p-2 rounded-lg border border-border/40">
                      <span className="text-[10px] text-muted-foreground block font-sans">Active Users</span>
                      <span className="font-bold text-foreground">18</span>
                    </div>
                    <div className="bg-card p-2 rounded-lg border border-border/40">
                      <span className="text-[10px] text-muted-foreground block font-sans">Avg RU/s</span>
                      <span className="font-bold text-[#23ace3]">8.4</span>
                    </div>
                    <div className="bg-card p-2 rounded-lg border border-border/40">
                      <span className="text-[10px] text-muted-foreground block font-sans">Isolation</span>
                      <span className="font-bold text-emerald-400">100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 4: FINOPS & CLOUD ECONOMICS */}
        <TabsContent value="finops" className="space-y-4 mt-4">
          <Card className="border border-border/60 bg-card rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-[#ef8d46]" />
                  <span>Cloud FinOps Architecture & Running Cost Model</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Serverless elasticity and automated tiering drastically reduce operating expenditure per tenant.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-right">
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-semibold">Total Fleet Run Rate</span>
                <span className="text-xl font-extrabold text-foreground">~$194.50 / mo</span>
                <span className="text-[10px] text-muted-foreground block">&lt;$4.00 per active tenant/mo</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Azure Functions</span>
                <div className="text-base font-bold text-foreground">$18.50 / mo</div>
                <p className="text-[11px] text-muted-foreground">Consumption plan scales to 0; 1M free calls included.</p>
              </div>

              <div className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Cosmos DB Autoscale</span>
                <div className="text-base font-bold text-foreground">$65.00 / mo</div>
                <p className="text-[11px] text-muted-foreground">Autoscale drops to 400 RU/s during non-business hours.</p>
              </div>

              <div className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Blob Storage Tiering</span>
                <div className="text-base font-bold text-foreground">$12.00 / mo</div>
                <p className="text-[11px] text-muted-foreground">80% savings achieved by auto-archiving &gt;90d payslips.</p>
              </div>

              <div className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Azure AI Search + OpenAI</span>
                <div className="text-base font-bold text-foreground">$75.00 / mo</div>
                <p className="text-[11px] text-muted-foreground">Cached embeddings reduce repeat inference tokens.</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
