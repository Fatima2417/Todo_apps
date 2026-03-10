---

description: "Task list for Phase 4: Local Kubernetes Deployment"
---

# Tasks: Phase 4 - Local Kubernetes Deployment

**Input**: Design documents from `/specs/004-k8s-local-deployment/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Tests focus on infrastructure validation (`helm lint`, `docker run` smoke tests).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/`, `frontend/`, `helm/`
- Paths shown below are relative to the repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize Helm chart directory structure in `helm/`
- [x] T002 [P] Configure Minikube environment and verify status with `minikube status`
- [x] T003 [P] Create `docs/phase4-ai-log.md` for recording AI tool interactions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create Kubernetes Secrets for sensitive API keys (`todo-secrets`) using `kubectl create secret`
- [x] T005 [P] Create `.dockerignore` files in `frontend/` and `backend/`
- [ ] T006 Configure shell for Minikube Docker daemon via `eval $(minikube docker-env)`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Containerize Frontend and Backend (Priority: P1) 🎯 MVP

**Goal**: Create production-ready Docker images for frontend and backend using AI tools.

**Independent Test**: Run containers locally using `docker run` and verify they respond to health checks on ports 3000 and 8000.

### Implementation for User Story 1

- [x] T007 [US1] Generate `backend/Dockerfile` using Gordon (AI)
- [x] T008 [US1] Generate `frontend/Dockerfile` using Gordon (AI)
- [ ] T010 [US1] Build `todo-backend:latest` image inside Minikube Docker daemon
- [ ] T011 [US1] Build `todo-frontend:latest` image inside Minikube Docker daemon
- [ ] T012 [US1] Verify images start and respond on ports 8000/3000 via `docker run`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Deploy to Local Kubernetes via Helm (Priority: P2)

**Goal**: Deploy the application as a Helm release on Minikube.

**Independent Test**: `helm install` succeeds and `kubectl get pods` shows all pods in `Running` state.

### Implementation for User Story 2

- [x] T013 [US2] Generate `helm/todo-backend` chart using kubectl-ai or Claude
- [x] T014 [US2] Generate `helm/todo-frontend` chart using kubectl-ai or Claude
- [x] T015 [US2] Parameterize `helm/todo-backend/values.yaml` with resource limits and env var references
- [x] T016 [US2] Parameterize `helm/todo-frontend/values.yaml` with NodePort and backend API URL
- [x] T017 [US2] Deploy `todo-backend` and `todo-frontend` using `helm install`
- [x] T018 [US2] Verify chatbot connectivity to external Neon DB from within a pod using `kubectl exec`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - AI-Assisted Operations and Reproducibility (Priority: P3)

**Goal**: Optimize deployment using AI and ensure 100% reproducibility.

**Independent Test**: Full `helm uninstall` and reinstall cycle works as expected using automated scripts.

### Implementation for User Story 3

- [x] T019 [US3] Use kagent to analyze cluster health and suggest resource optimizations in `specs/004-k8s-local-deployment/research.md`
- [x] T020 [US3] Create `scripts/verify-deployment.sh` to automate the build and deploy reproducibility test
- [x] T021 [US3] Update `docs/phase4-ai-log.md` with all Gordon, kubectl-ai, and kagent prompts and outputs

**Checkpoint**: All user stories should now be independently functional.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T022 Update root `README.md` with Phase 4 instructions for building and accessing the K8s deployment
- [x] T023 Final validation of `specs/004-k8s-local-deployment/quickstart.md` against the working deployment
- [x] T024 Perform final cleanup and commit all generated YAML/Dockerfiles

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2).
- **User Story 2 (P2)**: Depends on User Story 1 (images must exist).
- **User Story 3 (P3)**: Depends on User Story 2 (deployment must exist for analysis).

### Within Each User Story

- Dockerfiles before Image builds
- Image builds before Helm chart testing
- Helm charts before Deployment

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Phase 1 & 2 (Setup & Foundational)
2. Complete Phase 3 (Containerization)
3. Complete Phase 4 (Helm Deployment)
4. **STOP and VALIDATE**: Test chatbot functionality via Minikube service.

### Incremental Delivery

1. Containerization (US1) → Verify locally.
2. Orchestration (US2) → Verify on cluster.
3. Operations (US3) → Optimize and document.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Verify each story independently (smoke tests)
- Commit after each task or logical group
