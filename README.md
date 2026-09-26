# WhisTech Platform — Containerised 3-Tier Application

[![CI](https://img.shields.io/github/actions/workflow/status/YOUR_USER/whistech-platform/ci.yml?label=CI&logo=github)](https://github.com/YOUR_USER/whistech-platform/actions/workflows/ci.yml)
[![Publish](https://img.shields.io/github/actions/workflow/status/YOUR_USER/whistech-platform/publish.yml?label=ECR&logo=amazon-aws)](https://github.com/YOUR_USER/whistech-platform/actions/workflows/publish.yml)
[![IaC: Terraform](https://img.shields.io/badge/IaC-Terraform_1.9-7B42BC?logo=terraform)](https://www.terraform.io/)
[![Docker](https://img.shields.io/badge/Docker-multi--stage-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Security: Trivy](https://img.shields.io/badge/Security-Trivy_scanned-1D9E75)](https://trivy.dev/)

> **Scenario:** WhisTech Solutions needed to replace a monolithic PHP application with a production-grade containerised platform. This project delivers a full 3-tier architecture React frontend, Node.js/Express REST API, PostgreSQL running identically in local development and production, with automated vulnerability scanning gating every ECR push.

---

## What this project demonstrates

| Skill area | Implementation |
|---|---|
| Containerisation | Multi-stage Dockerfiles — 93% image size reduction vs single-stage |
| Security | Non-root container users, Trivy CVE scanning blocks HIGH/CRITICAL merges |
| Network isolation | Backend network `internal: true` — database unreachable from frontend |
| CI/CD | GitHub Actions with OIDC — Trivy scan gates ECR push, SBOM + provenance on every image |
| IaC | Terraform-managed ECR repositories with immutable tags and lifecycle policies |
| Production API | Helmet, rate limiting, Zod validation, correlation IDs, graceful shutdown, pino logging |
| Testing | Integration tests against a real PostgreSQL service container in CI |
| Developer experience | `docker compose up` — one command starts the full 4-service stack locally |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Local / Production stack                                            │
│                                                                      │
│  Browser → :80                                                       │
│              │                                                       │
│         ┌────▼────────────────────────────────────────────────┐     │
│         │  Nginx (reverse proxy)                               │     │
│         │  Rate limiting · gzip · security headers            │     │
│         └────┬────────────────────────┬───────────────────────┘     │
│              │ /api/*                 │ /*                           │
│    ┌─────────▼──────────┐   ┌────────▼──────────┐                  │
│    │  Node.js API        │   │  React Frontend    │                  │
│    │  Express · Helmet   │   │  Built by CRA      │                  │
│    │  Zod · pino         │   │  Served by Nginx   │                  │
│    │  Graceful shutdown  │   └────────────────────┘                  │
│    └─────────┬──────────┘                                           │
│              │ backend-net (internal: true)                          │
│    ┌─────────▼──────────┐                                           │
│    │  PostgreSQL 16      │                                           │
│    │  Schema migrations  │                                           │
│    │  Named volume       │                                           │
│    └────────────────────┘                                           │
│                                                                      │
│  Networks:                                                           │
│    frontend-net: nginx ↔ api ↔ frontend                             │
│    backend-net (internal): api ↔ db only                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  CI/CD pipeline                                                      │
│                                                                      │
│  PR opened → ci.yml                                                  │
│    ├── test-api: Jest integration tests (real Postgres service)      │
│    └── build-and-scan: Trivy scans API + frontend images             │
│         └── HIGH/CRITICAL CVE found → pipeline fails, PR blocked     │
│                                                                      │
│  Merge to main → publish.yml                                         │
│    ├── OIDC auth → ECR login (no stored AWS keys)                    │
│    ├── Build + push API image with SBOM + provenance                 │
│    ├── Trivy scan pushed image (fail on HIGH/CRITICAL)               │
│    └── Build + push frontend image with SBOM + provenance            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Stack

| Layer | Technology | Detail |
|---|---|---|
| Frontend | React 18 + axios | Built by CRA, served by Nginx alpine |
| API | Node.js 20 + Express 4 | Helmet, express-rate-limit, pino, Zod, pg |
| Database | PostgreSQL 16 | Schema migrations on startup, named volume |
| Reverse proxy | Nginx 1.27 | Rate limiting, gzip, security headers, upstream health |
| Container runtime | Docker + Compose | Multi-stage builds, health checks, network isolation |
| Image registry | AWS ECR | Immutable tags, scan-on-push, lifecycle policies |
| IaC | Terraform 1.9 | ECR repos, IAM OIDC role, remote state |
| CI/CD | GitHub Actions | OIDC auth, Trivy CVE gates, SBOM, SLSA provenance |

---

## Project structure

```
whistech-platform/
├── .github/workflows/
│   ├── ci.yml              # test + Trivy scan on every PR
│   └── publish.yml         # build + push to ECR on merge to main
├── services/
│   ├── api/
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   ├── pool.js         # pg connection pool singleton
│   │   │   │   └── migrate.js      # idempotent SQL migration runner
│   │   │   ├── middleware/
│   │   │   │   ├── validate.js     # Zod request body validation
│   │   │   │   └── requestId.js    # correlation ID per request
│   │   │   ├── routes/
│   │   │   │   └── tasks.js        # full CRUD — GET/POST/PATCH/DELETE
│   │   │   └── index.js            # app entry — helmet, rate limit, graceful shutdown
│   │   ├── tests/
│   │   │   └── tasks.test.js       # integration tests against real Postgres
│   │   ├── Dockerfile              # multi-stage: deps → production (non-root)
│   │   ├── .dockerignore
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   ├── TaskBoard.jsx   # kanban board with live API calls
│       │   │   └── TaskCard.jsx    # individual task with status transitions
│       │   ├── api/
│       │   │   └── client.js       # axios instance — all requests via /api
│       │   ├── App.jsx
│       │   ├── index.js
│       │   └── index.css
│       ├── public/
│       │   └── index.html
│       ├── nginx.conf              # per-service Nginx — SPA routing, asset caching
│       ├── Dockerfile              # multi-stage: builder → nginx:alpine (non-root)
│       ├── .dockerignore
│       └── package.json
├── database/
│   └── migrations/
│       ├── 001_create_tasks.sql    # tasks table with constraints + pgcrypto UUID
│       └── 002_add_indexes.sql     # query indexes + updated_at trigger
├── nginx/
│   └── nginx.conf                  # reverse proxy: rate limiting, gzip, upstreams
├── terraform/
│   ├── providers.tf
│   ├── backend.tf                  # remote state — shared S3 bucket, unique key
│   ├── variables.tf
│   ├── terraform.tfvars
│   ├── ecr.tf                      # ECR repos, immutable tags, lifecycle policies
│   ├── iam.tf                      # GitHub OIDC provider + ECR push role
│   └── outputs.tf
├── docker-compose.yml              # base — shared config
├── docker-compose.override.yml     # dev — hot reload, exposed ports (auto-loaded)
├── docker-compose.prod.yml         # prod — ECR images, resource limits
├── .env.example                    # template — copy to .env
├── .gitignore
├── .terraform-version
└── README.md
```

---

## Prerequisites

- Docker Desktop (or Docker Engine + Compose plugin)
- Node.js 20+ (for running tests locally without Docker)
- AWS CLI configured (`aws sts get-caller-identity` returns your ARN)
- Terraform >= 1.9 (or tfenv)
- Terraform state backend bootstrapped from Project 1 (S3 bucket + DynamoDB table)

---

## Getting started

### Step 1 — Provision ECR infrastructure

```bash
cd terraform/

# Edit terraform.tfvars — set github_org to your GitHub username
terraform init
terraform fmt -recursive
terraform validate
terraform plan -out=tfplan
terraform apply tfplan
```

Add the output to GitHub Secrets:

```bash
terraform output -raw github_publish_role_arn
# → Add as AWS_ROLE_ARN in GitHub repo → Settings → Secrets → Actions
```

### Step 2 — Configure environment

```bash
cp .env.example .env
# Edit .env — set DB_PASSWORD to anything non-empty
```

### Step 3 — Start the development stack

```bash
# docker-compose.override.yml is merged automatically
docker compose up --build
```

The stack is ready when all four services show `healthy`:

```
NAME                STATUS
whistech-db         running (healthy)
whistech-api        running (healthy)
whistech-frontend   running (healthy)
whistech-nginx      running
```

Open **http://localhost** — Nginx serves the full application.

### Step 4 — Run the API tests locally

```bash
# Tests run against the running Postgres service in your compose stack
cd services/api
npm install
DB_HOST=localhost DB_PORT=5432 DB_NAME=whistech DB_USER=whistech DB_PASSWORD=yourpassword npm test
```

---

## API reference

Base URL: `http://localhost/api` (via Nginx) or `http://localhost:3000` (direct, dev only)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/tasks` | List tasks. Query: `status`, `priority`, `page`, `limit` |
| `GET` | `/api/tasks/:id` | Get single task |
| `POST` | `/api/tasks` | Create task. Body: `title` (required), `description`, `status`, `priority`, `due_date` |
| `PATCH` | `/api/tasks/:id` | Partial update — send only changed fields |
| `DELETE` | `/api/tasks/:id` | Delete task — returns 204 |
| `GET` | `/health` | Health check — returns DB connection status |

**Status values:** `todo` · `in_progress` · `done` · `cancelled`

**Priority values:** `low` · `medium` · `high` · `critical`

### Example requests

```bash
# Create a task
curl -X POST http://localhost/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Deploy to production","priority":"high"}'

# List in-progress tasks
curl "http://localhost/api/tasks?status=in_progress"

# Move to done
curl -X PATCH http://localhost/api/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}'
```

---

## Docker image design

### Multi-stage build — why it matters

| Stage | Contents | Size |
|---|---|---|
| `deps` | node_modules (prod only) | ~120MB |
| `builder` (frontend) | node_modules + React build output | ~600MB |
| `production` (API) | node_modules + src | ~85MB |
| `production` (frontend) | Static build + Nginx | ~42MB |

Single-stage images including dev dependencies and source would be 400–600MB. The multi-stage approach produces lean, minimal images with no build tools, no dev dependencies, and no source code in the final layer.

### Non-root users

Both production images run as UID 1001 (`whistech` group). If a container is ever escaped, the attacker lands as a non-root user with no write access outside `/app`. Created with `addgroup` / `adduser` before any `COPY` instruction — never after.

### Health checks

Every service declares a Docker `HEALTHCHECK`. `depends_on: condition: service_healthy` in Compose means dependent services wait for the health check to pass before starting — not just for the container to exist. The API's health check tests real PostgreSQL connectivity on every probe.

---

## CI/CD pipeline

### `ci.yml` — runs on every PR

1. Spins up a PostgreSQL 16 service container in GitHub Actions
2. Installs API dependencies and runs Jest integration tests against real Postgres
3. Builds the API image (multi-stage, production target)
4. Runs Trivy — fails the pipeline on any HIGH or CRITICAL CVE
5. Uploads SARIF results to GitHub Security tab (visible even on failure)
6. Builds the frontend image and scans it

### `publish.yml` — runs on merge to main

1. Authenticates to AWS via OIDC (no stored credentials)
2. Logs in to ECR
3. Builds API image and pushes with git SHA tag
4. Scans the pushed image with Trivy — fails if vulnerabilities found
5. Generates SBOM (Software Bill of Materials) and SLSA provenance attestation
6. Builds and pushes frontend image with same SHA tag

**Image tags are immutable in ECR.** Once `abc12345` is pushed, it cannot be overwritten. This guarantees that any tag you deploy is exactly what was scanned and verified in CI.

---

## Architecture decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend network `internal: true` | PostgreSQL isolated | The database has no outbound internet access and cannot be reached from the frontend network. Lateral movement from a compromised Nginx container cannot reach the database. |
| `CMD ["node", "src/index.js"]` not `npm start` | node as PID 1 | npm intercepts signals but does not forward SIGTERM correctly to the node process. Graceful shutdown requires node to receive SIGTERM as PID 1. |
| Trivy with `exit-code: 1` | Hard pipeline gate | A vulnerability scan that does not block the pipeline is theatre. HIGH and CRITICAL CVEs fail the build — no exceptions. Base image updates happen when Trivy tells you to. |
| Immutable ECR tags | `IMMUTABLE` | Prevents accidental overwrite of production images. Combined with SHA tagging, any tag is uniquely traceable to a git commit and a CI run. |
| Two Nginx instances | Per-service + reverse proxy | The frontend image bakes in a per-service Nginx for SPA routing. The separate `nginx` service acts as the reverse proxy. This mirrors a realistic microservices deployment pattern. |
| Separate Compose files | base + override + prod | Development config (hot reload, exposed ports) auto-merges via `override.yml`. Production explicitly specifies ECR images and resource limits. No environment-specific values leak between environments. |
| Zod for validation | Schema-first | Zod parses and coerces the request body, replacing it with a type-safe object. Invalid requests return structured field-level errors. Input validation happens at the boundary, not in business logic. |
| Pino for logging | Structured JSON | Pino is 5x faster than Winston and outputs newline-delimited JSON — the format expected by every log aggregator (CloudWatch Logs, Datadog, Loki). In development, `pino-pretty` makes it human-readable. |

---

## Key production concepts applied

**Graceful shutdown prevents dropped requests at deploy time.** On `docker compose restart` or rolling deploy, Docker sends SIGTERM before SIGKILL. The handler stops accepting new connections, allows in-flight requests to complete (up to 30 seconds), closes the database pool, then exits cleanly. Without this, users see 502 errors at every deployment.

**Correlation IDs trace requests across logs.** Every request gets a UUID in `X-Request-ID`. This ID appears in every log line generated while handling that request. When a user reports a bug, you find the request ID in the browser response headers and grep logs for it — instant root cause analysis across a distributed system.

**The migration runner is idempotent.** The `_migrations` table tracks which SQL files have been applied. Running `docker compose up` ten times applies each migration exactly once. Migrations never run inside transactions that span multiple DDL statements — each file is its own transaction with a rollback on failure.

---

## Useful commands

```bash
# Start full stack (dev)
docker compose up --build

# Rebuild a single service after code change
docker compose up --build api

# Tail logs from API
docker compose logs -f api

# Open a shell inside the running API container
docker compose exec api sh

# Connect to Postgres directly
docker compose exec db psql -U whistech whistech

# Run tests (requires running Postgres from compose)
cd services/api && npm test

# Check health of all services
docker compose ps

# Stop and remove volumes (full reset)
docker compose down -v

# Scan image locally with Trivy
trivy image whistech/api:latest

# Start production stack with ECR images
export ECR_REGISTRY=$(cd terraform && terraform output -raw ecr_registry)
export IMAGE_TAG=abc12345
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Extending this project

Documented in `docs/architecture.md` as candidate ADRs:

- **Deploy to EKS** — convert Compose services to Kubernetes manifests and Helm charts (Project 5)
- **ArgoCD GitOps** — replace `docker compose` prod deployments with ArgoCD syncing from a config repo (Project 6)
- **Redis session cache** — add a Redis service to the backend network for API rate limiting state and session storage
- **Prometheus metrics** — instrument the Express API with `prom-client` and add a `/metrics` endpoint
- **Database migrations via CI** — run `migrate.js` as a separate init container or CI step rather than on every API startup
- **Multi-architecture builds** — add `--platform linux/amd64,linux/arm64` to Buildx for Apple Silicon + x86 compatibility

---

## Resume bullet

```
Architected a production 3-tier containerised platform (React/Node.js/PostgreSQL)
using multi-stage Dockerfiles achieving 93% image size reduction, Docker Compose
with isolated backend network, Nginx reverse proxy with rate limiting and security
headers, and a GitHub Actions CI/CD pipeline that gates AWS ECR pushes on Trivy
vulnerability scanning — blocking HIGH and CRITICAL CVEs from reaching production.
All ECR infrastructure managed by Terraform with immutable image tags and
automated lifecycle policies.
```

---

*Containerised with Docker · Scanned by Trivy · Deployed via GitHub Actions · ECR managed by Terraform*
