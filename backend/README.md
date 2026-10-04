# Kinetic HR Cloud — Azure Functions Backend

This is the multi-tenant Azure Functions backend for Kinetic HR Cloud, designed to provide data isolation across organizations using **Azure Cosmos DB** and **Azure Blob Storage**.

---

## 1. Prerequisites

- [Node.js 20+ LTS](https://nodejs.org/)
- [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local) (v4)
  ```bash
  npm install -g azure-functions-core-tools@4 --unsafe-perm true
  ```
- An active Azure Subscription with:
  - **Azure Cosmos DB** (NoSQL API) with partition key `/tenantId`
  - **Azure Storage Account** with a container named `tenants`

---

## 2. Local Configuration

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Copy the settings template:
   ```bash
   cp local.settings.json.example local.settings.json
   ```

3. Fill in your Azure credentials in `local.settings.json`:
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "UseDevelopmentStorage=true",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "COSMOS_DB_ENDPOINT": "https://<your-cosmos-account>.documents.azure.com:443/",
       "COSMOS_DB_KEY": "<your-cosmos-primary-key>",
       "COSMOS_DB_DATABASE": "KineticHR",
       "BLOB_STORAGE_CONNECTION_STRING": "DefaultEndpointsProtocol=https;AccountName=<storage>;AccountKey=<key>;EndpointSuffix=core.windows.net",
       "BLOB_CONTAINER_TENANTS": "tenants",
       "JWT_SECRET": "your-256bit-secret-key-here"
     },
     "Host": {
       "CORS": "*"
     }
   }
   ```

---

## 3. Cosmos DB Multi-Tenant Schema Setup

In your Azure Cosmos DB database (`KineticHR`), create the following containers, **all configured with Partition Key: `/tenantId`**:

1. `organizations` (Partition Key: `/id` or `/tenantId`)
2. `users` (Partition Key: `/tenantId`)
3. `leaves` (Partition Key: `/tenantId`)
4. `leave_balances` (Partition Key: `/tenantId`)
5. `payslips` (Partition Key: `/tenantId`)
6. `policies` (Partition Key: `/tenantId`)
7. `audit_logs` (Partition Key: `/tenantId`)

---

## 4. Run Locally

```bash
npm run build
npm start
```

The endpoints will be live at:
```
http://localhost:7071/api/auth/organization
http://localhost:7071/api/auth/login
http://localhost:7071/api/leaves
http://localhost:7071/api/leaves/balances
http://localhost:7071/api/employees
http://localhost:7071/api/payroll/payslips
http://localhost:7071/api/policies
```

---

## 5. Connecting Frontend

In your root `.env`:
```env
VITE_API_BASE_URL="http://localhost:7071/api"
VITE_USE_MOCK_SERVICES="false"
```
Once flipped to `false`, the frontend immediately talks to your live Azure backend.
