---
id: 001
title: Phase 5A Advanced Features Specification
stage: spec
date: 2026-03-05
surface: agent
model: kr/claude-sonnet-4.5
feature: 005-advanced-features
branch: 005-advanced-features
user: Hp
command: /sp.specify
labels: ["spec", "phase5a", "advanced-features", "kafka", "dapr", "priorities", "tags", "search", "filter", "sort", "recurring-tasks", "reminders"]
links:
  spec: specs/005-advanced-features/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/005-advanced-features/spec.md
  - specs/005-advanced-features/checklists/requirements.md
tests:
  - N/A
---

## Prompt

```text
 - Phase 5 Part A (Advanced Features)

**Focus:** Implement all Intermediate and Advanced todo features with event-driven architecture, running locally on Minikube.

## Feature Set 1: Intermediate Features

### 1.1 Priorities & Tags/Categories
**Description:** Allow users to organize tasks with priority levels and tags.

**Acceptance Criteria:**
- [ ] Tasks can have priority level: `high`, `medium`, `low` (default: `medium`)
- [ ] Tasks can have multiple tags (e.g., `work`, `personal`, `shopping`)
- [ ] Priority displayed with visual indicator (color, icon)
- [ ] Tags displayed as badges/chips
- [ ] API supports creating/updating tasks with priority and tags
- [ ] Database schema updated to include `priority` (enum) and `tags` (array/JSON)

**Example:**
```json
{
  "title": "Finish report",
  "priority": "high",
  "tags": ["work", "deadline"]
}
```

### 1.2 Search & Filter
**Description:** Find tasks by keyword and filter by various criteria.

**Acceptance Criteria:**
- Search by keyword in title and description
- Filter by status (all/pending/completed)
- Filter by priority (high/medium/low)
- Filter by tags (multiple select)
- Filter by date range (due date)
- Combine search + filters
- API supports query parameters: ?q=keyword&status=pending&priority=high&tags=work

### 1.3 Sort Tasks
**Description:** Reorder task list by different fields.

**Acceptance Criteria:**
- Sort by due date (ascending/descending)
- Sort by priority (high to low / low to high)
- Sort alphabetically by title
- Sort by creation date
- Sort by completion date
- API supports ?sort=due_date&order=asc

## Feature Set 2: Advanced Features

### 2.1 Recurring Tasks
**Description:** Tasks that automatically reschedule after completion.

**Acceptance Criteria:**
- Tasks can have recurrence pattern: daily, weekly, monthly, custom (cron expression)
- When recurring task marked complete, new task created with next due date
- Original task retains completion status
- New task linked to original (for audit trail)
- Recurrence pattern stored in database
- API supports recurring_pattern field

### 2.2 Due Dates & Reminders
**Description:** Set deadlines and receive notifications.

**Acceptance Criteria:**
- Tasks can have due date (ISO datetime)
- Tasks can have reminder time (before due date)
- Reminders trigger at exact scheduled time (using Dapr Jobs API, not polling)
- Reminders appear as browser notifications (frontend)
- Reminders can be snoozed/dismissed
- API supports due_date and remind_at fields

## Feature Set 3: Event-Driven Architecture (Local Kafka)

### 3.1 Kafka Topics
Topics to create:
- task-events - All task CRUD operations
- reminders - Reminder trigger events
- task-updates - Real-time updates for UI sync

### 3.2 Events to Publish
- Create task → task.created
- Update task → task.updated
- Delete task → task.deleted
- Complete task → task.completed
- Recurring task complete → task.recurring.completed
- Reminder due → reminder.due

### 3.3 Event Consumers (Microservices)
- Recurring Task Service: Listens for task.completed, creates next occurrence
- Notification Service: Listens for reminder.due, sends notifications
- Audit Service: Logs all events for history

## Technology Stack
- Kafka: Strimzi Operator on Minikube (1 broker)
- Dapr: Dapr OSS (Sidecar for all services)
- Pub/Sub: Dapr + Kafka
- State: Dapr + PostgreSQL (Neon)
- Jobs: Dapr Jobs API (Exact-time reminders)
- Services: FastAPI (Existing, plus new microservices)
- Frontend: Next.js (Updated for new features)
```

## Response snapshot

Created comprehensive specification for Phase 5A Advanced Features with 5 prioritized user stories (P1-P5):

**User Stories:**
1. P1: Task Organization with Priorities and Tags (foundation feature)
2. P2: Search and Filter Tasks (builds on P1)
3. P3: Sort Tasks by Multiple Criteria (enhances usability)
4. P4: Recurring Tasks (automation with event-driven architecture)
5. P5: Due Dates and Time-Based Reminders (completes advanced feature set)

**Functional Requirements:** 54 requirements across 5 feature areas:
- FR-001 to FR-008: Priorities & Tags (8 requirements)
- FR-009 to FR-017: Search & Filter (9 requirements)
- FR-018 to FR-024: Sort (7 requirements)
- FR-025 to FR-033: Recurring Tasks (9 requirements)
- FR-034 to FR-044: Due Dates & Reminders (11 requirements)
- FR-045 to FR-054: Event-Driven Architecture (10 requirements)

**Success Criteria:** 14 measurable outcomes including performance targets (2s search, 500ms sort, 5s recurring task generation), accuracy targets (95% reminder accuracy), and user experience metrics.

**Key Entities:** Extended Task model with new fields (priority, tags, due_date, remind_at, recurring_pattern, parent_task_id), TaskEvent for Kafka, Reminder for Dapr Jobs.

**Validation:** All quality checks passed - no [NEEDS CLARIFICATION] markers, all requirements testable, success criteria technology-agnostic.

## Outcome

- ✅ Impact: Complete Phase 5A specification created with 5 independently testable user stories, 54 functional requirements, and 14 success criteria
- 🧪 Tests: Acceptance scenarios defined for all 5 user stories (21 total scenarios), edge cases identified (8 scenarios)
- 📁 Files: 2 files created (spec.md, checklists/requirements.md)
- 🔁 Next prompts: Run `/sp.plan` to create technical implementation plan with event-driven architecture design
- 🧠 Reflection: Specification successfully balances intermediate features (priorities, search, sort) with advanced features (recurring tasks, reminders) while maintaining event-driven architecture requirements. All features designed for local Minikube deployment with zero cloud costs.

## Evaluation notes (flywheel)

- Failure modes observed: None - specification completed successfully with all quality checks passed
- Graders run and results (PASS/FAIL): PASS - No [NEEDS CLARIFICATION] markers, all requirements testable and unambiguous, success criteria technology-agnostic
- Prompt variant (if applicable): Standard /sp.specify workflow with comprehensive feature description
- Next experiment (smallest change to try): Proceed to `/sp.plan` to design event-driven architecture with Kafka/Dapr integration patterns
