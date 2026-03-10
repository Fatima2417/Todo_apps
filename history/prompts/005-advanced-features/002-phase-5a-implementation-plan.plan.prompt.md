---
id: 002
title: Phase 5A Implementation Plan
stage: plan
date: 2026-03-05
surface: agent
model: kr/claude-sonnet-4.5
feature: 005-advanced-features
branch: 005-advanced-features
user: Hp
command: /sp.plan
labels: ["plan", "phase5a", "advanced-features", "event-driven", "kafka", "dapr", "strimzi", "microservices", "architecture"]
links:
  spec: specs/005-advanced-features/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/005-advanced-features/plan.md
  - specs/005-advanced-features/research.md
  - specs/005-advanced-features/data-model.md
  - specs/005-advanced-features/quickstart.md
  - specs/005-advanced-features/contracts/task-api.yaml
  - specs/005-advanced-features/contracts/events.yaml
  - specs/005-advanced-features/contracts/dapr-components.yaml
tests:
  - N/A
---

## Prompt

```text
 - Phase 5 Part A (Local Implementation)

## Architecture Overview (Local)
[Minikube Cluster with Backend, Frontend, Kafka (Strimzi), Dapr Sidecars, and Microservices]

## Implementation Phases

### Sprint A1: Database Schema Updates (Week 1)
- Update SQLModel models with new fields (priority, tags, due_date, remind_at, recurring_pattern, parent_task_id)
- Create Alembic migration
- Update Pydantic schemas for API

### Sprint A2: API Updates (Week 1-2)
- Update CRUD endpoints to handle new fields
- Add search/filter/sort query parameters
- Add recurring task logic (on completion, create next)
- Add reminder scheduling logic (using Dapr Jobs)

### Sprint A3: Frontend Updates (Week 2-3)
- Add priority selector, tags input, due date picker, reminder checkbox
- Add search input and filter UI
- Add sort dropdown
- Display priority badges and tags

### Sprint A4: Local Kafka with Strimzi (Week 3)
- Install Strimzi in Minikube
- Create Kafka cluster (1 broker, 1 zookeeper - dev config)
- Create Kafka topics
- Test Kafka connectivity

### Sprint A5: Dapr Installation & Configuration (Week 4)
- Install Dapr on Minikube
- Create Dapr components (Kafka pubsub, PostgreSQL state store, Kubernetes secrets)
- Update backend deployment with Dapr annotations
- Test event publishing via Dapr

### Sprint A6: Event Publishing in Backend (Week 4)
- Add HTTP client to call Dapr sidecar
- Publish events on task operations (create, update, delete, complete)
- Test events appear in Kafka

### Sprint A7: Microservices (Week 5)
- Create Recurring Task Service
- Create Notification Service (logs for now - no email)
- Create Audit Service (logs events)
- Deploy all with Dapr sidecars

### Sprint A8: Reminders with Dapr Jobs (Week 5-6)
- On task creation/update with remind_at, schedule Dapr job
- Create job handler endpoint in backend
- When job triggers, publish to reminders topic
- Notification service listens and logs

### Sprint A9: Testing & Documentation (Week 6)
- Write tests for all new features
- Update README with Phase 5 instructions
- Create demo video script
- Document event schemas
```

## Response snapshot

Created comprehensive implementation plan for Phase 5A Advanced Features with event-driven architecture.

**Phase 0 Research (COMPLETE)**:
- 10 technical decisions documented with rationale and alternatives
- PostgreSQL ARRAY for tags, Enum for priority, full-text search with tsvector
- Strimzi minimal config (1 broker, 1 ZK, ~768MB overhead)
- Dapr-first integration (no direct Kafka client)
- Dapr Jobs API for exact-time reminders
- Event schema versioning strategy
- Resource allocation plan (fits in 4GB Minikube limit)

**Phase 1 Design (COMPLETE)**:
- Extended Task entity with 7 new fields (priority, tags, due_date, remind_at, recurring_pattern, is_recurring, parent_task_id)
- Database migration scripts (up/down)
- API contracts with OpenAPI spec (extended endpoints with query params)
- 7 event types defined (task.created.v1, task.updated.v1, task.deleted.v1, task.completed.v1, task.uncompleted.v1, task.recurring.completed.v1, reminder.due.v1)
- Dapr component configurations (pubsub, statestore, secrets, subscriptions)
- Quickstart guide with step-by-step setup (60-90 min estimated)

**Architecture**:
- Web application with microservices (backend + 3 new services)
- Event-driven communication via Kafka (Strimzi)
- Dapr sidecars for all services (Pub/Sub, State, Jobs, Secrets)
- 3 Kafka topics (task-events, reminders, task-updates)
- Resource allocation: ~2.8GB total (Kafka 768MB, Dapr 320MB, apps 1.7GB)

**Constitution Check**: ✅ PASSED - All 15 principles satisfied, no violations

## Outcome

- ✅ Impact: Complete implementation plan with research, design, contracts, and quickstart guide for Phase 5A event-driven architecture
- 🧪 Tests: Test strategy defined (unit, integration, contract, e2e), TDD approach planned
- 📁 Files: 7 files created (plan.md, research.md, data-model.md, quickstart.md, 3 contract files)
- 🔁 Next prompts: Run `/sp.tasks` to generate actionable task list for implementation
- 🧠 Reflection: Successfully designed event-driven architecture with Kafka/Dapr that fits within 4GB Minikube constraint. All technical decisions documented with clear rationale. Ready for implementation phase.

## Evaluation notes (flywheel)

- Failure modes observed: None - planning completed successfully with all artifacts generated
- Graders run and results (PASS/FAIL): PASS - Constitution check passed, all design artifacts complete, resource constraints validated
- Prompt variant (if applicable): Standard /sp.plan workflow with comprehensive architecture design
- Next experiment (smallest change to try): Proceed to `/sp.tasks` to generate granular implementation tasks organized by user story priority
