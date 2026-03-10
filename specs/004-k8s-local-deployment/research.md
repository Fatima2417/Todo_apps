# Research: Phase 4 - Local Kubernetes Deployment

**Feature**: 004-k8s-local-deployment
**Status**: Resolved

## Technical Decisions & Rationale

### 1. Minikube Driver & Connectivity
- **Decision**: Use `docker` driver for Minikube.
- **Rationale**: Best performance on Windows/WSL2 and easiest image loading via `minikube docker-env`.
- **Alternatives**: `virtualbox`, `hyperv` (higher overhead).
- **Findings**: Egress to Neon/Cohere is typically transparent via the Docker bridge, but `kubectl exec` tests will be used for verification.

### 2. Dockerfile Generation
- **Decision**: Use Gordon with pnpm for Frontend and venv-less multi-stage builds for Backend.
- **Rationale**: Minimizes image size and build time.
- **Findings**: Next.js 14 requires `standalone` output mode for efficient containerization. FastAPI should use non-root users for security.

### 3. Helm Orchestration
- **Decision**: Separate charts for `todo-frontend` and `todo-backend`.
- **Rationale**: Allows independent scaling and updates.
- **Alternatives**: Single umbrella chart (slightly simpler but less flexible).

### 4. Resource Allocation
- **Decision**: 
  - Frontend: 256Mi - 512Mi Memory, 200m - 500m CPU.
  - Backend: 128Mi - 256Mi Memory, 100m - 300m CPU.
- **Rationale**: Fits comfortably within Minikube's 4GB/4CPU limit while leaving room for cluster overhead.

## External Dependency Connectivity
- **Neon DB**: Verified connectivity via SSL (required by Neon).
- **Cohere API**: Standard HTTPS egress.

## Tool Configuration
- **Gordon**: Requires local Docker daemon access.
- **kubectl-ai**: Requires OpenAI/Mistral API key (verify local setup).
- **kagent**: Requires cluster-admin access within Minikube.
