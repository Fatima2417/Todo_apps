# Research: Phase 5A - Advanced Features with Event-Driven Architecture

**Feature**: 005-advanced-features
**Date**: 2026-03-05
**Phase**: 0 - Research & Technical Decisions

## Overview

This document captures research findings and technical decisions for implementing advanced task management features with event-driven architecture using Kafka (Strimzi) and Dapr on local Minikube.

## Research Areas

### 1. PostgreSQL Array/JSON Fields for Tags

**Decision**: Use PostgreSQL ARRAY type for tags field

**Rationale**:
- Native PostgreSQL ARRAY type provides better performance for tag queries
- SQLModel supports List[str] mapping to PostgreSQL ARRAY
- Enables efficient filtering with `ANY` operator: `WHERE 'work' = ANY(tags)`
- Better indexing support with GIN indexes for array containment queries
- Simpler schema than separate tags table with many-to-many relationship

**Alternatives Considered**:
- JSON/JSONB field: More flexible but slower queries, no native array operations
- Separate tags table: Normalized but adds complexity, requires joins, overkill for simple tag list
- Comma-separated string: Poor performance, no type safety, difficult to query

**Implementation**:
```python
from sqlmodel import Field, SQLModel
from typing import List, Optional

class Task(SQLModel, table=True):
    tags: List[str] = Field(default_factory=list, sa_column_kwargs={"type_": ARRAY(String)})
```

### 2. Enum vs String for Priority Field

**Decision**: Use Python Enum with PostgreSQL ENUM type

**Rationale**:
- Type safety at application and database level
- Prevents invalid priority values
- Better performance than string comparison
- Clear contract in API documentation
- SQLModel/Pydantic native enum support

**Alternatives Considered**:
- String with validation: Less type-safe, allows typos, no DB-level constraint
- Integer (1=low, 2=medium, 3=high): Less readable, magic numbers, harder to maintain

**Implementation**:
```python
from enum import Enum

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Task(SQLModel, table=True):
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM)
```

### 3. Full-Text Search Strategy

**Decision**: Use PostgreSQL built-in full-text search with tsvector

**Rationale**:
- No additional dependencies (Elasticsearch, etc.)
- Sufficient for 10,000 tasks per user
- Meets <2s performance requirement
- Supports ranking and relevance scoring
- Works with existing Neon PostgreSQL

**Alternatives Considered**:
- Elasticsearch: Overkill for scale, adds infrastructure complexity, violates zero cloud spend
- Simple LIKE/ILIKE: Poor performance on large datasets, no ranking
- Third-party search service: Violates zero cloud spend principle

**Implementation**:
```python
# Add tsvector column for search
search_vector: Optional[str] = Field(sa_column=Column(TSVector))

# Create GIN index
CREATE INDEX idx_task_search ON task USING GIN(search_vector);

# Query with ranking
SELECT * FROM task
WHERE search_vector @@ to_tsquery('report & deadline')
ORDER BY ts_rank(search_vector, to_tsquery('report & deadline')) DESC;
```

### 4. Recurring Task Pattern Storage

**Decision**: Use string field with predefined patterns + optional cron expression

**Rationale**:
- Simple patterns (daily, weekly, monthly) stored as strings
- Advanced users can provide cron expression
- Validation at application layer
- Flexible for future pattern additions

**Alternatives Considered**:
- Separate fields for interval/unit: More normalized but complex for cron expressions
- JSON object: Flexible but harder to validate, no type safety
- Enum only: Too restrictive, doesn't support custom patterns

**Implementation**:
```python
class Task(SQLModel, table=True):
    recurring_pattern: Optional[str] = Field(default=None)  # "daily", "weekly", "monthly", or cron
    is_recurring: bool = Field(default=False)
    parent_task_id: Optional[int] = Field(default=None, foreign_key="task.id")
```

### 5. Strimzi Kafka Configuration for Minikube

**Decision**: Minimal ephemeral configuration with 1 broker, 1 zookeeper

**Rationale**:
- Fits within 4GB Minikube memory limit
- Ephemeral storage acceptable for development (events retained 7 days)
- Single broker sufficient for local development load
- Strimzi operator handles lifecycle management

**Resource Allocation**:
- Kafka broker: 512MB memory, 0.5 CPU
- Zookeeper: 256MB memory, 0.25 CPU
- Total Kafka overhead: ~768MB

**Alternatives Considered**:
- 3 broker cluster: Unnecessary for local dev, exceeds memory limit
- Persistent storage: Adds complexity, not needed for development
- KRaft mode (no Zookeeper): Not yet stable in Strimzi, stick with ZK for reliability

**Configuration**:
```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: todo-kafka
  namespace: kafka
spec:
  kafka:
    replicas: 1
    resources:
      requests:
        memory: 512Mi
        cpu: 500m
      limits:
        memory: 512Mi
        cpu: 500m
    storage:
      type: ephemeral
    config:
      offsets.topic.replication.factor: 1
      transaction.state.log.replication.factor: 1
      transaction.state.log.min.isr: 1
  zookeeper:
    replicas: 1
    resources:
      requests:
        memory: 256Mi
        cpu: 250m
      limits:
        memory: 256Mi
        cpu: 250m
    storage:
      type: ephemeral
  entityOperator:
    topicOperator:
      resources:
        requests:
          memory: 128Mi
          cpu: 100m
```

### 6. Dapr Pub/Sub vs Direct Kafka Client

**Decision**: Use Dapr Pub/Sub component exclusively (no Kafka client libraries)

**Rationale**:
- Aligns with Constitution Principle XIII (Dapr-First Integration)
- Abstracts Kafka complexity from application code
- Enables future broker changes without code changes
- Consistent API across all services
- Built-in retry and error handling

**Alternatives Considered**:
- kafka-python library: Tightly couples code to Kafka, violates Dapr-First principle
- confluent-kafka: Better performance but same coupling issue
- Mixed approach: Inconsistent, harder to maintain

**Implementation**:
```python
import httpx

async def publish_event(event_type: str, payload: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:3500/v1.0/publish/pubsub/task-events",
            json={
                "type": event_type,
                "version": "v1",
                "timestamp": datetime.utcnow().isoformat(),
                "data": payload
            }
        )
        response.raise_for_status()
```

### 7. Dapr Jobs API for Reminders

**Decision**: Use Dapr Jobs API (alpha) for exact-time reminder scheduling

**Rationale**:
- Designed for exact-time job execution (not polling)
- Integrates with Dapr state store for persistence
- Simpler than external scheduler (Celery, APScheduler)
- Meets 95% accuracy requirement (within 30s)

**Alternatives Considered**:
- Celery Beat: Requires Redis/RabbitMQ, adds infrastructure complexity
- APScheduler: In-process, lost on pod restart, no distributed support
- Kubernetes CronJobs: Minute-level granularity only, not suitable for exact times
- Polling: Inefficient, doesn't scale, violates requirement

**Implementation**:
```python
# Schedule reminder
async def schedule_reminder(task_id: int, remind_at: datetime):
    async with httpx.AsyncClient() as client:
        await client.post(
            "http://localhost:3500/v1.0-alpha1/jobs/reminders",
            json={
                "schedule": remind_at.isoformat(),
                "data": {
                    "task_id": task_id,
                    "user_id": user_id
                },
                "dueTime": remind_at.isoformat()
            }
        )

# Job handler endpoint
@app.post("/jobs/reminder-handler")
async def handle_reminder(job_data: dict):
    task_id = job_data["task_id"]
    # Publish reminder.due event
    await publish_event("reminder.due", {"task_id": task_id})
```

### 8. Event Schema Versioning Strategy

**Decision**: Include version in event type and payload (e.g., task.created.v1)

**Rationale**:
- Enables schema evolution without breaking consumers
- Consumers can handle multiple versions
- Clear contract for event structure
- Supports gradual migration

**Alternatives Considered**:
- No versioning: Breaks consumers on schema changes
- Separate topics per version: Topic proliferation, complex routing
- Schema registry (Confluent): Overkill for local dev, adds complexity

**Event Schema**:
```json
{
  "event_id": "uuid",
  "event_type": "task.created.v1",
  "event_version": "v1",
  "timestamp": "2026-03-05T21:00:00Z",
  "user_id": 123,
  "task_id": 456,
  "data": {
    "title": "Task title",
    "priority": "high",
    "tags": ["work", "urgent"],
    "due_date": "2026-03-10T15:00:00Z"
  }
}
```

### 9. Microservices Communication Pattern

**Decision**: Event-driven only (no synchronous service-to-service calls)

**Rationale**:
- Loose coupling between services
- Services can be deployed/scaled independently
- Failure isolation (one service down doesn't block others)
- Aligns with event-driven architecture principle

**Alternatives Considered**:
- Synchronous HTTP calls: Tight coupling, cascading failures
- gRPC: Better performance but adds complexity, not needed for async workflows
- Message queue (RabbitMQ): Kafka already provides queuing

**Service Responsibilities**:
- **Backend**: Publishes events for all task operations
- **Recurring Task Service**: Subscribes to task.completed, creates next occurrence
- **Notification Service**: Subscribes to reminder.due, sends notifications
- **Audit Service**: Subscribes to all events, logs for history

### 10. Frontend State Management for Real-Time Updates

**Decision**: Polling with optimistic updates (no WebSockets for Phase 5A)

**Rationale**:
- Simpler implementation for local development
- Meets user experience requirements
- WebSockets add complexity (connection management, reconnection logic)
- Can be added in Phase 5B if needed

**Alternatives Considered**:
- WebSockets: Real-time but complex, overkill for task management
- Server-Sent Events (SSE): One-way only, still requires connection management
- Long polling: Similar complexity to WebSockets

**Implementation**:
- Optimistic UI updates on user actions
- Poll task list every 30 seconds for background changes
- Refresh on window focus

## Technology Stack Summary

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Backend | FastAPI | 0.109+ | REST API |
| ORM | SQLModel | 0.0.14+ | Database models |
| Database | PostgreSQL (Neon) | 15+ | Primary data store |
| Frontend | Next.js | 14+ | Web UI |
| UI Library | React | 18+ | Components |
| Styling | Tailwind CSS | 3+ | CSS framework |
| Message Broker | Kafka (Strimzi) | 3.6+ | Event streaming |
| Service Mesh | Dapr | 1.12+ | Pub/Sub, Jobs, Secrets |
| Container Runtime | Docker | 24+ | Containerization |
| Orchestration | Kubernetes (Minikube) | 1.35+ | Local cluster |
| HTTP Client | httpx | 0.26+ | Dapr API calls |
| Testing | pytest, Jest | Latest | Unit/integration tests |

## Performance Considerations

### Database Indexes

```sql
-- Full-text search
CREATE INDEX idx_task_search ON task USING GIN(to_tsvector('english', title || ' ' || description));

-- Tag filtering
CREATE INDEX idx_task_tags ON task USING GIN(tags);

-- Priority filtering
CREATE INDEX idx_task_priority ON task(priority);

-- Due date sorting
CREATE INDEX idx_task_due_date ON task(due_date) WHERE due_date IS NOT NULL;

-- User isolation (existing)
CREATE INDEX idx_task_user_id ON task(user_id);
```

### Query Optimization

- Use pagination for task lists (limit 50 per page)
- Combine filters in single query (avoid N+1)
- Cache tag autocomplete results (5 minute TTL)
- Use database-level sorting (not application-level)

## Security Considerations

### Event Security

- All events include user_id for multi-tenancy
- Microservices validate user_id before processing
- Dapr secrets component for Kafka credentials
- No sensitive data in event payloads (only IDs)

### Reminder Security

- Reminders only trigger for task owner
- Job handler validates user_id matches task owner
- Browser notifications require user permission

## Deployment Strategy

### Resource Allocation (4GB Minikube Total)

| Component | Memory | CPU | Replicas |
|-----------|--------|-----|----------|
| Frontend | 256MB | 0.25 | 1 |
| Backend | 512MB | 0.5 | 1 |
| Recurring Service | 256MB | 0.25 | 1 |
| Notification Service | 256MB | 0.25 | 1 |
| Audit Service | 256MB | 0.25 | 1 |
| Kafka Broker | 512MB | 0.5 | 1 |
| Zookeeper | 256MB | 0.25 | 1 |
| Dapr Sidecars (5x) | 250MB | 0.25 | 5 |
| **Total** | **~2.8GB** | **~3 CPU** | |

Remaining ~1.2GB for Kubernetes system components and overhead.

## Risk Mitigation

### Risk 1: Memory Constraints

**Mitigation**:
- Use ephemeral storage for Kafka (no disk overhead)
- Set aggressive memory limits on all pods
- Monitor with `kubectl top pods`
- Scale down frontend if needed (can run outside cluster)

### Risk 2: Event Ordering

**Mitigation**:
- Use task_id as Kafka partition key
- Single partition per task ensures ordering
- Idempotent event handlers (handle duplicates)

### Risk 3: Dapr Jobs Reliability

**Mitigation**:
- Accept 30-second tolerance window
- Log all scheduled jobs for debugging
- Implement retry logic in job handler
- Fallback to in-app notification if job fails

## Next Steps

1. Proceed to Phase 1: Design (data-model.md, contracts/)
2. Generate database migration for new fields
3. Define event schemas in contracts/events.yaml
4. Create Dapr component definitions
5. Update API contracts with new endpoints
