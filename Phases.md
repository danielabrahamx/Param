

## 🧱 **Phase 1 — Project Setup + Core Smart Contracts**

**Goal:**
Set up the full monorepo and implement the base Solidity smart contracts for Paramify’s flood insurance logic.

---

### ✅ **Instructions for Agent**

Follow **every task exactly**. Do **not** summarize. Output all code files, including tests and deployment scripts.

---

### 📋 **Tasks**

* [ ] Initialize a **monorepo** with the following structure:

  ```
  /contracts
  /backend
  /frontend
  /infra
  ```
* [ ] Configure **Hardhat** for Solidity 0.8.20+ with OpenZeppelin and TypeChain.
* [ ] Implement and unit-test these contracts:

  1. **`PolicyFactory.sol`**

     * Deploys `IndividualPolicy` contracts.
     * Emits `PolicyCreated` event with address and coverage data.
  2. **`IndividualPolicy.sol`**

     * Stores: `coverage`, `premium`, `policyholder`, and `payoutTriggered`.
     * Formula: `premium = coverage × 0.10`.
     * Logic: payout triggers when **oracle flood level > 3000 units**.
     * Single payout allowed per policy.
  3. **`OracleRegistry.sol`**

     * Stores latest flood data keyed by region ID.
     * Callable only by authorized oracle updater.
* [ ] Write **Hardhat tests** for:

  * Policy creation and correct premium calculation.
  * Oracle updates and payout triggering.
  * Prevention of multiple payouts.
* [ ] Add deployment scripts for **Polygon Amoy** and **Avalanche Fuji** testnets.
* [ ] Output compiled **ABI files** for backend integration.
* [ ] Document all contract functions and events in `CONTRACTS.md`.

---

### 📦 **Deliverables**

* `/contracts` folder with all Solidity files + passing tests.
* `/scripts/deploy.js` with environment config for both testnets.
* `CONTRACTS.md` describing architecture and data flow.

---

### 🧠 **Tech Stack Notes**

* Solidity 0.8.20+
* Hardhat + TypeChain + OpenZeppelin
* Polygon Amoy and Avalanche Fuji testnets
* Deployed contracts verified on testnet (optional)

---

## ⚙️ **Phase 2 — Backend Foundations**

**Goal:**
Build the backend microservices architecture for policy management and oracle integration.

---

### ✅ **Instructions for Agent**

Implement as independent microservices using **Express.js (TypeScript)**. All endpoints must match exactly.

---

### 📋 **Tasks**

* [ ] Initialize Express.js app with TypeScript and monorepo support.
* [ ] Create folders:

  ```
  /backend/api-gateway
  /backend/policy-service
  /backend/oracle-service
  ```
* [ ] Integrate **PostgreSQL** with **Drizzle ORM** (or Prisma if needed).
* [ ] Add **Redis** for caching and **BullMQ** for background jobs.
* [ ] Implement backend APIs:

  * `POST /api/v1/policies` → create new policy (calls PolicyFactory contract)
  * `GET /api/v1/policies/:id` → retrieve a single policy
  * `GET /api/v1/oracle/flood-level/:location` → get latest oracle data
* [ ] Create **oracle polling job** (runs every 5 minutes):

  * Fetches **USGS flood level data** for configured regions.
  * Stores data in TimescaleDB table (`flood_readings`).
  * Updates on-chain oracle registry via signer wallet.
* [ ] Add **Docker Compose** setup for DB + Redis + API services.
* [ ] Provide `.env.example` for environment config.

---

### 📦 **Deliverables**

* `/backend` folder with all services running locally via `docker compose up`.
* Working endpoints and periodic oracle updates.
* Database migrations for users, policies, and oracle data.

---

### 🧠 **Tech Stack Notes**

* Express.js + TypeScript
* PostgreSQL + TimescaleDB extension
* Drizzle ORM
* Redis + BullMQ
* Axios (for external API calls)

---

## 🖥️ **Phase 3 — Frontend MVP**

**Goal:**
Create a functional DApp that connects to the wallet and allows users to buy insurance.

---

### ✅ **Instructions for Agent**

Use **React + TypeScript + Vite**. Use **ethers.js v6** or **wagmi + viem** for wallet interaction.

---

### 📋 **Tasks**

* [ ] Initialize React app with Vite.
* [ ] Integrate wallet connection (MetaMask first).
* [ ] Build these pages:

  1. `/connect` → connect wallet
  2. `/buy-insurance` → input coverage, auto-calc premium, confirm transaction
  3. `/dashboard` → display user policies from backend
* [ ] Display **real-time flood level** using backend API.
* [ ] Integrate contract calls for:

  * Policy creation
  * Reading user’s policies
* [ ] Add simple responsive design with TailwindCSS.
* [ ] Deploy to testnet build (optional).

---

### 📦 **Deliverables**

* Functional frontend with wallet connection and working policy purchase flow.
* `.env` configured for backend API + testnet contract addresses.

---

### 🧠 **Tech Stack Notes**

* React + TypeScript + Vite
* TailwindCSS
* ethers.js v6 or wagmi + viem
* Backend API + Polygon Amoy

---

## 💸 **Phase 4 — Claims, Pool, and Governance**

**Goal:**
Add advanced contract functionality for liquidity management and governance.

---

### 📋 **Tasks**

* [ ] Implement:

  * **`InsurancePool.sol`** → manages liquidity, ensures 150% reserve ratio, handles payouts.
  * **`GovernanceContract.sol`** → manages roles, parameters, and contract pause/unpause.
* [ ] Extend backend:

  * Add `claims-service` to monitor oracle data.
  * Auto-trigger payouts when thresholds breached.
  * Manual admin review endpoint for claims.
* [ ] Extend DB schema for `claims`, `payouts`, and `pool_reserve`.
* [ ] Frontend:

  * `/claims` page → list + status view.
  * `/pool` page → show TVL and reserve ratio.
* [ ] Update CI scripts for new contract deployment + tests.

---

### 📦 **Deliverables**

* New smart contracts deployed to testnet.
* Automated claims running end-to-end.
* Updated frontend for admin + user visibility.


## 📣 **Phase 5 — Notifications & Analytics**

**Goal:**
Add robust multi-channel notifications and an analytics/BI microservice for platform insights.

---

### ✅ **Instructions for Agent**

Implement the Notification and Analytics microservices precisely. Expose the analytics endpoints and wire notification triggers to events (policy creation, payouts, oracle alerts, expiries). Do not summarize — produce code, tests, infra, and docs.

---

### 📋 **Tasks**

* [ ] Create `/backend/notification-service` (TypeScript + Express or Nest):

  * [ ] Integrate SendGrid/AWS SES for emails.
  * [ ] Integrate Twilio for SMS.
  * [ ] Add push notifications (web-push) and in-app notifications stored in DB.
  * [ ] Implement webhook callbacks for partners.
  * [ ] Provide retry logic and dead-letter handling (BullMQ).
  * [ ] Add feature flags: `ENABLE_EMAIL_NOTIFICATIONS`, `ENABLE_SMS_NOTIFICATIONS`.
  * [ ] Expose health and metrics endpoints (`/health`, `/metrics`).
* [ ] Add Notification triggers:

  * [ ] Policy created/activated → email+in-app
  * [ ] Premium payment received → email+in-app
  * [ ] Flood level approaching threshold (e.g., >80% of 3000) → SMS/email push
  * [ ] Claim triggered/payout processed → email+SMS+in-app
  * [ ] Policy expiration warning (configurable window) → email
  * [ ] Implement templates and i18n-ready wording
* [ ] Create `/backend/analytics-service` (TypeScript + Express):

  * [ ] Database model / ETL to aggregate metrics from Postgres + TimescaleDB
  * [ ] Endpoints:

    * `GET /api/v1/analytics/dashboard`
    * `GET /api/v1/analytics/policies`
    * `GET /api/v1/analytics/claims`
    * `GET /api/v1/analytics/pool`
  * [ ] Compute metrics:

    * TVL (pool_tvl)
    * Active policies count
    * Claim payout ratio
    * Average policy size
    * Geographic distribution
    * Pool utilization rate
    * Revenue and expenses
  * [ ] Implement caching for heavy queries (Redis)
  * [ ] Scheduled jobs to precompute daily/hourly aggregates
* [ ] Frontend (Admin Portal):

  * [ ] Add analytics dashboard UI with charts for the key metrics above.
  * [ ] Add notification settings UI (toggling channels, thresholds).
* [ ] Monitoring/Observability:

  * [ ] Expose Prometheus metrics from both services (use same metric naming conventions).
  * [ ] Add Grafana dashboard panels for notification delivery rates, deliverability errors, notification queue lengths, analytics job durations.

---

### 📦 **Deliverables**

* `/backend/notification-service` with integration tests.
* `/backend/analytics-service` with API tests and example dashboards.
* Admin frontend pages integrated with analytics and notification settings.
* Documentation: `NOTIFICATIONS.md`, `ANALYTICS.md`.

---

### 🧠 **Tech Stack Notes**

* Node.js + TypeScript, Express (or NestJS)
* SendGrid / AWS SES, Twilio, web-push
* Redis + BullMQ for job processing and retries
* Prometheus + Grafana for metrics
* DB: Postgres + TimescaleDB for time-series aggregates

---

## 🔧 **Phase 6 — Infrastructure, CI/CD & Production Readiness**

**Goal:**
Containerize, orchestrate, and implement full CI/CD and staging/production infrastructure with monitoring and auto-scaling.

---

### ✅ **Instructions for Agent**

Create reproducible infra code (Docker, Kubernetes manifests), CI workflows, and staging pipelines. Ensure secrets and environment separation. Provide an automated deploy path for staging and production.

---

### 📋 **Tasks**

* [ ] **Dockerize services**:

  * [ ] Add `Dockerfile` for each service: api-gateway, policy-service, claims-service, oracle-service, notification-service, analytics-service, frontend.
  * [ ] Add multi-stage builds and small base images.
* [ ] **Docker Compose (local dev)**:

  * [ ] `docker-compose.yml` including services: postgres, timescaledb, redis, prometheus, grafana, loki (optional), all microservices, and minio (optional for backups).
  * [ ] Compose override for `dev` vs `prod`.
* [ ] **Kubernetes manifests (production)**:

  * [ ] Create `k8s/` folder with:

    * Deployments (min 3 replicas per stateless service)
    * StatefulSets for Postgres/Timescale (or use managed DB)
    * Services (ClusterIP/LoadBalancer)
    * Ingress rules (NGINX Ingress)
    * ConfigMaps and Secrets (values should reference secrets manager)
    * HPA (HorizontalPodAutoscaler) based on CPU/memory and custom metrics
    * PVCs for persistent storage
  * [ ] NetworkPolicies for service isolation
* [ ] **Secrets management**:

  * [ ] Integrate HashiCorp Vault or cloud secrets (AWS Secrets Manager / GCP Secret Manager).
  * [ ] Ensure K8s secrets are not stored in plaintext in repo.
* [ ] **CI/CD (GitHub Actions)**:

  * [ ] Workflows:

    * `ci.yml` — Lint, unit tests, contract tests, security scans (Trivy, Snyk).
    * `build-and-push.yml` — Build Docker images, push to registry (GitHub Packages, ECR).
    * `deploy-staging.yml` — Deploy to staging cluster.
    * `deploy-prod.yml` — Manual approval then deploy to prod cluster.
  * [ ] Add environment-specific secrets and deploy keys.
* [ ] **Observability & Logging**:

  * [ ] Prometheus + Grafana manifests and dashboards (oracle uptime, pool reserve, API latency)
  * [ ] Centralized logging (Loki/ELK). Structured logs (Pino/Winston JSON).
  * [ ] Tracing (Jaeger or OpenTelemetry).
* [ ] **Backups & DR**:

  * [ ] DB backup strategy (scheduled snapshots, WAL archiving)
  * [ ] Recovery playbook in `DEPLOYMENT.md`.
* [ ] **Cost & Provider setup**:

  * [ ] Configure multi-provider RPC failover (Alchemy/Infura -> QuickNode -> public RPC).
  * [ ] Autoscaling considerations for RPC usage (rate limits).

---

### 📦 **Deliverables**

* `/infra/docker` and `/infra/k8s` with full configs.
* GitHub Actions workflows for CI/CD.
* `DEPLOYMENT.md` including staging and production runbooks.
* Monitoring dashboards and alert runbooks.

---

### 🧠 **Tech Stack Notes**

* Docker + Docker Compose for local
* Kubernetes (Helm charts optional)
* GitHub Actions
* HashiCorp Vault or cloud secret manager
* Prometheus + Grafana + Loki or ELK
* Jaeger/OpenTelemetry for tracing

---

## 🛡️ **Phase 7 — Security, Audits & Reliability**

**Goal:**
Perform comprehensive security hardening, audits, formal testing, and make reliability improvements (SLOs, DR).

---

### ✅ **Instructions for Agent**

Perform code and infra hardening, run automated security tools, and prepare artifacts for external audit. Implement reliability engineering best practices.

---

### 📋 **Tasks**

* [ ] **Smart contract security**:

  * [ ] ReentrancyGuard on all payable functions
  * [ ] Pausable and AccessControl implemented
  * [ ] Pull payments pattern for claims where possible
  * [ ] Checks-Effects-Interactions pattern enforced
  * [ ] Gas optimization pass and gas-usage tests
  * [ ] Front-run protection for time sensitive functions (e.g., use oracle-stamped timestamps and timelocks)
  * [ ] Prepare contracts for UUPS proxy upgrades and verify upgradeability tests
  * [ ] Run static analysis tools (MythX, Slither)
  * [ ] Prepare audit documentation and run an external audit (contractual step — produce audit-ready docs)
* [ ] **Backend & API security**:

  * [ ] Helmet.js, rate limiting (express-rate-limit + Redis), CORS rules
  * [ ] Input validation with Zod/Joi
  * [ ] Parameterized queries to prevent SQL injection
  * [ ] CSRF protection for web endpoints
  * [ ] JWT auth with refresh tokens; rate-limit auth endpoints
  * [ ] API key management for partners with scoped permissions
  * [ ] Dependency scanning (Snyk) and fix high severity findings
* [ ] **Infrastructure security**:

  * [ ] TLS everywhere with automated cert renewal (Let’s Encrypt / managed)
  * [ ] K8s network policies and pod security policies
  * [ ] Image scanning in CI (Trivy)
  * [ ] WAF and DDoS protection setup (Cloudflare)
  * [ ] IAM least-privilege for cloud roles
* [ ] **Reliability & Testing**:

  * [ ] Achieve ≥95% test coverage for smart contracts; integration test suite for backend + contracts
  * [ ] End-to-end tests (Playwright or Cypress) for user flows (wallet connect, buy policy, claim)
  * [ ] Chaos testing for critical components (simulate oracle outage, DB failover)
  * [ ] Load testing scripts (k6 or Locust) and run realistic scenarios (1000 concurrent users)
  * [ ] SLA/SLO definitions: uptime >99.5%, oracle update reliability 99.9%, claim processing <5 min
* [ ] **Operational readiness**:

  * [ ] Runbook for incidents (oracle failure, depletion of pool reserves, security incident)
  * [ ] Create playbook for emergency pause, multisig governance actions, and rollbacks

---

### 📦 **Deliverables**

* Security audit report (external) and remediation list.
* Automated test suites and coverage reports.
* Incident runbooks in `TROUBLESHOOTING.md`.
* Signed-off SLOs and monitoring dashboards.

---

### 🧠 **Tech Stack Notes**

* Slither, MythX for smart contract analysis
* Snyk, Trivy for dependency/image scanning
* Playwright/Cypress for E2E
* k6/Locust for load testing
* Chaos toolkit (optional)

---

## 🚀 **Phase 8 — Launch, Post-Launch Monitoring & Documentation**

**Goal:**
Deploy to production, run smoke and stress tests, complete documentation, and hand off support/onboarding materials.

---

### ✅ **Instructions for Agent**

Execute final deployments, run post-deploy validation, finalize all docs, and implement ongoing monitoring/alerts. Deliver a launch playbook.

---

### 📋 **Tasks**

* [ ] **Pre-launch checklist**:

  * [ ] All contract addresses verified and recorded.
  * [ ] All env secrets validated and stored.
  * [ ] CI/CD green for main branch; release candidate passed staging tests.
  * [ ] DR and backup strategy validated.
* [ ] **Production deployment**:

  * [ ] Deploy contracts to Polygon mainnet (or selected L2) and Avalanche C-Chain fallback.
  * [ ] Deploy backend services to production cluster (K8s).
  * [ ] Configure monitoring, alerts, and dashboards in Grafana.
  * [ ] Configure DNS, TLS, and CDN for frontend.
* [ ] **Post-deploy validation**:

  * [ ] Smoke tests: basic flows (connect wallet, buy policy, trigger claim via test oracle event)
  * [ ] Run automated E2E and load tests in production-capped mode
  * [ ] Verify oracle update cadence and latency under load
  * [ ] Verify pool reserve calculations and alerting thresholds
* [ ] **Documentation**:

  * [ ] `README.md` — Quick start and architecture summary
  * [ ] `ARCHITECTURE.md` — Diagrams and component responsibilities
  * [ ] `API.md` — OpenAPI / Swagger for all public endpoints
  * [ ] `CONTRACTS.md` — ABI, events, upgrade steps
  * [ ] `DEPLOYMENT.md` — step-by-step deployment and rollback
  * [ ] `SECURITY.md` — security controls and incident response
  * [ ] `TROUBLESHOOTING.md` — common failures and fixes
* [ ] **Support & Handoff**:

  * [ ] Create user onboarding docs and support FAQ
  * [ ] Provide admin runbook: emergency pause, manual payout, governance procedures
  * [ ] Hand over keys, secrets access, and runbook to ops team (use secure channel)
* [ ] **Post-launch monitoring & iteration**:

  * [ ] Monitor KPIs for first 72 hours (uptime, oracle frequency, claims processed)
  * [ ] Triage and fix critical issues immediately; produce post-mortem for any outages
  * [ ] Schedule roadmap for next iterations (e.g., Chainlink integration, improved UX)

---

### 📦 **Deliverables**

* Live production system with contracts on chosen networks.
* Full documentation suite in repo.
* Launch playbook and first 30-day monitoring report.
* On-call rota and support plan.

---

## Final Notes — How to run these with your agent

* Paste **one phase at a time** into the agent.
* Prepend: `“Execute the checklist below exactly. For each completed checkbox, create the files, tests, and docs, and commit to git. After finishing the phase, output a summary with commit hashes and produced artifacts.”`
* If agent truncates, paste the same phase but add: `“DO NOT summarize. Output files fully.”`



