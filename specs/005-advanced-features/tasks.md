# Tasks: Phase 5A - Advanced Features with Event-Driven Architecture

**Input**: Design documents from `/specs/005-advanced-features/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the specification, so test tasks are omitted per template guidelines.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`, `microservices/*/src/`
- **Infrastructure**: `k8s/`, `helm/`
- **Contracts**: `specs/005-advanced-features/contracts/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and infrastructure setup

- [x] T001 Create Strimzi installation script in `scripts/install-strimzi.sh`
- [x] T002 Create Kafka cluster YAML in `k8s/strimzi/kafka-cluster.yaml` (1 broker, 1 zookeeper, ephemeral storage)
- [x] T003 Create Kafka topics YAML in `k8s/strimzi/kafka-topics.yaml` (task-events, reminders, task-updates)
- [x] T004 Create Dapr installation script in `scripts/install-dapr.sh`
- [x] T005 [P] Create Dapr Pub/Sub component YAML in `helm/todo-backend/templates/dapr-components/pubsub.yaml`
- [x] T006 [P] Create Dapr State Store component YAML in `helm/todo-backend/templates/dapr-components/statestore.yaml`
- [x] T007 [P] Create Dapr Secrets component YAML in `helm/todo-backend/templates/dapr-components/secrets.yaml`
- [x] T008 [P] Create Dapr Configuration YAML in `k8s/dapr/configuration.yaml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T009 Update Task SQLModel entity in `backend/src/models/task.py` with new fields (priority, tags, due_date, remind_at, recurring_pattern, is_recurring, parent_task_id)
- [x] T010 Create TaskPriority enum in `backend/src/models/task.py`
- [x] T011 Create Alembic migration script in `backend/src/migrations/add_advanced_fields.py` for new Task fields
- [x] T012 Update TaskCreate Pydantic schema in `backend/src/schemas/task.py` with new fields and validation
- [x] T013 Update TaskUpdate Pydantic schema in `backend/src/schemas/task.py` with new fields
- [x] T014 Update TaskResponse Pydantic schema in `backend/src/schemas/task.py` with new fields
- [x] T015 Create TaskEvent Pydantic model in `backend/src/models/events.py` for event payloads
- [x] T016 Create event publisher service in `backend/src/services/event_publisher.py` with Dapr HTTP client
- [x] T017 Update backend Helm deployment in `helm/todo-backend/templates/deployment.yaml` with Dapr annotations
- [x] T018 Run database migration to apply schema changes
- [x] T019 Install Strimzi operator in Minikube (execute `scripts/install-strimzi.sh`)
- [x] T020 Deploy Kafka cluster to Minikube (apply `k8s/strimzi/kafka-cluster.yaml`)
- [x] T021 Create Kafka topics (apply `k8s/strimzi/kafka-topics.yaml`)
- [x] T022 Install Dapr on Minikube (execute `scripts/install-dapr.sh`)
- [x] T023 Deploy Dapr components (apply all YAMLs in `helm/todo-backend/templates/dapr-components/`)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Task Organization with Priorities and Tags (Priority: P1) 🎯 MVP

**Goal**: Enable users to organize tasks with priority levels and tags for better task management

**Independent Test**: Create a task with high priority and multiple tags, verify it displays with visual indicators, filter task list by priority and tags

### Backend Implementation for User Story 1

- [x] T024 [P] [US1] Add priority field validation in `backend/src/schemas/task.py` (only low/medium/high allowed)
- [x] T025 [P] [US1] Add tags field validation in `backend/src/schemas/task.py` (max 20 tags, each max 50 chars)
- [x] T026 [US1] Update create_task endpoint in `backend/src/api/tasks.py` to handle priority and tags fields
- [x] T027 [US1] Update update_task endpoint in `backend/src/api/tasks.py` to handle priority and tags fields
- [x] T028 [US1] Update get_tasks endpoint in `backend/src/api/tasks.py` to add priority filter query param
- [x] T029 [US1] Update get_tasks endpoint in `backend/src/api/tasks.py` to add tags filter query param (multi-select)
- [x] T030 [US1] Create get_user_tags endpoint in `backend/src/api/tasks.py` at `/api/{user_id}/tasks/tags` for autocomplete
- [x] T031 [US1] Add event publishing after task create in `backend/src/api/tasks.py` (task.created.v1 event)
- [x] T032 [US1] Add event publishing after task update in `backend/src/api/tasks.py` (task.updated.v1 event)

### Frontend Implementation for User Story 1

- [x] T033 [P] [US1] Create PriorityBadge component in `frontend/src/components/PriorityBadge.tsx` with color coding (red=high, yellow=medium, blue=low)
- [x] T034 [P] [US1] Create TagChip component in `frontend/src/components/TagChip.tsx` with removable badges
- [x] T035 [US1] Update TaskForm component in `frontend/src/components/TaskForm.tsx` to add priority selector dropdown
- [x] T036 [US1] Update TaskForm component in `frontend/src/components/TaskForm.tsx` to add tags input field (comma-separated)
- [x] T037 [US1] Update TaskList component in `frontend/src/components/TaskList.tsx` to display PriorityBadge for each task
- [x] T038 [US1] Update TaskList component in `frontend/src/components/TaskList.tsx` to display TagChip components for each task
- [x] T039 [US1] Add priority filter dropdown in `frontend/src/components/TaskList.tsx`
- [x] T040 [US1] Add tags filter multi-select in `frontend/src/components/TaskList.tsx`
- [x] T041 [US1] Update taskApi service in `frontend/src/services/taskApi.ts` to include priority and tags in API calls
- [x] T042 [US1] Add tag autocomplete functionality in `frontend/src/components/TaskForm.tsx` using `/api/{user_id}/tasks/tags` endpoint

**Checkpoint**: At this point, User Story 1 should be fully functional - users can create tasks with priorities and tags, filter by them, and see visual indicators

---

## Phase 4: User Story 2 - Search and Filter Tasks (Priority: P2)

**Goal**: Enable users to search for tasks by keyword and filter by multiple criteria

**Independent Test**: Create 20+ tasks with various priorities, tags, and statuses. Search by keyword, apply multiple filters simultaneously, verify results are accurate

### Backend Implementation for User Story 2

- [x] T043 [US2] Add full-text search index creation in `backend/src/migrations/add_search_index.py` using PostgreSQL tsvector
- [x] T044 [US2] Update get_tasks endpoint in `backend/src/api/tasks.py` to add search query parameter (q)
- [x] T045 [US2] Implement search logic in `backend/src/services/task_service.py` using PostgreSQL full-text search
- [x] T046 [US2] Update get_tasks endpoint in `backend/src/api/tasks.py` to add status filter query param (all/pending/completed)
- [x] T047 [US2] Update get_tasks endpoint in `backend/src/api/tasks.py` to add due_date_from and due_date_to query params
- [x] T048 [US2] Implement combined filter logic in `backend/src/services/task_service.py` (search + priority + tags + status + date range)
- [x] T049 [US2] Add result count to response in `backend/src/api/tasks.py`

### Frontend Implementation for User Story 2

- [x] T050 [P] [US2] Add search input field in `frontend/src/components/TaskList.tsx` with debounce (300ms)
- [x] T051 [P] [US2] Add status filter dropdown in `frontend/src/components/TaskList.tsx` (all/pending/completed)
- [x] T052 [P] [US2] Add date range filter in `frontend/src/components/TaskList.tsx` (from/to date pickers)
- [x] T053 [US2] Update taskApi service in `frontend/src/services/taskApi.ts` to support all filter query parameters
- [x] T054 [US2] Add "Clear all filters" button in `frontend/src/components/TaskList.tsx`
- [x] T055 [US2] Display result count in `frontend/src/components/TaskList.tsx`
- [x] T056 [US2] Show "no results found" message when search/filter returns empty in `frontend/src/components/TaskList.tsx`

**Checkpoint**: At this point, User Story 2 should be fully functional - users can search and filter tasks by multiple criteria simultaneously

---

## Phase 5: User Story 3 - Sort Tasks by Multiple Criteria (Priority: P3)

**Goal**: Enable users to sort task list by different fields for better organization

**Independent Test**: Create tasks with various due dates and priorities. Sort by each criterion in ascending and descending order, verify correct ordering

### Backend Implementation for User Story 3

- [x] T057 [US3] Update get_tasks endpoint in `backend/src/api/tasks.py` to add sort_by query param (created_at/due_date/priority/title/completed_at)
- [x] T058 [US3] Update get_tasks endpoint in `backend/src/api/tasks.py` to add sort_order query param (asc/desc)
- [x] T059 [US3] Implement sort logic in `backend/src/services/task_service.py` with null handling (nulls last)
- [x] T060 [US3] Add database indexes for sort fields in `backend/src/migrations/add_sort_indexes.py`

### Frontend Implementation for User Story 3

- [x] T061 [P] [US3] Add sort dropdown in `frontend/src/components/TaskList.tsx` with field selector
- [x] T062 [P] [US3] Add sort order toggle button in `frontend/src/components/TaskList.tsx` (asc/desc)
- [x] T063 [US3] Update taskApi service in `frontend/src/services/taskApi.ts` to support sort parameters
- [x] T064 [US3] Persist sort preference in localStorage in `frontend/src/components/TaskList.tsx`
- [x] T065 [US3] Restore sort preference on page load in `frontend/src/components/TaskList.tsx`

**Checkpoint**: At this point, User Story 3 should be fully functional - users can sort tasks by any criterion and preference is remembered

---

## Phase 6: User Story 4 - Recurring Tasks (Priority: P4)

**Goal**: Enable automatic task rescheduling after completion for routine tasks

**Independent Test**: Create a recurring task with "weekly" pattern. Mark it complete. Verify a new task is created with next week's due date and the original task remains completed

### Backend Implementation for User Story 4

- [x] T066 [P] [US4] Add recurring_pattern validation in `backend/src/schemas/task.py` (daily/weekly/monthly or valid cron)
- [x] T067 [P] [US4] Create recurrence calculation utility in `backend/src/utils/recurrence.py` (calculate next due date)
- [x] T068 [US4] Update complete_task endpoint in `backend/src/api/tasks.py` to check for recurring pattern
- [x] T069 [US4] Add event publishing for recurring task completion in `backend/src/api/tasks.py` (task.recurring.completed.v1 event)

### Microservice Implementation for User Story 4

- [x] T070 [P] [US4] Create recurring-task-service FastAPI app in `microservices/recurring-task-service/src/main.py`
- [x] T071 [P] [US4] Implement Dapr subscription endpoint in `microservices/recurring-task-service/src/main.py` at `/task-completed`
- [x] T072 [US4] Implement recurrence logic in `microservices/recurring-task-service/src/recurrence.py` (daily/weekly/monthly/cron)
- [x] T073 [US4] Implement task creation logic in `microservices/recurring-task-service/src/main.py` (call backend API via Dapr)
- [x] T074 [US4] Add event publishing for new recurring task in `microservices/recurring-task-service/src/main.py`
- [x] T075 [US4] Create Dockerfile for recurring-task-service in `microservices/recurring-task-service/Dockerfile`
- [x] T076 [US4] Create requirements.txt for recurring-task-service in `microservices/recurring-task-service/requirements.txt`
- [x] T077 [US4] Create Dapr subscription YAML in `microservices/recurring-task-service/subscription.yaml`
- [x] T078 [US4] Create Helm chart for recurring-task-service in `helm/recurring-task-service/`
- [x] T079 [US4] Build Docker image for recurring-task-service
- [x] T080 [US4] Deploy recurring-task-service to Minikube with Helm

### Frontend Implementation for User Story 4

- [x] T081 [P] [US4] Add recurring pattern selector in `frontend/src/components/TaskForm.tsx` (daily/weekly/monthly/custom)
- [x] T082 [P] [US4] Add recurring indicator badge in `frontend/src/components/TaskList.tsx`
- [x] T083 [US4] Update taskApi service in `frontend/src/services/taskApi.ts` to include recurring_pattern field
- [x] T084 [US4] Show parent task link for recurring tasks in `frontend/src/components/TaskList.tsx`

**Checkpoint**: At this point, User Story 4 should be fully functional - recurring tasks automatically generate next occurrence on completion

---

## Phase 7: User Story 5 - Due Dates and Time-Based Reminders (Priority: P5)

**Goal**: Enable users to set due dates with reminders and receive notifications

**Independent Test**: Create a task with due date 10 minutes from now and reminder 5 minutes before. Wait for reminder to trigger. Verify notification appears at exact scheduled time

### Backend Implementation for User Story 5

- [x] T085 [P] [US5] Add due_date and remind_at validation in `backend/src/schemas/task.py` (remind_at must be before due_date)
- [x] T086 [P] [US5] Create reminder service in `backend/src/services/reminder_service.py` with Dapr Jobs API integration
- [x] T087 [US5] Update create_task endpoint in `backend/src/api/tasks.py` to schedule reminder if remind_at provided
- [x] T088 [US5] Update update_task endpoint in `backend/src/api/tasks.py` to reschedule reminder if remind_at changed
- [x] T089 [US5] Update delete_task endpoint in `backend/src/api/tasks.py` to cancel reminder
- [x] T090 [US5] Update complete_task endpoint in `backend/src/api/tasks.py` to cancel reminder
- [x] T091 [US5] Create job handler endpoint in `backend/src/api/jobs.py` at `/api/jobs/trigger` for Dapr Jobs callback
- [x] T092 [US5] Add event publishing for reminder.due in `backend/src/api/jobs.py`

### Microservice Implementation for User Story 5

- [x] T093 [P] [US5] Create notification-service FastAPI app in `microservices/notification-service/src/main.py`
- [x] T094 [P] [US5] Implement Dapr subscription endpoint in `microservices/notification-service/src/main.py` at `/reminder-due`
- [x] T095 [US5] Implement notification logging in `microservices/notification-service/src/notifier.py` (Phase 5A - logs only)
- [x] T096 [US5] Create Dockerfile for notification-service in `microservices/notification-service/Dockerfile`
- [x] T097 [US5] Create requirements.txt for notification-service in `microservices/notification-service/requirements.txt`
- [x] T098 [US5] Create Dapr subscription YAML in `microservices/notification-service/subscription.yaml`
- [x] T099 [US5] Create Helm chart for notification-service in `helm/notification-service/`
- [x] T100 [US5] Build Docker image for notification-service
- [x] T101 [US5] Deploy notification-service to Minikube with Helm

### Frontend Implementation for User Story 5

- [x] T102 [P] [US5] Add due date picker in `frontend/src/components/TaskForm.tsx` (date + time)
- [x] T103 [P] [US5] Add reminder checkbox and time selector in `frontend/src/components/TaskForm.tsx`
- [x] T104 [P] [US5] Create ReminderNotification component in `frontend/src/components/ReminderNotification.tsx` for browser notifications
- [x] T105 [US5] Request browser notification permission on first use in `frontend/src/components/ReminderNotification.tsx`
- [x] T106 [US5] Implement snooze functionality in `frontend/src/components/ReminderNotification.tsx` (10 min, 1 hour)
- [x] T107 [US5] Implement dismiss functionality in `frontend/src/components/ReminderNotification.tsx`
- [x] T108 [US5] Highlight overdue tasks in red in `frontend/src/components/TaskList.tsx`
- [x] T109 [US5] Update taskApi service in `frontend/src/services/taskApi.ts` to include due_date and remind_at fields

**Checkpoint**: At this point, User Story 5 should be fully functional - users can set due dates with reminders and receive browser notifications

---

## Phase 8: Audit Service (Cross-Cutting)

**Purpose**: Log all task events for audit trail

- [x] T110 [P] Create audit-service FastAPI app in `microservices/audit-service/src/main.py`
- [x] T111 [P] Implement Dapr subscription endpoint in `microservices/audit-service/src/main.py` at `/audit-event`
- [x] T112 Implement event logging in `microservices/audit-service/src/logger.py` (log to file or database)
- [x] T113 Create Dockerfile for audit-service in `microservices/audit-service/Dockerfile`
- [x] T114 Create requirements.txt for audit-service in `microservices/audit-service/requirements.txt`
- [x] T115 Create Dapr subscription YAML in `microservices/audit-service/subscription.yaml`
- [x] T116 Create Helm chart for audit-service in `helm/audit-service/`
- [x] T117 Build Docker image for audit-service
- [x] T118 Deploy audit-service to Minikube with Helm

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T119 [P] Update README.md with Phase 5A setup instructions
- [x] T120 [P] Document Kafka management commands in `docs/kafka-management.md`
- [x] T121 [P] Document Dapr commands in `docs/dapr-commands.md`
- [x] T122 [P] Create troubleshooting guide in `docs/troubleshooting.md`
- [x] T123 [P] Create demo script in `docs/phase5a-demo-script.md`
- [x] T124 Verify all Dapr components are deployed and healthy
- [x] T125 Verify all Kafka topics are created and accessible
- [x] T126 Verify event flow end-to-end (create task → event published → microservice consumes)
- [x] T127 Run quickstart.md validation (follow all steps, verify success)
- [x] T128 Performance testing for search/filter (<2s for 1000 tasks)
- [x] T129 Performance testing for sort (<500ms)
- [x] T130 Performance testing for recurring task generation (<5s)
- [x] T131 Verify resource usage within 4GB Minikube limit

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5)
- **Audit Service (Phase 8)**: Can be developed in parallel with user stories
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Builds on US1 but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Builds on US1/US2 but independently testable
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Requires event infrastructure from Phase 2
- **User Story 5 (P5)**: Can start after Foundational (Phase 2) - Requires Dapr Jobs from Phase 2

### Within Each User Story

- Backend tasks before frontend tasks (API must exist before UI can call it)
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Within each user story, tasks marked [P] can run in parallel
- Audit service (Phase 8) can be developed in parallel with user stories

---

## Parallel Example: User Story 1

```bash
# Launch all parallel backend tasks for User Story 1 together:
Task T024: "Add priority field validation in backend/src/schemas/task.py"
Task T025: "Add tags field validation in backend/src/schemas/task.py"

# Launch all parallel frontend tasks for User Story 1 together:
Task T033: "Create PriorityBadge component in frontend/src/components/PriorityBadge.tsx"
Task T034: "Create TagChip component in frontend/src/components/TagChip.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
   - Developer D: User Story 4 + Audit Service
   - Developer E: User Story 5
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Summary

**Total Tasks**: 131
**Task Count by User Story**:
- Setup: 8 tasks
- Foundational: 15 tasks (BLOCKS all user stories)
- User Story 1 (P1): 19 tasks
- User Story 2 (P2): 14 tasks
- User Story 3 (P3): 9 tasks
- User Story 4 (P4): 19 tasks
- User Story 5 (P5): 25 tasks
- Audit Service: 9 tasks
- Polish: 13 tasks

**Parallel Opportunities**: 47 tasks marked [P] can run in parallel within their phase

**Independent Test Criteria**:
- US1: Create task with priority/tags, verify display and filtering
- US2: Search and filter 20+ tasks, verify accurate results
- US3: Sort tasks by multiple criteria, verify correct ordering
- US4: Create recurring task, mark complete, verify new task generated
- US5: Create task with reminder, verify notification at exact time

**Suggested MVP Scope**: Phase 1 (Setup) + Phase 2 (Foundational) + Phase 3 (User Story 1)

**Ready for Implementation** ✅
