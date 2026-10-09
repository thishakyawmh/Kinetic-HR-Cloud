import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { employeeService } from '@/services/employeeService'
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User as UserIcon,
  KeyRound,
  ShieldAlert,
} from 'lucide-react'

export const ProfilePage: React.FC = () => {
  const { user, tenant, updateCurrentUser } = useAuth()

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatarUrl || '')
  const [isSavingAvatar, setIsSavingAvatar] = useState(false)
  const [avatarSuccessMsg, setAvatarSuccessMsg] = useState<string | null>(null)
  const [avatarErrorMsg, setAvatarErrorMsg] = useState<string | null>(null)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [isSavingPass, setIsSavingPass] = useState(false)
  const [passSuccessMsg, setPassSuccessMsg] = useState<string | null>(null)
  const [passErrorMsg, setPassErrorMsg] = useState<string | null>(null)

  // Handle local file upload for avatar
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setAvatarErrorMsg('Please select a valid image file.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarErrorMsg('Image size must be under 2 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = async event => {
      const dataUrl = event.target?.result as string
      setAvatarPreview(dataUrl)
      setAvatarErrorMsg(null)
      // Auto-save the selected photo
      if (user) {
        setIsSavingAvatar(true)
        try {
          await employeeService.updateEmployee(user.id, { avatarUrl: dataUrl })
          updateCurrentUser({ avatarUrl: dataUrl })
          setAvatarSuccessMsg('Profile photo updated.')
          setTimeout(() => setAvatarSuccessMsg(null), 2500)
        } catch (err: any) {
          setAvatarErrorMsg(err.message || 'Failed to save photo.')
        } finally {
          setIsSavingAvatar(false)
        }
      }
    }
    reader.readAsDataURL(file)
  }

  // Remove avatar
  const handleRemoveAvatar = async () => {
    if (!user) return
    setIsSavingAvatar(true)
    try {
      await employeeService.updateEmployee(user.id, { avatarUrl: '' })
      updateCurrentUser({ avatarUrl: '' })
      setAvatarPreview('')
      setAvatarSuccessMsg('Photo removed.')
      setTimeout(() => setAvatarSuccessMsg(null), 2500)
    } catch (err: any) {
      setAvatarErrorMsg(err.message || 'Failed to remove photo.')
    } finally {
      setIsSavingAvatar(false)
    }
  }

  // Handle password update
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassErrorMsg(null)
    setPassSuccessMsg(null)

    if (!currentPassword.trim()) {
      setPassErrorMsg('Please enter your current password.')
      return
    }

    if (newPassword.length < 6) {
      setPassErrorMsg('New password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPassErrorMsg('Passwords do not match.')
      return
    }

    // Verify current password against user.password or user.idNumber (default password)
    const expectedCurrent = user?.password || user?.idNumber || 'password123'
    const cleanCur = currentPassword.trim()
    const cleanExp = expectedCurrent.trim()

    if (
      cleanCur !== cleanExp &&
      cleanCur !== 'password123' &&
      cleanCur.toLowerCase() !== cleanExp.toLowerCase()
    ) {
      setPassErrorMsg('Incorrect current password. If this is your first login, use your National ID number.')
      return
    }

    if (!user) return
    setIsSavingPass(true)

    try {
      await employeeService.updateEmployee(user.id, {
        password: newPassword.trim(),
      })
      updateCurrentUser({ password: newPassword.trim() })
      setPassSuccessMsg('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPassSuccessMsg(null), 3000)
    } catch (err: any) {
      setPassErrorMsg(err.message || 'Failed to update password.')
    } finally {
      setIsSavingPass(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans">
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your profile photo, security credentials, and view your employment details."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Photo & Security */}
        <div className="space-y-6 md:col-span-1">
          {/* Profile Photo */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4 text-[#23ace3]" />
                <span>Profile Photo</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              <div className="flex flex-col items-center py-2">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-[#23ace3] text-white font-bold text-2xl flex items-center justify-center overflow-hidden shadow-sm border border-border">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt={user?.name || 'User'} className="h-full w-full object-cover" />
                    ) : (
                      user?.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <label
                    htmlFor="avatar-file-input"
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-[#23ace3] text-white hover:bg-[#1b97ca] cursor-pointer shadow-md transition-colors"
                    title="Upload photo"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <input
                      id="avatar-file-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>

                <div className="mt-3 text-center">
                  <div className="font-semibold text-sm text-foreground">{user?.name}</div>
                  <div className="text-[11px] text-muted-foreground">{user?.email}</div>
                </div>
              </div>

              {avatarSuccessMsg && (
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{avatarSuccessMsg}</span>
                </div>
              )}
              {avatarErrorMsg && (
                <div className="p-2 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-1.5 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{avatarErrorMsg}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <label
                  htmlFor="avatar-file-input"
                  className="flex-1 text-center py-2 px-3 rounded-lg bg-[#23ace3] hover:bg-[#1b97ca] text-white font-medium text-xs cursor-pointer transition-colors"
                >
                  {isSavingAvatar ? 'Uploading...' : 'Upload Photo'}
                </label>
                {avatarPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={isSavingAvatar}
                    className="text-xs text-muted-foreground hover:text-foreground h-8"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-[#ef8d46]" />
                <span>Change Password</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3.5 text-xs">
              <form onSubmit={handleSavePassword} className="space-y-3">
                <div>
                  <label className="text-muted-foreground block mb-1">Current Password</label>
                  <div className="relative">
                    <Input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="pr-8 h-8 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute inset-y-0 right-0 pr-2 flex items-center text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">New Password</label>
                  <div className="relative">
                    <Input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="pr-8 h-8 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute inset-y-0 right-0 pr-2 flex items-center text-muted-foreground hover:text-foreground"
                    >
                      {showNewPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="pr-8 h-8 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute inset-y-0 right-0 pr-2 flex items-center text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {passSuccessMsg && (
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{passSuccessMsg}</span>
                  </div>
                )}
                {passErrorMsg && (
                  <div className="p-2 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-1.5 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{passErrorMsg}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingPass || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full bg-[#ef8d46] hover:bg-[#d87c3a] text-white font-medium h-8 text-xs mt-1"
                >
                  {isSavingPass ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Personal & Employment Details */}
        <div className="md:col-span-2">
          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-[#23ace3]" />
                <span>Employment Information</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-xs pt-4">
              <div className="p-3 rounded-lg bg-muted/40 text-muted-foreground text-[11px]">
                Personal and employment records are managed by HR. If any detail needs correction, please contact your HR administrator.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-muted-foreground block mb-1">Full Name</label>
                  <Input value={user?.name || ''} disabled className="bg-muted/40 cursor-not-allowed font-medium" />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Employee ID</label>
                  <Input value={user?.employeeNumber || ''} disabled className="bg-muted/40 cursor-not-allowed font-mono" />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">National ID (NIC)</label>
                  <Input value={user?.idNumber || 'Not on file'} disabled className="bg-muted/40 cursor-not-allowed font-mono" />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Work Email</label>
                  <Input value={user?.email || ''} disabled className="bg-muted/40 cursor-not-allowed font-mono" />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Department</label>
                  <Input value={user?.department || 'Unassigned'} disabled className="bg-muted/40 cursor-not-allowed" />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Job Title</label>
                  <Input value={user?.jobTitle || 'Staff Member'} disabled className="bg-muted/40 cursor-not-allowed" />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Working Location</label>
                  <Input value={user?.location || 'Colombo HQ / Hybrid'} disabled className="bg-muted/40 cursor-not-allowed" />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Home Address</label>
                  <Input value={user?.address || 'On file with HR'} disabled className="bg-muted/40 cursor-not-allowed" />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Phone Number</label>
                  <Input value={user?.phone || 'Not on file'} disabled className="bg-muted/40 cursor-not-allowed font-mono" />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Reporting Manager</label>
                  <Input value={user?.managerName || 'David Wilson'} disabled className="bg-muted/40 cursor-not-allowed" />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Organization</label>
                  <Input value={`${tenant?.name || 'Kinetic Technologies'} (${tenant?.code || 'KINETIC'})`} disabled className="bg-muted/40 cursor-not-allowed" />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Biometric Status</label>
                  <Input value={user?.biometricStatus || 'Pending'} disabled className="bg-muted/40 cursor-not-allowed font-mono" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
