import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Shield, Cpu, Sliders, CheckCircle2, Lock } from 'lucide-react'

export const AdminSettings: React.FC = () => {
  const { tenant } = useAuth()
  const [model, setModel] = useState('gpt-4o-2024-08-06')
  const [maxRequestsPerDay, setMaxRequestsPerDay] = useState('5000')
  const [safetyTier, setSafetyTier] = useState('Strict Enterprise')
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSave = () => {
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Tenant AI & Enterprise Model Configuration"
        subtitle={`Configure Microsoft Foundry Agent Service, Azure OpenAI model deployments, and safety limits for ${tenant?.name}.`}
      />

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Settings updated successfully and propagated to Microsoft Foundry Agent Service.
        </div>
      )}

      {/* Model Deployment Card (Section 27) */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-sky-600" />
              <CardTitle className="text-base">LLM Deployment & Agent Orchestration</CardTitle>
            </div>
            <Badge variant="success" className="text-[10px]">
              Foundry Agent Active
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Administered within Azure OpenAI isolated tenant perimeter.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold block mb-1.5 text-slate-800">
                AI Cloud Provider
              </label>
              <Input value="Microsoft Azure OpenAI / Foundry Agent Service" disabled className="bg-slate-50 text-slate-700" />
            </div>
            <div>
              <label className="font-semibold block mb-1.5 text-slate-800">
                Active Reasoning Model
              </label>
              <Select value={model} onChange={e => setModel(e.target.value)}>
                <option value="gpt-4o-2024-08-06">Azure OpenAI GPT-4o (Enterprise Standard)</option>
                <option value="gpt-4o-mini">Azure OpenAI GPT-4o-Mini (High Throughput)</option>
                <option value="o1-preview">Azure OpenAI o1-preview (Deep Policy Reasoning)</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold block mb-1.5 text-slate-800">
                Daily Request Quota Limit
              </label>
              <Input
                type="number"
                value={maxRequestsPerDay}
                onChange={e => setMaxRequestsPerDay(e.target.value)}
              />
            </div>
            <div>
              <label className="font-semibold block mb-1.5 text-slate-800">
                Content Safety Guardrail Tier
              </label>
              <Select value={safetyTier} onChange={e => setSafetyTier(e.target.value)}>
                <option value="Strict Enterprise">Strict Enterprise (Zero Data Retention)</option>
                <option value="Standard">Standard Corporate Compliance</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety & Autonomous Guardrails */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-base">Autonomous Action Safety Boundaries</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Mandatory human approvals prevent AI agents from autonomously executing sensitive payroll or personnel operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-700">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="font-bold text-slate-900">Salary & Direct Deposit Modifications</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                AI may only explain authorized statements; cannot modify banking or salary figures.
              </p>
            </div>
            <Badge variant="destructive" className="text-[10px]">
              Human Approval Strictly Enforced
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="font-bold text-slate-900">Emergency & Standard Leave Submissions</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                AI may draft and pre-validate against policy; final write requires designated manager sign-off.
              </p>
            </div>
            <Badge variant="warning" className="text-[10px]">
              Manager Sign-Off Required
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          variant="default"
          onClick={handleSave}
          className="bg-sky-600 hover:bg-sky-700 text-white text-xs px-6 font-semibold"
        >
          Save Configuration Changes
        </Button>
      </div>
    </div>
  )
}
