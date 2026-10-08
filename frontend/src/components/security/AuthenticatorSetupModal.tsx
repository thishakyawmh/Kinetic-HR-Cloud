import React, { useState } from 'react'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Smartphone,
  ShieldCheck,
  Lock,
  Copy,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Key,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { Shield, Check, FileKey } from 'lucide-react'

interface AuthenticatorSetupModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string
  userName?: string
  onEnabled?: () => void
}

export const AuthenticatorSetupModal: React.FC<AuthenticatorSetupModalProps> = ({
  isOpen,
  onClose,
  userEmail = 'admin@kinetictech.io',
  userName = 'Admin / Manager',
  onEnabled,
}) => {
  const [copiedKey, setCopiedKey] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  const secretKey = 'KINETIC-2FA-X984-Q772-L104'

  const handleCopyKey = () => {
    navigator.clipboard.writeText(secretKey)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2500)
  }

  const handleVerifyTotp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!totpCode || totpCode.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit code from your Authenticator app.')
      return
    }

    setIsVerifying(true)
    setErrorMsg(null)

    setTimeout(() => {
      setIsVerifying(false)
      setIsSuccess(true)
      setBackupCodes(['K2FA-8812-9014', 'K2FA-4109-8812', 'K2FA-7712-4091', 'K2FA-9901-4412'])
      if (onEnabled) onEnabled()
    }, 1000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogHeader>
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-foreground">
              Setup Authenticator App (2-Step Verification)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pair Microsoft Authenticator or Google Authenticator for Manager & Admin 2FA digital signatures.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {isSuccess ? (
        <div className="py-6 space-y-4 text-center animate-in fade-in">
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-foreground">
              Authenticator App 2FA Successfully Enabled!
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Your account is now protected by hardware TOTP 2-step verification for executive digital signatures and administrative changes.
            </p>
          </div>

          {/* Backup Recovery Codes */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-left space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span className="flex items-center gap-1.5 text-amber-400">
                <FileKey className="h-3.5 w-3.5" />
                Emergency Backup Recovery Codes
              </span>
              <span className="text-[10px] text-muted-foreground">Save securely</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs text-foreground bg-background p-3 rounded-lg border border-border/50">
              {backupCodes.map((code, i) => (
                <div key={i} className="text-center font-bold">{code}</div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={onClose}
              className="w-full bg-[#23ace3] hover:bg-[#1b97ca] text-white font-bold text-xs rounded-xl"
            >
              Done & Close
            </Button>
          </DialogFooter>
        </div>
      ) : (
        <form onSubmit={handleVerifyTotp} className="space-y-5 py-2 text-xs">
          {/* Step 1 & QR Code Scanner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-muted/20 p-4 rounded-2xl border border-border/50">
            {/* SVG QR Code */}
            <div className="sm:col-span-1 flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-xs border border-gray-200">
              <svg viewBox="0 0 100 100" className="w-24 h-24 text-slate-900 fill-current">
                {/* Simulated QR Code SVG pattern */}
                <rect x="5" y="5" width="30" height="30" fill="#0f172a" />
                <rect x="10" y="10" width="20" height="20" fill="#ffffff" />
                <rect x="15" y="15" width="10" height="10" fill="#0f172a" />

                <rect x="65" y="5" width="30" height="30" fill="#0f172a" />
                <rect x="70" y="10" width="20" height="20" fill="#ffffff" />
                <rect x="75" y="15" width="10" height="10" fill="#0f172a" />

                <rect x="5" y="65" width="30" height="30" fill="#0f172a" />
                <rect x="10" y="70" width="20" height="20" fill="#ffffff" />
                <rect x="15" y="75" width="10" height="10" fill="#0f172a" />

                <rect x="40" y="10" width="10" height="10" fill="#0f172a" />
                <rect x="45" y="25" width="10" height="15" fill="#0f172a" />
                <rect x="60" y="40" width="15" height="10" fill="#0f172a" />
                <rect x="40" y="60" width="15" height="15" fill="#0f172a" />
                <rect x="65" y="65" width="10" height="25" fill="#0f172a" />
                <rect x="80" y="75" width="15" height="15" fill="#0f172a" />
              </svg>
              <span className="text-[9px] font-bold text-gray-700 mt-1 uppercase font-mono">Scan in App</span>
            </div>

            {/* Manual Secret Key Copy Box */}
            <div className="sm:col-span-2 space-y-2">
              <span className="font-bold text-foreground block">
                1. Scan QR Code or Enter Secret Key
              </span>
              <p className="text-muted-foreground text-[11px]">
                Open Microsoft Authenticator or Google Authenticator on your mobile phone and scan the QR code.
              </p>

              <div className="flex items-center gap-1.5 pt-1">
                <div className="flex-1 font-mono text-[11px] font-bold bg-background p-2 rounded-lg border border-border/60 text-[#23ace3]">
                  {secretKey}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyKey}
                  className="h-8 px-2.5 text-[11px] gap-1 rounded-lg border-border hover:bg-muted"
                >
                  {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Step 2: Verification TOTP Code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-semibold text-foreground">
              <span>2. Enter 6-Digit Authenticator Code to Pair</span>
              <button
                type="button"
                onClick={() => setTotpCode('654321')}
                className="text-[11px] font-mono text-[#23ace3] hover:underline font-bold cursor-pointer"
              >
                [Test Code: 654321]
              </button>
            </div>

            <Input
              type="text"
              maxLength={6}
              placeholder="654321"
              value={totpCode}
              onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
              className="text-center font-mono text-lg tracking-widest h-12 rounded-xl border-border/80 focus:border-[#23ace3]"
              required
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isVerifying || totpCode.length !== 6}
              className="text-xs bg-[#23ace3] hover:bg-[#1b97ca] text-white font-bold rounded-xl gap-1.5"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Verifying Passkey...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Verify & Enable Authenticator 2FA</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      )}
    </Dialog>
  )
}
