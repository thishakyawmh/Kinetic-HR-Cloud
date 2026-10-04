import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { AIChatPanel } from '@/components/ai/AIChatPanel'
import { Badge } from '@/components/ui/badge'
import { Bot, Sparkles, ShieldCheck } from 'lucide-react'

export const ManagerAssistant: React.FC = () => {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Manager AI Co-Pilot"
        subtitle="Intelligent decision support for team approvals, coverage risk analysis, and HR compliance policies."
        badge={
          <Badge variant="ai" className="gap-1 text-xs">
            <Sparkles className="h-3 w-3" />
            Supervisory Intelligence Active
          </Badge>
        }
      >
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200">
          <ShieldCheck className="h-4 w-4 text-indigo-600" />
          <span>Management Policy Scope</span>
        </div>
      </PageHeader>

      <AIChatPanel initialPrompt="Summarize any coverage risks for the Engineering team for next week." />
    </div>
  )
}
