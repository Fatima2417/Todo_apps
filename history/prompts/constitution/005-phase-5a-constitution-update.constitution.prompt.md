---
id: 005
title: Phase 5A Constitution Update
stage: constitution
date: 2026-03-05
surface: agent
model: kr/claude-sonnet-4.5
feature: none
branch: 004-k8s-local-deployment
user: Hp
command: /sp.constitution
labels: ["constitution", "phase5a", "kafka", "dapr", "event-driven", "advanced-features"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - N/A
---

## Prompt

```text
 - Phase 5 Part A (Local Development)

**Project:** Phase 5A - Advanced Features with Local Kafka/Dapr

**Core Principles:**
- **Spec-Driven Development:** All features must be implemented from specs; Claude Code generates code
- **Local-First:** All development runs on Minikube or Docker Desktop (no cloud costs)
- **No Credit Card Required:** Use free tools only (Strimzi in Minikube, Dapr OSS)
- **Incremental Delivery:** Implement advanced features one by one, testing each

**Key Standards:**
- **Advanced Features:** Implement all Intermediate and Advanced level features:
  - Priorities & Tags/Categories
  - Search & Filter
  - Sort Tasks
  - Recurring Tasks
  - Due Dates & Time Reminders
- **Event-Driven Architecture:** Use Kafka (Strimzi) for event publishing
- **Dapr Integration:** Use Dapr for Pub/Sub, State, Bindings, Secrets
- **Local Kubernetes:** All services run in Minikube (same as Phase 4)

**Constraints:**
- **Zero Cloud Spend:** No cloud provider accounts needed
- **Minikube Resources:** Must run within 4GB memory limit
- **Strimzi in Minikube:** Kafka cluster with reduced resources (1 broker, 1 zookeeper)
- **Database:** Continue using Neon (free tier) - no change

**Manual Tasks (User Will Do):**
- Oracle Cloud account setup (if proceeding to Part B)
- Domain registration/configuration
- Production SSL certificates
- Load testing

**Claude Code Tasks (AI Will Do):**
- All code implementation from specs
- Dockerfile updates
- Helm chart updates
- Dapr component YAML generation
- Kafka topic configurations
- README and documentation

**Success Criteria (Part A):**
- [ ] All advanced features work locally
- [ ] Kafka running in Minikube with Strimzi
- [ ] Events published for all task operations
- [ ] Dapr components configured and working
- [ ] Recurring tasks auto-generate next occurrence
- [ ] Due date reminders scheduled (using Dapr Jobs)
- [ ] All tests pass
- [ ] No credit card used
```

## Response snapshot

Updated project constitution from Phase 4 (Local Kubernetes Deployment) to Phase 5A (Advanced Features with Local Kafka/Dapr).

**Version Change**: 1.2.0 → 1.3.0 (MINOR bump)

**Key Changes:**
- Added 4 new core principles (XII-XV): Event-Driven Architecture, Dapr-First Integration, Incremental Feature Delivery, Zero Cloud Spend
- Extended existing principles VII and XI for Dapr/Kafka configurations and Strimzi resource constraints
- Added comprehensive standards for Event-Driven Architecture, Kafka/Strimzi Configuration, and Dapr Integration
- Defined 5 advanced features: Priorities & Tags, Search & Filter, Sort, Recurring Tasks, Due Dates & Reminders
- Updated success criteria and validation requirements for Phase 5A deliverables
- Updated constraints to include Strimzi resource limits and zero cloud spend mandate
- Maintained all Phase 4 principles while extending for event-driven capabilities

**Rationale for MINOR bump**: Added new principles and expanded guidance without removing or fundamentally changing existing principles. This is an additive change that extends the constitution for Phase 5A requirements.

## Outcome

- ✅ Impact: Constitution updated to v1.3.0 with Phase 5A principles for event-driven architecture, Kafka/Strimzi, Dapr integration, and advanced features
- 🧪 Tests: N/A (documentation update)
- 📁 Files: 1 file modified (.specify/memory/constitution.md)
- 🔁 Next prompts: Update plan-template.md and tasks-template.md to include event-driven patterns and Kafka/Dapr task types; create Phase 5A feature specifications
- 🧠 Reflection: Successfully transitioned from Phase 4 (basic K8s deployment) to Phase 5A (advanced features with event-driven architecture). Constitution now provides clear guidance for implementing Kafka event publishing, Dapr integration, and advanced task management features while maintaining zero cloud spend constraint.

## Evaluation notes (flywheel)

- Failure modes observed: None - constitution update completed successfully
- Graders run and results (PASS/FAIL): PASS - all placeholders filled, version incremented correctly, sync impact report complete
- Prompt variant (if applicable): Standard /sp.constitution workflow
- Next experiment (smallest change to try): Create first Phase 5A feature spec (e.g., Priorities & Tags) to validate constitution principles in practice
