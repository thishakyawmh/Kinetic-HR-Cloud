import { AuthenticatedUser } from '../middleware/auth'

const SIGNATURE_REQUIRED_TYPES = [
  'Employment Verification Letter',
  'Salary Certificate',
  'Bonafide Employee Letter (Consulate / Visa)',
  'Salary & Compensation Certificate',
]

export function requiresManagerSignature(documentType: string): boolean {
  const lower = documentType.toLowerCase()
  return SIGNATURE_REQUIRED_TYPES.some(t => lower.includes(t.toLowerCase().split(' ')[0]))
}

export function isValidOtpCode(otpCode: unknown): boolean {
  return /^\d{6}$/.test(String(otpCode ?? '').trim())
}

export function buildGeneratedDocumentContent(
  user: AuthenticatedUser,
  tenantId: string,
  documentType: string,
  purpose: string,
  referenceCode: string
): string {
  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return `OFFICIAL ${documentType.toUpperCase()}
Reference Code: ${referenceCode}
Date: ${formattedDate}

To Whom It May Concern:

This letter serves as official verification that ${user.name} (Employee ID: ${user.employeeNumber}) is employed full-time with Kinetic HR Cloud (${user.department} Department) as a ${user.jobTitle}.

Purpose: ${purpose}

This document has been verified by the Kinetic Autonomous AI Engine under corporate policy compliance.

Tenant ID: ${tenantId}
Issued via Kinetic HR Cloud Enterprise Portal.`
}

export function buildManagerSignatureDetails(signer: AuthenticatedUser, signedAt: string) {
  const signatureHash = `SIG-2FA-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`
  const phoneNumberMasked = signer.phone
    ? signer.phone.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2')
    : '+94 77 ***-8901'

  return {
    signedBy: signer.name,
    signedById: signer.id,
    signedAt,
    mobile2faVerified: true,
    phoneNumberMasked,
    signatureHash,
  }
}
