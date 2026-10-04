import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from '@azure/storage-blob'

let blobServiceClient: BlobServiceClient | null = null

export function getBlobServiceClient(): BlobServiceClient {
  if (blobServiceClient) return blobServiceClient

  const connectionString = process.env.BLOB_STORAGE_CONNECTION_STRING
  if (!connectionString) {
    throw new Error('Azure Blob Storage configuration missing: BLOB_STORAGE_CONNECTION_STRING must be set.')
  }

  blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
  return blobServiceClient
}

/**
 * Generates a secure, time-expiring SAS URL for uploading or downloading tenant files
 * (e.g. payslips, policy PDFs, employee documents).
 */
export async function generateTenantBlobSasUrl(
  tenantId: string,
  folder: 'payslips' | 'policies' | 'avatars',
  fileName: string,
  permission: 'r' | 'w' = 'r',
  expiresInMinutes = 30
): Promise<string> {
  const containerName = process.env.BLOB_CONTAINER_TENANTS || 'tenants'
  const blobPath = `${tenantId}/${folder}/${fileName}`
  const serviceClient = getBlobServiceClient()
  const containerClient = serviceClient.getContainerClient(containerName)
  const blobClient = containerClient.getBlobClient(blobPath)

  // Try extracting account name & key for SAS generation
  const connParts = (process.env.BLOB_STORAGE_CONNECTION_STRING || '').split(';')
  const accountName = connParts.find((p: string) => p.startsWith('AccountName='))?.split('=')[1]
  const accountKey = connParts.find((p: string) => p.startsWith('AccountKey='))?.split('=')[1]

  if (!accountName || !accountKey) {
    // If running in local emulator or managed identity without key, return blob URL directly
    return blobClient.url
  }

  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)
  const permissions = new BlobSASPermissions()
  if (permission === 'r') permissions.read = true
  if (permission === 'w') {
    permissions.write = true
    permissions.create = true
  }

  const expiresOn = new Date(Date.now() + expiresInMinutes * 60 * 1000)

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName: blobPath,
      permissions,
      expiresOn,
    },
    sharedKeyCredential
  ).toString()

  return `${blobClient.url}?${sasToken}`
}
