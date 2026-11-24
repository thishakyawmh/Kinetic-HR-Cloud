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
       "JWT_SECRET": "<generate-a-random-secret-of-at-least-32-characters>",
       "JWT_ISSUER": "kinetic-hr-cloud",
       "ENABLE_MOCK_AUTH": "false"
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


## Authentication security

The API uses signed HS256 JWTs. Configure `JWT_SECRET` with a unique random value of at least 32 characters and keep it in Azure Function App settings or a local-only `local.settings.json`. Never commit the real value. Configure `JWT_ISSUER` consistently for the environment.

Mock identity fallback is disabled by default. It can only be enabled with `ENABLE_MOCK_AUTH=true` outside production, and must remain disabled in all deployed environments. Invalid JWTs are rejected; token text is never interpreted as an identity in production.

Employee-facing leave and payslip reads are restricted to the authenticated employee. Managers can review their direct reports' leave requests, while payroll generation and payment-setting changes require an administrator role.


## Authentication and authorization hardening

- Set `JWT_SECRET` to a unique random value of at least 32 characters. Generate one locally with `openssl rand -base64 48`; store it only in local settings or Azure Function App settings. The checked-in example intentionally leaves it blank.
- `JWT_ISSUER` defaults to `kinetic-hr-cloud` and is included in and verified against every signed token.
- Invalid tokens are rejected. Mock identity fallback is disabled unless `ENABLE_MOCK_AUTH=true` and the environment is not production. Local demo login also requires a configured `MOCK_AUTH_PASSWORD`. Platform-admin mock login is disabled in production; a real platform identity provider must be integrated.
- Real employee login requires a bcrypt password hash. Plaintext, ID-number, and generic demo-password comparisons are not accepted.
- Employee leave, attendance, employee-profile, notification, and payslip access is scoped to the authenticated employee; manager access is limited to direct reports for supported workflows. Payroll generation/settings and platform/DR administration require elevated roles.
- Document signing is restricted to the assigned manager or an administrator. The current OTP implementation is a demo flow, so it is disabled in production until a real OTP verification provider is integrated (`ENABLE_MOCK_2FA` is local-only).

Do not set mock-auth or mock-2FA flags in any deployed environment.
