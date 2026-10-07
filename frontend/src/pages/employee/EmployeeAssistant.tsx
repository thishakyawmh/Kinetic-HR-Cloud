import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { AIChatPanel } from '@/components/ai/AIChatPanel'

export const EmployeeAssistant: React.FC = () => {
  const [searchParams] = useSearchParams()
  const initialPrompt = searchParams.get('prompt') || undefined
  const payslipId = searchParams.get('payslipId') || undefined

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kinetic HR AI Assistant"
        subtitle="Your intelligent cloud layer for company policies, emergency leave navigation, and payroll clarification."
      />

      {/* Main Conversational Workspace */}
      <AIChatPanel initialPrompt={initialPrompt} payslipContextId={payslipId} />
    </div>
  )
}
