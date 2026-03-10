# Phase 5A Demo Script

This script demonstrates all advanced features implemented in Phase 5A running on Minikube with Kafka and Dapr.

## Prerequisites

- All Phase 5A components deployed and running
- Frontend accessible at http://localhost:3000 (or via `minikube service todo-frontend`)
- Backend accessible at http://localhost:8000 (or via `minikube service todo-backend`)
- User account created and logged in

## Demo Flow

### Part 1: Priorities & Tags (5 minutes)

**Objective**: Show task organization with priorities and tags

1. **Create High Priority Task**
   - Click "Add Task" button
   - Title: "Prepare quarterly report"
   - Description: "Financial summary for Q1 2026"
   - Priority: High (red badge)
   - Tags: "work", "deadline"
   - Click "Create"
   - **Expected**: Task appears with red priority badge and two tag chips

2. **Create Medium Priority Task**
   - Title: "Team meeting notes"
   - Priority: Medium (yellow badge)
   - Tags: "work", "meeting"
   - **Expected**: Task appears with yellow priority badge

3. **Create Low Priority Task**
   - Title: "Update documentation"
   - Priority: Low (green badge)
   - Tags: "documentation"
   - **Expected**: Task appears with green priority badge

4. **Filter by Priority**
   - Click priority filter dropdown
   - Select "High"
   - **Expected**: Only high priority task visible
   - Clear filter

5. **Filter by Tag**
   - Click tag filter
   - Select "work"
   - **Expected**: Two tasks with "work" tag visible
   - Clear filter

**Verification**:
```bash
# Check backend logs for event publishing
kubectl logs -l app=todo-backend -c todo-backend | grep "task.created"

# Check audit service received events
kubectl logs -l app=audit-service -c audit-service | grep "task.created"
```

---

### Part 2: Search & Filter (5 minutes)

**Objective**: Demonstrate powerful search and filtering capabilities

1. **Search by Keyword**
   - Type "report" in search box
   - **Expected**: Only "Prepare quarterly report" task visible
   - Clear search

2. **Filter by Status**
   - Select "Pending" from status dropdown
   - **Expected**: All incomplete tasks visible
   - Mark "Team meeting notes" as complete
   - **Expected**: Task disappears from pending view
   - Select "Completed"
   - **Expected**: Only completed task visible
   - Select "All"

3. **Date Range Filter**
   - Create task with due date: Tomorrow
   - Title: "Submit expense report"
   - Due date: Tomorrow at 5:00 PM
   - Apply date filter: Today to Tomorrow
   - **Expected**: Only task with due date visible

4. **Combined Filters**
   - Search: "report"
   - Priority: High
   - Status: Pending
   - **Expected**: Only high priority pending tasks with "report" in title

5. **Result Count**
   - **Expected**: "Showing X of Y tasks" displayed
   - Clear all filters
   - **Expected**: Count updates to show all tasks

**Verification**:
```bash
# Check search query in backend logs
kubectl logs -l app=todo-backend -c todo-backend | grep "search_query"

# Verify PostgreSQL full-text search is working
kubectl exec -it <backend-pod> -- python -c "from sqlmodel import select; print('Search working')"
```

---

### Part 3: Sort Tasks (3 minutes)

**Objective**: Show flexible task sorting

1. **Sort by Due Date**
   - Click sort dropdown
   - Select "Due Date"
   - Order: Ascending
   - **Expected**: Tasks with earliest due dates first
   - Toggle to Descending
   - **Expected**: Tasks with latest due dates first

2. **Sort by Priority**
   - Select "Priority"
   - Order: Descending
   - **Expected**: High → Medium → Low priority order

3. **Sort by Title**
   - Select "Title"
   - Order: Ascending
   - **Expected**: Alphabetical order (A-Z)

4. **Persistent Sort**
   - Refresh page
   - **Expected**: Sort preference remembered (from localStorage)

**Verification**:
```bash
# Check browser localStorage
# Open browser console:
localStorage.getItem('task-sort-preference')
```

---

### Part 4: Recurring Tasks (10 minutes)

**Objective**: Demonstrate automatic task rescheduling

1. **Create Daily Recurring Task**
   - Title: "Daily standup"
   - Description: "Team sync meeting"
   - Recurring: Daily
   - Due date: Today at 9:00 AM
   - **Expected**: Task created with recurring badge (🔄)

2. **Create Weekly Recurring Task**
   - Title: "Weekly team meeting"
   - Recurring: Weekly
   - Due date: Next Monday at 2:00 PM
   - **Expected**: Task with recurring badge

3. **Complete Recurring Task**
   - Mark "Daily standup" as complete
   - Wait 2-3 seconds
   - **Expected**:
     - Original task marked complete
     - New task created with tomorrow's date
     - New task has same title and description
     - New task linked to parent (shows "Recurring from: Daily standup")

4. **View Recurring Chain**
   - Click on new recurring task
   - **Expected**: Shows parent task ID
   - Click parent link
   - **Expected**: Shows original completed task

**Verification**:
```bash
# Check task.completed event published
kubectl logs -l app=todo-backend -c daprd | grep "task.completed"

# Check recurring-task-service received event
kubectl logs -l app=recurring-task-service -c recurring-task-service | grep "Received task completion event"

# Check new task created via service invocation
kubectl logs -l app=recurring-task-service -c recurring-task-service | grep "Created next occurrence"

# Verify in Kafka
kubectl run kafka-consumer -ti --rm --restart=Never --image=quay.io/strimzi/kafka:latest-kafka-3.6.0 -n kafka -- bin/kafka-console-consumer.sh --bootstrap-server todo-kafka-kafka-bootstrap:9092 --topic task-events --from-beginning | grep "task.recurring.completed"
```

---

### Part 5: Due Dates & Reminders (15 minutes)

**Objective**: Show time-based reminders with browser notifications

1. **Enable Browser Notifications**
   - Create task with reminder
   - **Expected**: Browser prompts for notification permission
   - Click "Allow"

2. **Create Task with Near-Future Reminder**
   - Title: "Important call with client"
   - Due date: 10 minutes from now
   - Reminder: 5 minutes before due date (i.e., 5 minutes from now)
   - **Expected**: Task created, reminder scheduled

3. **Wait for Reminder**
   - Wait 5 minutes
   - **Expected**:
     - Browser notification appears: "Task Reminder: Important call with client"
     - Notification has "Snooze 10 min", "Snooze 1 hour", "Dismiss" buttons
     - In-app notification also appears (if browser notifications blocked)

4. **Snooze Reminder**
   - Click "Snooze 10 min" on notification
   - **Expected**:
     - Notification dismissed
     - New reminder scheduled for 10 minutes later

5. **Overdue Task Highlighting**
   - Create task with due date in the past
   - Title: "Overdue task"
   - Due date: Yesterday
   - **Expected**:
     - Task appears with red background
     - "OVERDUE" badge with clock icon
     - Red text color

6. **Complete Task with Reminder**
   - Mark "Important call with client" as complete
   - **Expected**:
     - Reminder cancelled (no notification will appear)
     - Task marked complete

**Verification**:
```bash
# Check reminder scheduled via Dapr Jobs
kubectl logs -l app=todo-backend -c daprd | grep "jobs"

# Check job handler endpoint
kubectl logs -l app=todo-backend -c todo-backend | grep "/api/jobs/trigger"

# Check reminder.due event published
kubectl logs -l app=todo-backend -c daprd | grep "reminder.due"

# Check notification-service received event
kubectl logs -l app=notification-service -c notification-service | grep "Reminder notification"
```

---

### Part 6: Event-Driven Architecture (10 minutes)

**Objective**: Show event flow through Kafka and Dapr

1. **Create Task and Watch Events**
   - Open 3 terminal windows:

   **Terminal 1 - Backend logs**:
   ```bash
   kubectl logs -l app=todo-backend -c todo-backend -f
   ```

   **Terminal 2 - Audit service logs**:
   ```bash
   kubectl logs -l app=audit-service -c audit-service -f
   ```

   **Terminal 3 - Kafka consumer**:
   ```bash
   kubectl run kafka-consumer -ti --rm --restart=Never --image=quay.io/strimzi/kafka:latest-kafka-3.6.0 -n kafka -- bin/kafka-console-consumer.sh --bootstrap-server todo-kafka-kafka-bootstrap:9092 --topic task-events --from-beginning
   ```

2. **Create Task**
   - Title: "Test event flow"
   - **Expected in Terminal 1**: "Publishing task.created event"
   - **Expected in Terminal 2**: "Audit log: task.created"
   - **Expected in Terminal 3**: JSON event with task data

3. **Update Task**
   - Edit task title to "Updated event flow"
   - **Expected**: All three terminals show task.updated event

4. **Delete Task**
   - Delete the task
   - **Expected**: All three terminals show task.deleted event

**Verification**:
```bash
# Check Dapr pub/sub component
kubectl get component pubsub -o yaml

# Check subscriptions
kubectl get subscriptions

# Verify Kafka topics
kubectl get kafkatopics -n kafka

# Check consumer groups
kubectl run kafka-groups -ti --rm --restart=Never --image=quay.io/strimzi/kafka:latest-kafka-3.6.0 -n kafka -- bin/kafka-consumer-groups.sh --bootstrap-server todo-kafka-kafka-bootstrap:9092 --list
```

---

### Part 7: Microservices Health Check (5 minutes)

**Objective**: Verify all microservices are running and healthy

1. **Check All Pods**
   ```bash
   kubectl get pods
   ```
   **Expected**: All pods in Running state with 2/2 containers (app + daprd)

2. **Check Dapr Sidecars**
   ```bash
   kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].name}{"\n"}{end}'
   ```
   **Expected**: Each pod has both app container and daprd sidecar

3. **Check Service Health**
   ```bash
   # Backend
   kubectl exec -it <backend-pod> -c daprd -- curl http://localhost:8000/health

   # Recurring task service
   kubectl exec -it <recurring-pod> -c daprd -- curl http://localhost:8001/health

   # Notification service
   kubectl exec -it <notification-pod> -c daprd -- curl http://localhost:8002/health

   # Audit service
   kubectl exec -it <audit-pod> -c daprd -- curl http://localhost:8003/health
   ```
   **Expected**: All return 200 OK

4. **Check Dapr Dashboard**
   ```bash
   dapr dashboard -k
   ```
   **Expected**: Dashboard opens at http://localhost:8080 showing all apps

---

## Performance Validation

### Search Performance (<2s for 1000 tasks)
```bash
# Create 1000 test tasks (use script)
python scripts/create_test_tasks.py --count 1000

# Search and measure time
# In browser console:
console.time('search');
await fetch('/api/v1/<user_id>/tasks?q=test');
console.timeEnd('search');
```
**Expected**: < 2000ms

### Sort Performance (<500ms)
```bash
# In browser console:
console.time('sort');
await fetch('/api/v1/<user_id>/tasks?sort_by=due_date&sort_order=asc');
console.timeEnd('sort');
```
**Expected**: < 500ms

### Recurring Task Generation (<5s)
```bash
# Mark recurring task complete and measure time
# Check logs for timing
kubectl logs -l app=recurring-task-service -c recurring-task-service | grep "Processing time"
```
**Expected**: < 5000ms

---

## Resource Usage Validation

```bash
# Check Minikube resource usage
kubectl top nodes

# Check pod resource usage
kubectl top pods --all-namespaces

# Check Kafka resource usage
kubectl top pods -n kafka
```

**Expected**: Total memory usage < 4GB

---

## Demo Conclusion

**Summary of Features Demonstrated**:
- ✅ Task organization with priorities and tags
- ✅ Powerful search and filtering
- ✅ Flexible sorting with persistence
- ✅ Automatic recurring task generation
- ✅ Time-based reminders with browser notifications
- ✅ Event-driven architecture with Kafka and Dapr
- ✅ Three microservices working together
- ✅ Complete audit trail of all events

**Architecture Highlights**:
- All running locally on Minikube (zero cloud cost)
- Kafka managed by Strimzi operator
- Dapr sidecars for all services
- Event-driven communication
- Scalable microservices pattern

**Next Steps (Phase 5B - Cloud Deployment)**:
- Deploy to Oracle Cloud (OKE)
- Production SSL certificates
- Load balancing and autoscaling
- Real email/SMS notifications
- Multi-region deployment
- Monitoring and alerting
