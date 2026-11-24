# Kinetic HR Cloud

Kinetic HR Cloud is a multi-tenant human-resources application prototype. This repository contains a React frontend and an Azure Functions backend.

## Repository structure

- `frontend/` — React, TypeScript, Vite, React Router, React Query, and Tailwind CSS.
- `backend/` — TypeScript Azure Functions API with Azure Cosmos DB, Blob Storage, and supporting Azure services.
- `.github/workflows/` — CI validation for backend and frontend.

## Prerequisites

- Node.js 22 or newer
- npm
- Azure Functions Core Tools 4 for running the Functions host locally
- An Azure Cosmos DB account or the configured local development data adapter
- Azure Storage/Azurite when using local storage integrations

## Run the frontend

```bash
cd frontend
npm ci
npm run dev
```

## Run the backend

```bash
cd backend
npm ci
cp local.settings.json.example local.settings.json
```

Fill in the required local settings with development-only values, then run:

```bash
npm test
npm run dev
```

To run through the Azure Functions host, use `npm run start:func` after building and configuring Azure Functions Core Tools.

## Quality checks

Frontend:

```bash
cd frontend
npm ci
npm run lint
npm run build
```

Backend:

```bash
cd backend
npm ci
npm test
```

The repository CI workflow runs the backend build/tests and frontend production build on pull requests.

## Security and data handling

- Never commit real Azure credentials, JWT signing secrets, API keys, or local settings. Keep them in deployment secrets or ignored local configuration.
- Local Azure Storage Emulator state and the local development database are runtime data, not source code. The root `.gitignore` now prevents new local state from being added; existing tracked development data files must be reviewed and removed from Git history separately if they contain sensitive or unnecessary records.
- Validate tenant ownership and role permissions on every backend request. A client-provided tenant or user ID must never be treated as proof of authorization.
- Use HTTPS and managed identities or scoped credentials for deployed Azure services wherever supported.

## Project status

This is an actively developed application prototype. Review the deployment configuration, tenant isolation, authentication, and authorization against the target production environment before using it with real employee records.
