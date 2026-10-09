import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'

// Public Landing & Auth
import { LandingPage } from '@/pages/public/LandingPage'
import { Login } from '@/pages/auth/Login'

// Employee Pages
import { EmployeeWorkspace } from '@/pages/employee/EmployeeWorkspace'
import { EmployeeDashboard } from '@/pages/employee/EmployeeDashboard'
import { EmployeeLeave } from '@/pages/employee/EmployeeLeave'
import { EmployeeLeaveApply } from '@/pages/employee/EmployeeLeaveApply'
import { EmployeePayslips } from '@/pages/employee/EmployeePayslips'
import { EmployeePayslipDetail } from '@/pages/employee/EmployeePayslipDetail'
import { EmployeeRequests } from '@/pages/employee/EmployeeRequests'
import { EmployeeAssistant } from '@/pages/employee/EmployeeAssistant'
import { EmployeePolicies } from '@/pages/employee/EmployeePolicies'
import { ProfilePage } from '@/pages/profile/ProfilePage'

// Manager Pages
import { ManagerDashboard } from '@/pages/manager/ManagerDashboard'
import { ManagerTeam } from '@/pages/manager/ManagerTeam'
import { ManagerApprovals } from '@/pages/manager/ManagerApprovals'
import { ManagerAssistant } from '@/pages/manager/ManagerAssistant'
import { ManagerWorkforce } from '@/pages/manager/ManagerWorkforce'
import { ManagerRoles } from '@/pages/manager/ManagerRoles'

// Admin Pages
import { AdminAssistant } from '@/pages/admin/AdminAssistant'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminEmployees } from '@/pages/admin/AdminEmployees'
import { AdminDepartments } from '@/pages/admin/AdminDepartments'
import { AdminBranches } from '@/pages/admin/AdminBranches'
import { AdminCreateWorkspace } from '@/pages/admin/AdminCreateWorkspace'
import { AdminLeaveTypes } from '@/pages/admin/AdminLeaveTypes'
import { AdminPolicies } from '@/pages/admin/AdminPolicies'
import { AdminHolidays } from '@/pages/admin/AdminHolidays'
import { AdminApprovals } from '@/pages/admin/AdminApprovals'
import { AdminAuditLogs } from '@/pages/admin/AdminAuditLogs'
import { AdminAIUsage } from '@/pages/admin/AdminAIUsage'
import { AdminIntegrations } from '@/pages/admin/AdminIntegrations'
import { AdminSettings } from '@/pages/admin/AdminSettings'
// Platform Admin Pages (§6 & §49)
import { PlatformDashboard } from '@/pages/platform/PlatformDashboard'
import { PlatformOrganizations } from '@/pages/platform/PlatformOrganizations'
import { PlatformSubscriptions } from '@/pages/platform/PlatformSubscriptions'
import { PlatformSystemHealth } from '@/pages/platform/PlatformSystemHealth'

const RootRedirect: React.FC = () => {
  const { role, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (role === 'platform_admin') return <Navigate to="/platform/dashboard" replace />
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (role === 'manager') return <Navigate to="/manager/dashboard" replace />
  return <Navigate to="/employee/dashboard" replace />
}

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/login/:companyId" element={<Login />} />

      {/* Main Authenticated Application Layout */}
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<RootRedirect />} />

        {/* Employee Experience (Kinetic AI-First Workspace) */}
        <Route path="/employee/dashboard" element={<EmployeeWorkspace />} />
        <Route path="/employee/assistant" element={<EmployeeWorkspace />} />
        <Route path="/employee/overview" element={<EmployeeDashboard />} />
        <Route path="/employee/leave" element={<EmployeeLeave />} />
        <Route path="/employee/leave/apply" element={<EmployeeLeaveApply />} />
        <Route path="/employee/payslips" element={<EmployeePayslips />} />
        <Route path="/employee/payslips/:id" element={<EmployeePayslipDetail />} />
        <Route path="/employee/requests" element={<EmployeeRequests />} />
        <Route path="/employee/policies" element={<EmployeePolicies />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/employee/profile" element={<ProfilePage />} />

        {/* Manager Experience */}
        <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        <Route path="/manager/workforce" element={<ManagerWorkforce />} />
        <Route path="/manager/roles" element={<ManagerRoles />} />
        <Route path="/manager/team" element={<ManagerTeam />} />
        <Route path="/manager/approvals" element={<ManagerApprovals />} />
        <Route path="/manager/assistant" element={<ManagerAssistant />} />

        {/* HR Administrator Experience */}
        <Route path="/admin/assistant" element={<AdminAssistant />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/workforce" element={<AdminEmployees />} />
        <Route path="/admin/workforce/create-workspace" element={<AdminCreateWorkspace />} />
        <Route path="/admin/employees" element={<AdminEmployees />} />
        <Route path="/admin/departments" element={<AdminDepartments />} />
        <Route path="/admin/branches" element={<AdminBranches />} />
        <Route path="/admin/leave-types" element={<AdminLeaveTypes />} />
        <Route path="/admin/policies" element={<AdminPolicies />} />
        <Route path="/admin/holidays" element={<AdminHolidays />} />
        <Route path="/admin/approvals" element={<AdminApprovals />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
        <Route path="/admin/ai-usage" element={<AdminAIUsage />} />
        <Route path="/admin/integrations" element={<AdminIntegrations />} />
        <Route path="/admin/settings" element={<AdminSettings />} />

        {/* Kinetic Platform Administrator Experience (§6 & §49) */}
        <Route path="/platform/dashboard" element={<PlatformDashboard />} />
        <Route path="/platform/organizations" element={<PlatformOrganizations />} />
        <Route path="/platform/subscriptions" element={<PlatformSubscriptions />} />
        <Route path="/platform/system-health" element={<PlatformSystemHealth />} />
        <Route path="/platform/audit-logs" element={<AdminAuditLogs />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
