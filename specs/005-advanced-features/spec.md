# Feature Specification: Phase 5A - Advanced Features with Event-Driven Architecture

**Feature Branch**: `005-advanced-features`
**Created**: 2026-03-05
**Status**: Draft
**Input**: User description: "Phase 5A - Advanced Features with Local Kafka/Dapr - Implement all Intermediate and Advanced todo features with event-driven architecture, running locally on Minikube"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Task Organization with Priorities and Tags (Priority: P1)

As a user, I want to organize my tasks with priority levels and tags so that I can quickly identify what's most important and categorize tasks by context (work, personal, shopping, etc.).

**Why this priority**: Foundation for all other features - enables users to add structure to their task list immediately. Most requested feature for task management apps.

**Independent Test**: Create a task with high priority and multiple tags, verify it displays with visual indicators, filter task list by priority and tags.

**Acceptance Scenarios**:

1. **Given** I am creating a new task, **When** I set priority to "high" and add tags "work" and "deadline", **Then** the task is saved with priority and tags, and displays with a red indicator and tag badges
2. **Given** I have tasks with different priorities, **When** I view my task list, **Then** high priority tasks are visually distinct from medium and low priority tasks
3. **Given** I have tasks with various tags, **When** I click on a tag, **Then** I see only tasks with that tag
4. **Given** I am editing an existing task, **When** I change the priority from medium to high, **Then** the task updates and the visual indicator changes immediately

---

### User Story 2 - Search and Filter Tasks (Priority: P2)

As a user, I want to search for tasks by keyword and filter by multiple criteria so that I can quickly find specific tasks in a large list.

**Why this priority**: Becomes critical as task list grows. Builds on P1 (priorities/tags) to provide powerful task discovery.

**Independent Test**: Create 20+ tasks with various priorities, tags, and statuses. Search by keyword, apply multiple filters simultaneously, verify results are accurate.

**Acceptance Scenarios**:

1. **Given** I have 50 tasks in my list, **When** I search for "report", **Then** I see only tasks with "report" in the title or description
2. **Given** I have tasks with different statuses, **When** I filter by "completed", **Then** I see only completed tasks
3. **Given** I have tasks with various priorities, **When** I filter by "high priority" and "work" tag, **Then** I see only high priority tasks tagged with "work"
4. **Given** I have applied filters, **When** I clear all filters, **Then** I see my complete task list again
5. **Given** I search for a keyword that doesn't exist, **When** the search completes, **Then** I see a "no results found" message

---

### User Story 3 - Sort Tasks by Multiple Criteria (Priority: P3)

As a user, I want to sort my task list by different fields (due date, priority, creation date, title) so that I can view tasks in the order most relevant to my current needs.

**Why this priority**: Enhances usability after search/filter are in place. Helps users organize their workflow.

**Independent Test**: Create tasks with various due dates and priorities. Sort by each criterion in ascending and descending order, verify correct ordering.

**Acceptance Scenarios**:

1. **Given** I have tasks with different due dates, **When** I sort by "due date ascending", **Then** tasks with nearest due dates appear first
2. **Given** I have tasks with different priorities, **When** I sort by "priority descending", **Then** high priority tasks appear first, followed by medium, then low
3. **Given** I have tasks sorted by due date, **When** I change sort to "alphabetical by title", **Then** tasks reorder alphabetically
4. **Given** I have sorted my tasks, **When** I refresh the page, **Then** my sort preference is remembered

---

### User Story 4 - Recurring Tasks (Priority: P4)

As a user, I want to create tasks that automatically reschedule after completion so that I don't have to manually recreate routine tasks like "weekly team meeting" or "monthly report".

**Why this priority**: High-value automation feature. Requires event-driven architecture to work properly.

**Independent Test**: Create a recurring task with "weekly" pattern. Mark it complete. Verify a new task is created with next week's due date and the original task remains completed.

**Acceptance Scenarios**:

1. **Given** I am creating a task, **When** I set recurrence to "weekly" with due date "2026-03-13", **Then** the task is saved with recurrence pattern
2. **Given** I have a weekly recurring task, **When** I mark it complete, **Then** a new task is created with due date "2026-03-20" (7 days later)
3. **Given** I complete a recurring task, **When** I view my task history, **Then** I see both the completed original and the new task, linked together
4. **Given** I have a monthly recurring task, **When** I mark it complete on March 15, **Then** a new task is created with due date April 15
5. **Given** I have a recurring task, **When** I edit it to remove recurrence, **Then** future occurrences stop generating

---

### User Story 5 - Due Dates and Time-Based Reminders (Priority: P5)

As a user, I want to set due dates with specific times and receive reminders before deadlines so that I never miss important tasks.

**Why this priority**: Completes the advanced feature set. Requires Dapr Jobs for exact-time scheduling.

**Independent Test**: Create a task with due date 10 minutes from now and reminder 5 minutes before. Wait for reminder to trigger. Verify notification appears at exact scheduled time.

**Acceptance Scenarios**:

1. **Given** I am creating a task, **When** I set due date to "2026-03-20 10:00 AM" with reminder "1 hour before", **Then** the task is saved with due date and reminder time
2. **Given** I have a task with reminder scheduled, **When** the reminder time arrives, **Then** I receive a browser notification with task title
3. **Given** I receive a reminder notification, **When** I click "snooze for 10 minutes", **Then** the reminder reappears in 10 minutes
4. **Given** I receive a reminder notification, **When** I click "dismiss", **Then** the reminder does not reappear
5. **Given** I have tasks with various due dates, **When** I view my task list, **Then** overdue tasks are highlighted in red
6. **Given** I have a task with due date, **When** I mark it complete before the due date, **Then** the reminder is cancelled

---

### Edge Cases

- What happens when a user creates a recurring task with an invalid pattern (e.g., "every 0 days")?
- How does the system handle reminders for tasks that are deleted before the reminder time?
- What happens when a user has 100+ tags - how is the tag selector displayed?
- How does search perform with 10,000+ tasks?
- What happens when a recurring task is completed multiple times rapidly (race condition)?
- How does the system handle timezone changes for due dates and reminders?
- What happens when Kafka is temporarily unavailable - do events queue or fail?
- How does the system handle browser notifications when permission is denied?

## Requirements *(mandatory)*

### Functional Requirements

#### Priorities & Tags (P1)

- **FR-001**: System MUST support three priority levels: high, medium, low (default: medium)
- **FR-002**: System MUST allow users to add multiple tags to a single task
- **FR-003**: System MUST display priority with visual indicators (color coding: red for high, yellow for medium, blue for low)
- **FR-004**: System MUST display tags as removable badges/chips on task cards
- **FR-005**: System MUST persist priority and tags in the database
- **FR-006**: System MUST validate priority values (only high/medium/low accepted)
- **FR-007**: System MUST allow users to create new tags on-the-fly while creating/editing tasks
- **FR-008**: System MUST support tag autocomplete based on existing tags

#### Search & Filter (P2)

- **FR-009**: System MUST support full-text search across task title and description
- **FR-010**: System MUST support filtering by status (all, pending, completed)
- **FR-011**: System MUST support filtering by priority (high, medium, low)
- **FR-012**: System MUST support filtering by one or more tags (multi-select)
- **FR-013**: System MUST support filtering by due date range (from date, to date)
- **FR-014**: System MUST allow combining search keyword with multiple filters simultaneously
- **FR-015**: System MUST return results in under 2 seconds for lists up to 1,000 tasks
- **FR-016**: System MUST display result count after applying search/filters
- **FR-017**: System MUST provide a "clear all filters" action

#### Sort (P3)

- **FR-018**: System MUST support sorting by due date (ascending/descending)
- **FR-019**: System MUST support sorting by priority (high to low / low to high)
- **FR-020**: System MUST support sorting by title (alphabetical A-Z / Z-A)
- **FR-021**: System MUST support sorting by creation date (newest/oldest first)
- **FR-022**: System MUST support sorting by completion date (newest/oldest first)
- **FR-023**: System MUST remember user's sort preference across sessions
- **FR-024**: System MUST handle sorting of tasks with null values (e.g., no due date) by placing them at the end

#### Recurring Tasks (P4)

- **FR-025**: System MUST support recurrence patterns: daily, weekly, monthly
- **FR-026**: System MUST support custom recurrence using cron expressions (e.g., "every Monday and Friday")
- **FR-027**: System MUST automatically create a new task when a recurring task is marked complete
- **FR-028**: System MUST calculate next due date based on recurrence pattern (daily: +1 day, weekly: +7 days, monthly: +1 month)
- **FR-029**: System MUST preserve original task as completed (not delete or modify it)
- **FR-030**: System MUST link new task to original task for audit trail (parent_task_id)
- **FR-031**: System MUST copy all properties from original task to new task (title, description, priority, tags) except completion status
- **FR-032**: System MUST allow users to stop recurrence by editing the task
- **FR-033**: System MUST handle edge cases (e.g., monthly recurrence on Jan 31 → Feb 28/29)

#### Due Dates & Reminders (P5)

- **FR-034**: System MUST support due dates with date and time (ISO 8601 format)
- **FR-035**: System MUST support reminder time as offset before due date (e.g., "1 hour before", "1 day before")
- **FR-036**: System MUST trigger reminders at exact scheduled time (no polling, use scheduled jobs)
- **FR-037**: System MUST send browser notifications when reminder triggers
- **FR-038**: System MUST include task title and due date in reminder notification
- **FR-039**: System MUST support snooze action (10 minutes, 1 hour, custom)
- **FR-040**: System MUST support dismiss action (cancel reminder permanently)
- **FR-041**: System MUST highlight overdue tasks (due date passed and not completed)
- **FR-042**: System MUST cancel reminder if task is completed before reminder time
- **FR-043**: System MUST cancel reminder if task is deleted before reminder time
- **FR-044**: System MUST request browser notification permission on first use

#### Event-Driven Architecture (Infrastructure)

- **FR-045**: System MUST publish event when task is created (event type: task.created)
- **FR-046**: System MUST publish event when task is updated (event type: task.updated, include before/after diff)
- **FR-047**: System MUST publish event when task is deleted (event type: task.deleted)
- **FR-048**: System MUST publish event when task is completed (event type: task.completed)
- **FR-049**: System MUST publish event when recurring task is completed (event type: task.recurring.completed)
- **FR-050**: System MUST publish event when reminder is due (event type: reminder.due)
- **FR-051**: System MUST include user_id in all events for multi-tenancy isolation
- **FR-052**: System MUST version event schemas (e.g., task.created.v1)
- **FR-053**: System MUST use Dapr Pub/Sub component (no direct Kafka client code)
- **FR-054**: System MUST handle event publishing failures gracefully (log error, don't block user action)

### Key Entities

- **Task (Extended)**: Existing task entity with new fields:
  - `priority`: enum (high, medium, low) - default medium
  - `tags`: array of strings - default empty array
  - `due_date`: ISO 8601 datetime - nullable
  - `remind_at`: ISO 8601 datetime - nullable
  - `recurring_pattern`: string (daily, weekly, monthly, cron expression) - nullable
  - `parent_task_id`: integer - nullable (links to original recurring task)
  - `is_recurring`: boolean - default false

- **TaskEvent**: Event payload for Kafka topics
  - `event_id`: unique identifier
  - `event_type`: string (task.created, task.updated, etc.)
  - `event_version`: string (v1)
  - `timestamp`: ISO 8601 datetime
  - `user_id`: integer
  - `task_id`: integer
  - `payload`: JSON object (task data or diff)

- **Reminder**: Scheduled reminder (managed by Dapr Jobs)
  - `reminder_id`: unique identifier
  - `task_id`: integer
  - `user_id`: integer
  - `scheduled_time`: ISO 8601 datetime
  - `status`: enum (pending, triggered, snoozed, dismissed, cancelled)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can organize tasks with priorities and tags, reducing time to find important tasks by 50%
- **SC-002**: Users can search and filter 1,000+ tasks and receive results in under 2 seconds
- **SC-003**: Users can sort tasks by any criterion with instant visual feedback (under 500ms)
- **SC-004**: Recurring tasks automatically generate next occurrence within 5 seconds of completion
- **SC-005**: Reminders trigger at exact scheduled time with 95% accuracy (within 30 seconds of target time)
- **SC-006**: System handles 100 concurrent users creating/updating tasks without degradation
- **SC-007**: Event publishing succeeds for 99% of task operations (1% acceptable failure rate with logging)
- **SC-008**: All advanced features run locally on Minikube within 4GB memory limit
- **SC-009**: Zero cloud costs incurred during Phase 5A development and testing
- **SC-010**: 90% of users successfully use at least 3 of the 5 advanced features within first week

### User Experience Outcomes

- **SC-011**: Users report task management is "significantly easier" compared to basic CRUD operations
- **SC-012**: Users successfully create recurring tasks without consulting documentation
- **SC-013**: Users receive and act on reminders without missing deadlines
- **SC-014**: Task list remains responsive and usable with 500+ tasks

## Assumptions

1. **Browser Support**: Modern browsers with notification API support (Chrome, Firefox, Safari, Edge)
2. **Timezone Handling**: All times stored in UTC, displayed in user's local timezone
3. **Tag Limit**: Maximum 20 tags per task (reasonable limit for usability)
4. **Search Performance**: Full-text search uses database capabilities (PostgreSQL full-text search or similar)
5. **Recurrence Calculation**: Monthly recurrence uses same day of month (Jan 15 → Feb 15), with fallback to last day if day doesn't exist (Jan 31 → Feb 28/29)
6. **Event Retention**: Kafka topics retain events for 7 days (configurable)
7. **Reminder Scheduling**: Dapr Jobs API used for exact-time scheduling (not polling)
8. **Notification Delivery**: Browser must be open to receive notifications (no push notifications to mobile devices)
9. **Concurrent Editing**: Last write wins (no conflict resolution for simultaneous edits)
10. **Local Development**: All services run in Minikube with Strimzi Kafka (1 broker, 1 zookeeper)

## Out of Scope (Phase 5B - Cloud Deployment)

- Production cloud deployment (OKE/AKS/GKE)
- SSL certificates and domain configuration
- Load balancing and autoscaling
- Multi-region deployment
- Real user monitoring and analytics
- Mobile push notifications
- Offline support
- Collaborative task sharing between users
- Task attachments or file uploads
- Calendar integration
- Email notifications (only browser notifications)

## Dependencies

- **Phase 4 Completion**: Local Kubernetes deployment with frontend/backend running in Minikube
- **Strimzi Operator**: Kafka cluster running in Minikube
- **Dapr Installation**: Dapr runtime installed in Minikube with sidecars enabled
- **Database Migration**: Neon PostgreSQL schema updated with new task fields
- **Browser Permissions**: Users must grant notification permission

## Risks

1. **Resource Constraints**: Kafka + Dapr + existing services may exceed 4GB Minikube limit
   - Mitigation: Use minimal Kafka configuration (1 broker, 1 zookeeper, reduced memory)

2. **Event Ordering**: Kafka partition ordering may cause race conditions for rapid task updates
   - Mitigation: Use task_id as partition key to ensure ordering per task

3. **Reminder Accuracy**: Dapr Jobs may have scheduling delays under load
   - Mitigation: Accept 30-second tolerance window, log delays for monitoring

4. **Browser Notification Reliability**: Users may deny permission or close browser
   - Mitigation: Provide in-app notification fallback, educate users on permission requirement

5. **Recurring Task Complexity**: Cron expressions may be difficult for users to understand
   - Mitigation: Provide preset options (daily, weekly, monthly) with optional advanced mode

## Next Steps

1. Run `/sp.clarify` if any requirements need user input
2. Run `/sp.plan` to create technical implementation plan
3. Run `/sp.tasks` to generate actionable task list
4. Implement features incrementally in priority order (P1 → P2 → P3 → P4 → P5)
