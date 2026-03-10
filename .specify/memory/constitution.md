<!--
Sync Impact Report:
- Version change: 1.2.0 -> 1.3.0
- Modified principles:
    - Title updated: "Phase 4 - Local Kubernetes Deployment" → "Phase 5A - Advanced Features with Local Kafka/Dapr"
    - VII. Spec-Driven Deployment: Extended to include Dapr components and Kafka configurations
    - VIII. AI-Assisted Operations: Maintained for infrastructure tasks
    - XI. Minimal Resource Footprint: Updated constraints for Strimzi Kafka in Minikube
- Added sections:
    - Key Standards: Event-Driven Architecture, Kafka/Strimzi Configuration, Dapr Integration
    - Advanced Features: Priorities & Tags, Search & Filter, Sort, Recurring Tasks, Due Dates & Reminders
    - Success Criteria: Updated for Phase 5A deliverables
- Removed sections: None
- Templates requiring updates:
    - .specify/templates/plan-template.md (⚠ pending - should reference event-driven patterns)
    - .specify/templates/spec-template.md (✅ aligned - no changes needed)
    - .specify/templates/tasks-template.md (⚠ pending - should include Kafka/Dapr task types)
- Follow-up TODOs:
    - Update plan-template.md to include event-driven architecture considerations
    - Update tasks-template.md to include Kafka topic and Dapr component configuration tasks
-->

# Phase 5A - Advanced Features with Local Kafka/Dapr Constitution

## Core Principles

### I. Spec-Driven Development (SDD)
All functional changes MUST originate from a formal specification in the `/specs/` directory, followed by a technical implementation plan and a granular task list. Code implementation only begins after the specification and plan are ratified.

### II. Tool-First Intelligence (MCP)
Every core business capability MUST be exposed via standardized Model Context Protocol (MCP) tools. The AI agent MUST NOT interact with the database or business logic directly; it MUST use these standardized interfaces to ensure observability, control, and protocol-level isolation.

### III. Strict Security & Multi-tenancy
Mandatory JWT verification via Better Auth is required for every request. All data access MUST be strictly isolated by `user_id` at both the database layer (SQLModel) and the MCP tool level. Proving data isolation through automated security tests is a non-negotiable success criterion for every feature.

### IV. Model-Driven Architecture (SQLModel)
SQLModel serves as the single source of truth for database schema, API validation, and internal data structures. Every core entity (Task, Conversation, Message) MUST be defined as a SQLModel class to ensure type safety and consistency across the stack.

### V. Conversational Integrity
Every chat interaction MUST be persisted in the `Conversation` and `Message` tables. The chat endpoint MUST remain stateless, reconstructing the necessary context from the database for each agent invocation. This ensures that the system remains robust, auditable, and capable of long-term memory.

### VI. Test-First & Verifiable Quality
Test-Driven Development (TDD) is the standard for all core logic. Every User Story defined in a specification MUST have an associated independent test journey. No PR shall be merged without passing all unit, integration, and security-focused regression tests.

### VII. Spec-Driven Deployment (SDD-Infra)
All Kubernetes, Docker, Dapr, and Kafka configurations MUST be generated from specifications; no manual editing of YAML or Dockerfiles. This ensures that the infrastructure remains in sync with the application requirements and is easily recreatable. Dapr component definitions and Kafka topic configurations are part of this mandate.

### VIII. AI-Assisted Operations (AIOps)
Use Gordon (Docker AI), kubectl-ai, and kagent for all infrastructure tasks; manual commands are only allowed for verification. This principle ensures that the deployment process is driven by AI intelligence and follows established patterns.

### IX. Reproducibility & Infrastructure as Code (IaC)
The entire deployment MUST be repeatable from scratch using the specifications and provided scripts. All cluster resources (deployments, services, configmaps, secrets, Dapr components, Kafka topics) MUST be defined in Helm charts and versioned.

### X. Security by Default (Kubernetes)
Secrets MUST NEVER be hardcoded; use environment variables or Kubernetes secrets. RBAC and network policies should be used where appropriate to ensure a secure local cluster environment.

### XI. Minimal Resource Footprint (Local K8s)
Deployments MUST respect local Minikube resource limits (CPU, memory) to avoid instability. Resource requests and limits MUST be explicitly defined in all Kubernetes manifests. Strimzi Kafka MUST be configured with minimal resources (1 broker, 1 zookeeper) to fit within 4GB memory limit.

### XII. Event-Driven Architecture (EDA)
All task operations (create, update, delete, complete) MUST publish events to Kafka topics. Event schemas MUST be versioned and documented. Services MUST be designed to react to events asynchronously where appropriate, enabling loose coupling and scalability.

### XIII. Dapr-First Integration
All cross-cutting concerns (Pub/Sub, State Management, Bindings, Secrets) MUST use Dapr building blocks. Direct integration with Kafka or other infrastructure MUST be avoided in application code; use Dapr abstractions instead.

### XIV. Incremental Feature Delivery
Advanced features MUST be implemented one at a time, with each feature fully tested and validated before proceeding to the next. Each feature MUST be independently deployable and testable.

### XV. Zero Cloud Spend
All development and testing MUST run locally using free tools only. No cloud provider accounts or credit cards are required for Phase 5A. Neon free tier database is the only external dependency.

## Key Standards

### Containerization
- Frontend and backend must be containerized using Dockerfiles.
- Gordon must be used for Dockerfile generation and optimization.
- Images must be tagged with meaningful versions and documented.

### Helm Charts
- All Kubernetes resources must be packaged in Helm charts.
- Charts must be parameterized (values.yaml) for environment differences.
- Use kubectl-ai or kagent to generate initial chart structure.

### Kubernetes Manifests
- Define Deployments with resource requests/limits.
- Expose services via ClusterIP or NodePort as needed.
- Use ConfigMaps for environment variables (except secrets).
- Secrets for API keys (Cohere, etc.) must be stored securely.

### Event-Driven Architecture
- **Event Publishing**: All task CRUD operations publish events to Kafka topics.
- **Event Schema**: Define clear event schemas with versioning (e.g., TaskCreated v1, TaskUpdated v1).
- **Topic Naming**: Use consistent naming convention (e.g., `tasks.created`, `tasks.updated`, `tasks.deleted`).
- **Event Consumers**: Implement consumers for recurring tasks and reminder notifications.

### Kafka/Strimzi Configuration
- **Deployment**: Kafka runs in Minikube using Strimzi operator.
- **Resource Limits**: 1 broker, 1 zookeeper with minimal memory/CPU allocation.
- **Topics**: Auto-create topics with appropriate retention and partition settings.
- **Monitoring**: Use Strimzi metrics for basic observability.

### Dapr Integration
- **Pub/Sub Component**: Configure Dapr Kafka pub/sub component for event publishing.
- **State Store**: Use Dapr state management for recurring task schedules (optional).
- **Bindings**: Use Dapr bindings for scheduled reminders (Dapr Jobs/Cron).
- **Secrets**: Use Dapr secrets API for sensitive configuration.
- **Sidecar Injection**: Enable Dapr sidecar for backend pods via annotations.

### Advanced Features (Phase 5A)
- **Priorities & Tags/Categories**: Tasks can have priority levels (High, Medium, Low) and multiple tags.
- **Search & Filter**: Full-text search on task titles/descriptions; filter by status, priority, tags, due date.
- **Sort Tasks**: Sort by creation date, due date, priority, completion status.
- **Recurring Tasks**: Define recurrence patterns (daily, weekly, monthly); auto-generate next occurrence on completion.
- **Due Dates & Time Reminders**: Set due dates with optional time; schedule reminders via Dapr Jobs.

### AIOps Tools
- **Gordon**: Used for Dockerfile creation, image builds, and Docker Compose (if needed).
- **kubectl-ai**: Used for generating Kubernetes resources and debugging.
- **kagent**: Used for cluster health analysis and optimization.

### Local Environment
- **Deployment target**: Minikube with Docker driver.
- All components must run inside the cluster.
- **External connectivity**: Ensure network policies allow egress to Neon database (cloud) if used.

## Constraints
- **Resource Limits**: Minikube VM allocated memory ≤ 4GB, CPU ≤ 4 cores; deployments must fit within these limits.
- **Strimzi Resources**: Kafka cluster with 1 broker, 1 zookeeper, minimal memory allocation.
- **No Cloud Spend**: Zero cloud provider accounts needed; use free tools only (Strimzi, Dapr OSS).
- **No Manual Edits**: All configuration files must be generated via the AI agent from specs; any manual tweak must be reflected back in specs.
- **Database**: Continue using Neon free tier - no change from Phase 4.
- **Kubernetes Version**: Must match the version provided by Minikube.

## Success Criteria

### Functionality (Phase 5A)
- All advanced features work locally:
  - [ ] Priorities & Tags/Categories functional
  - [ ] Search & Filter operational
  - [ ] Sort Tasks working
  - [ ] Recurring Tasks auto-generate next occurrence
  - [ ] Due Dates & Time Reminders scheduled and triggered
- Frontend and backend pods are running and healthy.
- Kafka cluster (Strimzi) is running in Minikube.
- Events published for all task operations (create, update, delete, complete).
- Dapr components configured and working (Pub/Sub, Bindings, Secrets).
- Database connection from cluster to Neon is successful.
- All environment variables and secrets are correctly injected.

### Technical
- Dockerfiles exist for both frontend and backend, built and tagged.
- Helm charts for both services are updated and installable.
- Strimzi operator installed and Kafka cluster running.
- Dapr installed in Minikube with sidecars injected.
- Kafka topics created and events flowing.
- Dapr components (pub/sub, bindings) configured via YAML.
- kubectl-ai and kagent commands have been used and logged.
- Deployment can be torn down and recreated with `helm uninstall` and `helm install`.

### Quality
- Zero manual coding violations – all code/config generated from specs.
- Resource limits prevent OOM kills.
- Logs show no persistent errors.
- AI tools usage is documented.
- All tests pass (unit, integration, contract).
- No credit card used.

## Implementation Rules
1. **Spec-First**: Write complete feature specs before any code generation.
2. **AI-Driven**: Use AI tools (Gordon, kubectl-ai, kagent) via appropriate prompts.
3. **Iterate with AI**: If a tool fails, refine the spec and retry; do not manually fix YAML.
4. **Version Control**: All generated files (Dockerfiles, Helm charts, Kubernetes YAML, Dapr components) must be committed.
5. **Test After Each Step**: Verify container images build, helm install works, pods start, events flow.
6. **Incremental Delivery**: Implement one advanced feature at a time; test and validate before proceeding.

## Validation Requirements
- [ ] Docker images build without errors.
- [ ] Helm install completes successfully.
- [ ] `kubectl get pods` shows all pods in Running state.
- [ ] Strimzi Kafka cluster is healthy (`kubectl get kafka`).
- [ ] Dapr sidecars injected and running.
- [ ] Port-forward or NodePort access to frontend works.
- [ ] All advanced features functional and tested.
- [ ] Events published to Kafka topics (verify with console consumer).
- [ ] Recurring tasks auto-generate next occurrence.
- [ ] Due date reminders triggered via Dapr Jobs.
- [ ] AI tools (Gordon, kubectl-ai, kagent) were used and their output recorded.

## Documentation Standards
- `README.md` must include instructions for:
  - Building Docker images (with AI tool commands).
  - Installing Strimzi operator and Kafka cluster.
  - Installing Dapr in Minikube.
  - Installing Helm charts.
  - Accessing the application.
  - Verifying event flow.
  - Teardown.
- All specs stored in `/specs/phase5a/` with clear naming.
- Logs of AI tool interactions (optional but recommended).

## Phase-Specific Notes
- This phase focuses on **advanced features + event-driven architecture**.
- Must preserve Phase 4 functionality unchanged.
- If using external Neon database, ensure network policies allow egress.
- AI tools may be used for Dockerfile updates, Kubernetes manifests, Dapr components, and Kafka configurations.
- Strimzi operator handles Kafka lifecycle; use CRDs for cluster definition.
- Dapr sidecars are injected via pod annotations; no code changes needed for basic integration.

## Governance

- **Supremacy**: This Constitution supersedes all other project documentation and practices.
- **Amendments**: Changes to these principles require a version bump (SemVer) and a corresponding update to the Sync Impact Report at the top of this file.
- **Compliance**: All Pull Requests MUST include a "Constitution Check" in their implementation plan to justify any deviations or confirm adherence to these rules.
- **Versioning**: MAJOR bumps for principle removals, MINOR for additions, PATCH for clarifications.

**Version**: 1.3.0 | **Ratified**: 2026-02-11 | **Last Amended**: 2026-03-06
