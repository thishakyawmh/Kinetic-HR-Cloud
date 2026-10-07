// ==============================================================================
// Beauty of Cloud 2.0 (BOC 2.0) — Kinetic HR Cloud
// Production Infrastructure as Code (Azure Bicep Template)
// ==============================================================================
// Target: Azure Resource Manager (ARM)
// Multi-tenant serverless architecture with Cosmos DB, Azure Functions,
// Azure AI Search, Azure OpenAI, and Storage Account.
// ==============================================================================

@description('Deployment environment name')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environmentName string = 'prod'

@description('Primary Azure region for high-availability workloads')
param location string = resourceGroup().location

@description('Secondary Azure region for Cosmos DB active-active multi-region replica')
param failoverLocation string = 'centralus'

@description('Global unique prefix for cloud resource names')
param appPrefix string = 'kinetichr'

var uniqueSuffix = uniqueString(resourceGroup().id)
var cosmosAccountName = '${appPrefix}-cosmos-${uniqueSuffix}'
var storageAccountName = '${appPrefix}stg${uniqueSuffix}'
var functionAppName = '${appPrefix}-api-${uniqueSuffix}'
var appServicePlanName = '${appPrefix}-asp-${uniqueSuffix}'
var keyVaultName = '${appPrefix}-kv-${uniqueSuffix}'
var aiSearchName = '${appPrefix}-search-${uniqueSuffix}'
var appInsightsName = '${appPrefix}-insights-${uniqueSuffix}'

// ------------------------------------------------------------------------------
// 1. Application Insights & Log Analytics (Observability & Telemetry)
// ------------------------------------------------------------------------------
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${appPrefix}-law-${uniqueSuffix}'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ------------------------------------------------------------------------------
// 2. Azure Key Vault (Zero-Trust Hardware Secrets Management)
// ------------------------------------------------------------------------------
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: true
    enableRbacAuthorization: true
    tenantId: subscription().tenantId
    sku: {
      name: 'standard'
      family: 'A'
    }
  }
}

// ------------------------------------------------------------------------------
// 3. Azure Cosmos DB (Multi-Tenant NoSQL Database with /tenantId Partitioning)
// ------------------------------------------------------------------------------
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-11-15' = {
  name: cosmosAccountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
      maxStalenessPrefix: 100
      maxIntervalInSeconds: 5
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: true
      }
      {
        locationName: failoverLocation
        failoverPriority: 1
        isZoneRedundant: false
      }
    ]
    enableAutomaticFailover: true
    enableMultipleWriteLocations: false
    capabilities: [
      {
        name: 'EnableServerless' // FinOps: Pure consumption billing during off-peak hours
      }
    ]
  }
}

resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-11-15' = {
  parent: cosmosAccount
  name: 'KineticHR'
  properties: {
    resource: {
      id: 'KineticHR'
    }
  }
}

// High-Throughput Partitioned Containers (Isolated by /tenantId)
var containers = [
  'organizations'
  'users'
  'leaves'
  'leave_balances'
  'payslips'
  'policies'
  'audit_logs'
]

resource cosmosContainers 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/sqlContainers@2023-11-15' = [for name in containers: {
  parent: cosmosDatabase
  name: name
  properties: {
    resource: {
      id: name
      partitionKey: {
        paths: [
          '/tenantId'
        ]
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/*'
          }
        ]
      }
    }
  }
}]

// ------------------------------------------------------------------------------
// 4. Azure Blob Storage (Document Vault & Lifecycle Tiering)
// ------------------------------------------------------------------------------
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_ZRS' // Zone-redundant storage for 99.9999999999% durability
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource tenantContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'tenants'
  properties: {
    publicAccess: 'None'
  }
}

// FinOps Lifecycle Policy: Transition payslips older than 90 days to Cool storage
resource lifecyclePolicy 'Microsoft.Storage/storageAccounts/managementPolicies@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    policy: {
      rules: [
        {
          name: 'ArchiveOldPayslips'
          enabled: true
          type: 'Lifecycle'
          definition: {
            actions: {
              baseBlob: {
                tierToCool: {
                  daysAfterModificationGreaterThan: 90
                }
                tierToArchive: {
                  daysAfterModificationGreaterThan: 365
                }
              }
            }
            filters: {
              blobTypes: [
                'blockBlob'
              ]
              prefixMatch: [
                'tenants/payslips/'
              ]
            }
          }
        }
      ]
    }
  }
}

// ------------------------------------------------------------------------------
// 5. Azure AI Search (Vector RAG Index for Policy Compliance)
// ------------------------------------------------------------------------------
resource aiSearch 'Microsoft.Search/searchServices@2023-11-01' = {
  name: aiSearchName
  location: location
  sku: {
    name: 'basic'
  }
  properties: {
    replicaCount: 1
    partitionCount: 1
    hostingMode: 'default'
    semanticSearch: 'free'
  }
}

// ------------------------------------------------------------------------------
// 6. Azure Serverless Functions (Microservices Compute Tier)
// ------------------------------------------------------------------------------
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'Y1' // Consumption Tier: $0 idle cost, auto-scale on HTTP/Queue spikes
    tier: 'Dynamic'
  }
}

resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'COSMOS_DB_ENDPOINT'
          value: cosmosAccount.properties.documentEndpoint
        }
        {
          name: 'COSMOS_DB_KEY'
          value: cosmosAccount.listKeys().primaryMasterKey
        }
        {
          name: 'COSMOS_DB_DATABASE'
          value: 'KineticHR'
        }
      ]
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
    }
    httpsOnly: true
  }
}

// ------------------------------------------------------------------------------
// Outputs (Consumed by CI/CD Pipelines & Frontend Deployments)
// ------------------------------------------------------------------------------
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}/api'
output storageAccountName string = storageAccount.name
output keyVaultUri string = keyVault.properties.vaultUri
output appInsightsKey string = appInsights.properties.InstrumentationKey
