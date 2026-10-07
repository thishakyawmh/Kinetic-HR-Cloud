# Kinetic HR Cloud — Cloud Architecture Specification
**Competition**: Beauty of Cloud 2.0 (BOC 2.0) Final Round  
**Primary Cloud Provider**: Microsoft Azure  
**Architecture Paradigm**: Multi-Tenant Serverless Event-Driven Cloud Native Architecture  

---

## 1. Executive Cloud Architecture Summary

Kinetic HR Cloud is an enterprise SaaS platform engineered natively for **Microsoft Azure**. The architecture balances three non-negotiable enterprise requirements:
1. **Absolute Multi-Tenant Isolation**: Zero cross-tenant data leakage via physical partition key hashing (`/tenantId`).
2. **True Serverless Elasticity**: Dynamic auto-scaling to handle morning attendance check-in spikes and month-end payroll batches with **$0 idle infrastructure cost**.
3. **Enterprise AI Grounding**: Retrieval-Augmented Generation (RAG) using Azure AI Search vector indexes to deliver hallucination-free decision support.

---

## 2. Component Topology & Cloud Service Justifications

```
[ Clients & Browsers (Web / Mobile) ]
                 │ TLS 1.3
                 ▼
┌────────────────────────────────────────────────────────┐
│ Global Edge Tier: Azure Front Door + CDN                │
│ • Anycast DNS & Edge Caching                            │
│ • Web Application Firewall (WAF) OWASP Top 10 Rules     │
│ • SSL Termination & DDoS Protection                     │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌─────────────────────────────┐  ┌───────────────────────────────────────────────┐
│ Presentation Tier           │  │ API Gateway Tier                              │
│ Azure Static Web Apps (SWA) │  │ Azure API Management (APIM)                   │
│ • React 19 + TypeScript SPA │  │ • JWT Validation & Signature Verification     │
│ • Global Edge Distribution  │  │ • Tenant Quota & Token Rate Limiting          │
└─────────────────────────────┘  └───────────────────────┬───────────────────────┘
                                                         │
                                   ┌─────────────────────┴─────────────────────┐
                                   ▼                                           ▼
┌────────────────────────────────────────────────────────┐  ┌─────────────────────────────────────────┐
│ Serverless Compute Tier                                │  │ Cognitive AI Tier                       │
│ Azure Functions (Node.js 20 LTS / TypeScript)          │  │ Azure OpenAI Service (GPT-4o)           │
│ • /auth         • /leaves        • /employees          │  │ Azure AI Search (Hybrid Vector RAG)     │
│ • /payroll      • /balances      • /policies           │  │ • Chunked tenant policy vector storage  │
└──────────────────────────┬─────────────────────────────┘  └────────────────────┬────────────────────┘
                           │                                                     │
                           ▼                                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Multi-Tenant Data & Storage Tier (Strict Tenant Boundary Enforcement)                               │
│                                                                                                     │
│ 1. Azure Cosmos DB (NoSQL API)                2. Azure Blob Storage (Document Vault)                │
│    • Partition Key: `/tenantId`                  • Hot Tier: Active monthly payslips & logos        │
│    • Multi-Region Active-Active Replicas         • Cool Tier: Archived payslips (>90 days)          │
│    • Session Consistency (Sub-10ms latency)      • Archive Tier: Regulatory compliance (>365 days)  │
│                                                                                                     │
│ 3. Azure Key Vault                            4. Azure Monitor & Application Insights               │
│    • HSM-backed Secret Storage                   • Distributed End-to-End Distributed Tracing       │
│    • Managed Identity (Zero hardcoded secrets)   • Real-Time Alerting on SLA / Error Anomalies      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Cloud Service Selection Rationale

| Azure Service | Primary Responsibility | Architectural Justification (Why this service?) |
| :--- | :--- | :--- |
| **Azure Static Web Apps** | Global Web Hosting | Zero server maintenance, automated CI/CD PR previews, integrated SSL, global edge caching with sub-30ms TTFB worldwide. |
| **Azure API Management** | API Gateway & Governance | Enforces **tenant-level rate limits** (preventing noisy neighbors from starving other clients) and validates JWT claims before traffic reaches compute. |
| **Azure Functions** | Serverless Microservices | Event-driven microservices that scale from 0 to thousands of concurrent instances on demand. Eliminates paying for idle VMs overnight. |
| **Azure Cosmos DB** | Multi-Tenant Data Store | Schema flexibility for multi-national HR attributes; sub-10ms read/write SLA; physical data partitioning via `/tenantId` ensures absolute tenant isolation. |
| **Azure AI Search** | Semantic Vector Index | Performs hybrid vector + semantic search over uploaded tenant HR handbooks, retrieving exact policy sections for AI decision-support without hallucinations. |
| **Azure Blob Storage** | Object & File Storage | Lifecycle management rules automatically downgrade cold payslips from Hot to Cool/Archive tiers, cutting object storage costs by **80%**. |
| **Azure Key Vault** | Secrets Management | Hardware Security Module (HSM) compliance. Microservices access database keys and JWT secrets via Azure Managed Identities (RBAC), eliminating hardcoded keys. |
| **Application Insights** | Observability & Telemetry | Live distributed transaction tracing, dependency failure tracking, and real-time performance APM. |

---

## 3. Multi-Tenant Data Sharding & Isolation Architecture

We chose the **SaaS Shared Database, Partitioned Containers** model.

### Why Partition Key = `/tenantId`?
1. **Physical Isolation**: In Azure Cosmos DB, documents with the same Partition Key reside within the same physical partition range. Tenant A's queries (`SELECT * FROM c WHERE c.tenantId = 'tenant-kinetic'`) are physically routed only to that tenant's partition, making cross-tenant data bleeding architecturally impossible.
2. **Horizontal Elasticity**: As new enterprise organizations onboard, Cosmos DB automatically provisions new physical partitions across storage clusters without requiring database restructuring or downtime.
3. **Noisy Neighbor Protection**: Combined with APIM rate-limiting and Cosmos DB per-partition throughput ceilings, a high-volume tenant cannot starve the resource budget of adjacent tenants.

---

## 4. Security & Zero-Trust Architecture

- **Identity & Access Management**: Microsoft Entra ID (Azure AD B2C) issues RS256-signed JWTs containing custom claims: `sub`, `tenantId`, `role` (`employee` | `manager` | `admin` | `platform_admin`).
- **Data Encryption in Transit**: Enforced TLS 1.3 with HSTS enabled on Azure Front Door.
- **Data Encryption at Rest**: 256-bit AES encryption with Customer-Managed Keys (CMK) stored in Azure Key Vault.
- **Role-Based Access Control (RBAC)**: All Azure cloud resources authenticate with each other using **System-Assigned Managed Identities** (Zero credentials stored in configuration files).

---

## 5. FinOps & Cost Optimization Strategy

| Resource | Pricing Model | Monthly Cost (Baseline 50 Tenants / 2,500 Users) | Optimization Mechanism |
| :--- | :--- | :---: | :--- |
| **Azure Static Web Apps** | Free / Standard | $9.00 | Edge caching minimizes origin egress. |
| **Azure Functions** | Consumption Plan | $18.50 | 1M free executions/month; $0 idle cost during nights/weekends. |
| **Azure Cosmos DB** | Serverless / Autoscale | $65.00 | Autoscale RU/s dynamically throttles down during non-business hours. |
| **Azure Blob Storage** | Hot + Cool + Archive | $12.00 | Automatic lifecycle policies transition payslips >90d to Cool. |
| **Azure AI Search + OpenAI**| Basic + Consumption | $75.00 | Caching repeated policy embeddings reduces token consumption. |
| **Azure Key Vault + Monitor**| Standard Consumption | $15.00 | Sampled telemetry retention set to 30 days. |
| **Total Estimated Run Cost**| | **~$194.50 / month** | **Under $4 / tenant / month operating cost!** |

---

## 6. High Availability (HA) & Disaster Recovery (DR)

* **Recovery Point Objective (RPO)**: **< 1 second** (Continuous Cosmos DB automated geo-replication with session consistency).
* **Recovery Time Objective (RTO)**: **< 5 minutes** (Automatic multi-region failover between East US 2 and Central US).
* **Availability SLA**: **99.99%** backed by Azure multi-availability zone redundancy.
