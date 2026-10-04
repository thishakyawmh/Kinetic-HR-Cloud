import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { AIChatPanel } from '@/components/ai/AIChatPanel'
import { Badge } from '@/components/ui/badge'
import { Bot, Sparkles, ShieldCheck } from 'lucide-react'

export const EmployeeAssistant: React.FC = () => {
  const [searchParams] = useSearchParams()
  const initialPrompt = searchParams.get('prompt') || undefined
  const payslipId = searchParams.get('payslipId') || undefined

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kinetic HR AI Assistant"
        subtitle="Your intelligent cloud layer for company policies, emergency leave navigation, and payroll clarification."
        badge={
          <Badge variant="ai" className="gap-1 text-xs">
            <Sparkles className="h-3 w-3" />
            Azure Foundry Agent Active
          </Badge>
        }
      >
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200">
          <ShieldCheck className="h-4 w-4 text-sky-600" />
          <span>Tenant Data Isolation & RAG Grounded</span>
        </div>
      </PageHeader>

      {/* Main Conversational Workspace */}
      <AIChatPanel initialPrompt={initialPrompt} payslipContextId={payslipId} />
    </div>
  )
}
