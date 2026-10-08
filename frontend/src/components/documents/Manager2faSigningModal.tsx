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
import { Smartphone, ShieldCheck, Lock, CheckCircle2, AlertCircle, RefreshCw, Key, QrCode } from 'lucide-react'
import { HRDocumentRequest } from '@/types'
import { documentService } from '@/services/documentService'
import { AuthenticatorSetupModal } from '../security/AuthenticatorSetupModal'

interface Manager2faSigningModalProps {
  isOpen: boolean
  onClose: () => void
  docRequest: HRDocumentRequest | null
  onSuccess: (updatedDoc: HRDocumentRequest) => void
}

export const Manager2faSigningModal: React.FC<Manager2faSigningModalProps> = ({
  isOpen,
  onClose,
  docRequest,
  onSuccess,
}) => {
  const [twoFactorMode, setTwoFactorMode] = useState<'sms' | 'totp'>('sms')
  const [otpCode, setOtpCode] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSignedSuccess, setIsSignedSuccess] = useState<boolean>(false)
  const [signedDoc, setSignedDoc] = useState<HRDocumentRequest | null>(null)
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false)

  if (!docRequest) return null

  const handleVerifyAndSign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpCode || otpCode.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit verification code.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const updated = await documentService.verify2faAndSign(docRequest.id, otpCode)
      setSignedDoc(updated)
      setIsSignedSuccess(true)
      setTimeout(() => {
        onSuccess(updated)
      }, 1500)
    } catch (err: any) {
      setErrorMsg(err?.message || '2FA Verification failed. Please check OTP code.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const maskedPhone = docRequest.managerSignatureDetails?.phoneNumberMasked || '+1 (555) ***-8901'

  return (
    <>
      <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Manager 2-Step Verification & Signing
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Apply digital executive signature for #{docRequest.referenceCode}
                </DialogDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSetupModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#23ace3]/10 hover:bg-[#23ace3]/20 text-[#23ace3] border border-[#23ace3]/30 text-[11px] font-bold cursor-pointer"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Setup Authenticator App</span>
            </button>
          </div>
        </DialogHeader>

        {isSignedSuccess && signedDoc ? (
          <div className="py-8 text-center space-y-3 animate-in fade-in">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
            <div className="text-base font-extrabold text-foreground">
              2FA Verification & Signature Applied!
            </div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Cryptographic digital signature applied by {signedDoc.managerSignatureDetails?.signedBy}
            </p>
            <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-[11px] font-mono text-[#23ace3] max-w-xs mx-auto">
              Hash: {signedDoc.managerSignatureDetails?.signatureHash}
            </div>
          </div>
        ) : (
          <form onSubmit={handleVerifyAndSign} className="space-y-4 py-3">
            {/* 2FA Method Selector Tabs */}
            <div className="flex rounded-xl bg-muted/50 p-1 border border-border/50 text-xs">
              <button
                type="button"
                onClick={() => {
                  setTwoFactorMode('sms')
                  setOtpCode('')
                }}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  twoFactorMode === 'sms'
                    ? 'bg-[#23ace3] text-white shadow-xs'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Mobile SMS OTP</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTwoFactorMode('totp')
                  setOtpCode('')
                }}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  twoFactorMode === 'totp'
                    ? 'bg-[#23ace3] text-white shadow-xs'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Key className="h-3.5 w-3.5" />
                <span>Authenticator App (TOTP)</span>
              </button>
            </div>

            {/* Method Details Box */}
            {twoFactorMode === 'sms' ? (
              <div className="p-3.5 rounded-2xl bg-[#23ace3]/10 border border-[#23ace3]/20 space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold text-foreground">
                  <span className="flex items-center gap-1.5 text-[#23ace3]">
                    <ShieldCheck className="h-4 w-4" />
                    SMS OTP Code Dispatched
                  </span>
                  <span className="font-mono text-muted-foreground">{maskedPhone}</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  A 6-digit security passkey has been sent via SMS to your registered manager phone.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-[#23ace3]/10 border border-[#23ace3]/20 space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold text-foreground">
                  <span className="flex items-center gap-1.5 text-[#23ace3]">
                    <Key className="h-4 w-4" />
                    Authenticator App TOTP Passkey
                  </span>
                  <span className="font-mono text-emerald-400">Pairing Active</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Open Microsoft Authenticator or Google Authenticator on your mobile device to view your live 6-digit passkey.
                </p>
              </div>
            )}

            {/* Quick Auto-Fill Test Hint */}
            <div className="flex items-center justify-between text-[11px] px-1">
              <span className="text-muted-foreground">Enter 6-Digit Passkey</span>
              <button
                type="button"
                onClick={() => setOtpCode(twoFactorMode === 'sms' ? '489201' : '654321')}
                className="text-[#23ace3] font-mono hover:underline font-bold cursor-pointer"
              >
                [Test Code: {twoFactorMode === 'sms' ? '489201' : '654321'}]
              </button>
            </div>

            {/* OTP Code Input */}
            <div className="space-y-1">
              <Input
                type="text"
                maxLength={6}
                placeholder={twoFactorMode === 'sms' ? '489201' : '654321'}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
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

            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
              <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>Digital signature uses 256-bit PKCS#7 cryptography timestamped with NIST time servers.</span>
            </div>

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
                disabled={isSubmitting || otpCode.length !== 6}
                className="text-xs bg-[#23ace3] hover:bg-[#1b97ca] text-white font-bold rounded-xl gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Verifying 2FA...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Verify 2FA & Sign Document</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>

      {/* Authenticator App Setup Modal */}
      <AuthenticatorSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        userEmail="david.wilson@kinetictech.io"
        userName="David Wilson (Engineering Director)"
        onEnabled={() => {
          setTwoFactorMode('totp')
        }}
      />
    </>
  )
}
