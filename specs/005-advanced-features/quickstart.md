# Quickstart Guide: Phase 5A - Advanced Features

**Feature**: 005-advanced-features
**Date**: 2026-03-05
**Estimated Setup Time**: 60-90 minutes

## Overview

This guide walks you through setting up and running Phase 5A Advanced Features with event-driven architecture on local Minikube.

## Prerequisites

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| Minikube | 1.32+ | https://minikube.sigs.k8s.io/docs/start/ |
| kubectl | 1.28+ | https://kubernetes.io/docs/tasks/tools/ |
| Helm | 3.12+ | https://helm.sh/docs/intro/install/ |
| Docker | 24+ | https://docs.docker.com/get-docker/ |
| Dapr CLI | 1.12+ | https://docs.dapr.io/getting-started/install-dapr-cli/ |
| Python | 3.13+ | https://www.python.org/downloads/ |
| Node.js | 18+ | https://nodejs.org/ |

### System Requirements

- **Memory**: 4GB available for Minikube
- **CPU**: 4 cores recommended
- **Disk**: 20GB free space
- **OS**: Windows 10/11, macOS 12+, or Linux

### Existing Setup (Phase 4)

This guide assumes you have completed Phase 4 and have:
- ✅ Minikube running with Docker driver
- ✅ Backend and frontend deployed to Minikube
- ✅ Neon PostgreSQL database configured
- ✅ Helm charts for backend and frontend

## Setup Steps

### Step 1: Start Minikube (if not running)

```bash
# Start Minikube with 4GB memory
minikube start --driver=docker --memory=4096 --cpus=4

# Verify Minikube is running
minikube status

# Set kubectl context
kubectl config use-context minikube
```

### Step 2: Install Strimzi Kafka Operator

```bash
# Create kafka namespace
kubectl create namespace kafka

# Install Strimzi operator
kubectl create -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka

# Wait for operator to be ready
kubectl wait --for=condition=ready pod -l name=strimzi-cluster-operator -n kafka --timeout=300s

# Verify installation
kubectl get pods -n kafka
```

**Expected Output**:
```
NAME                                        READY   STATUS    RESTARTS   AGE
strimzi-cluster-operator-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
```

### Step 3: Deploy Kafka Cluster

Create `k8s/strimzi/kafka-cluster.yaml`:

```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: todo-kafka
  namespace: kafka
spec:
  kafka:
    version: 3.6.0
    replicas: 1
    listeners:
      - name: plain
        port: 9092
        type: internal
        tls: false
    config:
      offsets.topic.replication.factor: 1
      transaction.state.log.replication.factor: 1
      transaction.state.log.min.isr: 1
      default.replication.factor: 1
      min.insync.replicas: 1
    storage:
      type: ephemeral
    resources:
      requests:
        memory: 512Mi
        cpu: 500m
      limits:
        memory: 512Mi
        cpu: 500m
  zookeeper:
    replicas: 1
    storage:
      type: ephemeral
    resources:
      requests:
        memory: 256Mi
        cpu: 250m
      limits:
        memory: 256Mi
        cpu: 250m
  entityOperator:
    topicOperator:
      resources:
        requests:
          memory: 128Mi
          cpu: 100m
        limits:
          memory: 128Mi
          cpu: 100m
    userOperator:
      resources:
        requests:
          memory: 128Mi
          cpu: 100m
        limits:
          memory: 128Mi
          cpu: 100m
```

```bash
# Apply Kafka cluster
kubectl apply -f k8s/strimzi/kafka-cluster.yaml -n kafka

# Wait for Kafka to be ready (this takes 3-5 minutes)
kubectl wait kafka/todo-kafka --for=condition=Ready --timeout=600s -n kafka

# Verify Kafka cluster
kubectl get kafka -n kafka
kubectl get pods -n kafka
```

**Expected Output**:
```
NAME         DESIRED KAFKA REPLICAS   DESIRED ZK REPLICAS   READY
todo-kafka   1                        1                     True

NAME                                          READY   STATUS    RESTARTS   AGE
todo-kafka-entity-operator-xxxxxxxxxx-xxxxx   3/3     Running   0          3m
todo-kafka-kafka-0                            1/1     Running   0          4m
todo-kafka-zookeeper-0                        1/1     Running   0          5m
```

### Step 4: Create Kafka Topics

Create `k8s/strimzi/kafka-topics.yaml`:

```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaTopic
metadata:
  name: task-events
  namespace: kafka
  labels:
    strimzi.io/cluster: todo-kafka
spec:
  partitions: 3
  replicas: 1
  config:
    retention.ms: 604800000  # 7 days
    segment.bytes: 1073741824
    compression.type: producer
---
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaTopic
metadata:
  name: reminders
  namespace: kafka
  labels:
    strimzi.io/cluster: todo-kafka
spec:
  partitions: 1
  replicas: 1
  config:
    retention.ms: 86400000  # 1 day
---
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaTopic
metadata:
  name: task-updates
  namespace: kafka
  labels:
    strimzi.io/cluster: todo-kafka
spec:
  partitions: 3
  replicas: 1
  config:
    retention.ms: 86400000  # 1 day
```

```bash
# Apply topics
kubectl apply -f k8s/strimzi/kafka-topics.yaml -n kafka

# Verify topics
kubectl get kafkatopics -n kafka
```

### Step 5: Install Dapr on Minikube

```bash
# Install Dapr CLI (if not already installed)
wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash

# Initialize Dapr on Kubernetes
dapr init --kubernetes --wait

# Verify Dapr installation
dapr status -k
```

**Expected Output**:
```
NAME                   NAMESPACE    HEALTHY  STATUS   REPLICAS  VERSION  AGE  CREATED
dapr-sidecar-injector  dapr-system  True     Running  1         1.12.0   1m   2026-03-05 21:00:00
dapr-sentry            dapr-system  True     Running  1         1.12.0   1m   2026-03-05 21:00:00
dapr-operator          dapr-system  True     Running  1         1.12.0   1m   2026-03-05 21:00:00
dapr-placement         dapr-system  True     Running  1         1.12.0   1m   2026-03-05 21:00:00
```

### Step 6: Update Database Schema

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run database migration
alembic upgrade head

# Verify new columns exist
psql $DATABASE_URL -c "\d task"
```

**Expected Output** (should include new columns):
```
priority          | task_priority | not null | medium
tags              | text[]        | not null | '{}'::text[]
due_date          | timestamp     |          |
remind_at         | timestamp     |          |
recurring_pattern | varchar(100)  |          |
is_recurring      | boolean       | not null | false
parent_task_id    | integer       |          |
```

### Step 7: Build and Push Docker Images

```bash
# Set Minikube Docker environment
eval $(minikube docker-env)

# Build backend image
cd backend
docker build -t todo-backend:v2.0.0 .

# Build frontend image
cd ../frontend
docker build -t todo-frontend:v2.0.0 .

# Build microservices
cd ../microservices/recurring-task-service
docker build -t recurring-task-service:v1.0.0 .

cd ../notification-service
docker build -t notification-service:v1.0.0 .

cd ../audit-service
docker build -t audit-service:v1.0.0 .

# Verify images
docker images | grep todo
```

### Step 8: Deploy Dapr Components

```bash
# Apply Dapr components
kubectl apply -f helm/todo-backend/templates/dapr-components/

# Verify components
kubectl get components -n default
```

**Expected Output**:
```
NAME                  AGE
pubsub                10s
statestore            10s
kubernetes-secrets    10s
```

### Step 9: Deploy Services with Helm

```bash
# Update backend deployment
helm upgrade --install todo-backend ./helm/todo-backend \
  --set image.tag=v2.0.0 \
  --set dapr.enabled=true

# Update frontend deployment
helm upgrade --install todo-frontend ./helm/todo-frontend \
  --set image.tag=v2.0.0

# Deploy microservices
helm install recurring-task-service ./helm/recurring-task-service
helm install notification-service ./helm/notification-service
helm install audit-service ./helm/audit-service

# Wait for all pods to be ready
kubectl wait --for=condition=ready pod --all --timeout=300s

# Verify deployments
kubectl get pods
```

**Expected Output**:
```
NAME                                     READY   STATUS    RESTARTS   AGE
todo-backend-xxxxxxxxxx-xxxxx            2/2     Running   0          2m
todo-frontend-xxxxxxxxxx-xxxxx           1/1     Running   0          2m
recurring-task-service-xxxxxxxxxx-xxxxx  2/2     Running   0          1m
notification-service-xxxxxxxxxx-xxxxx    2/2     Running   0          1m
audit-service-xxxxxxxxxx-xxxxx           2/2     Running   0          1m
```

**Note**: Backend and microservices show 2/2 (app + Dapr sidecar)

### Step 10: Verify Event Flow

```bash
# Port-forward to backend
kubectl port-forward svc/todo-backend 8000:8000 &

# Create a test task with priority and tags
curl -X POST http://localhost:8000/api/1/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test task with events",
    "priority": "high",
    "tags": ["test", "phase5a"]
  }'

# Check audit service logs (should show task.created event)
kubectl logs -l app=audit-service -c audit-service --tail=20

# Check Kafka topic
kubectl run kafka-consumer -ti --image=quay.io/strimzi/kafka:latest-kafka-3.6.0 --rm=true --restart=Never -n kafka -- bin/kafka-console-consumer.sh --bootstrap-server todo-kafka-kafka-bootstrap:9092 --topic task-events --from-beginning
```

### Step 11: Test Recurring Tasks

```bash
# Create a recurring task
curl -X POST http://localhost:8000/api/1/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Weekly team meeting",
    "priority": "medium",
    "tags": ["work", "meeting"],
    "due_date": "2026-03-12T15:00:00Z",
    "recurring_pattern": "weekly"
  }'

# Mark task as complete
curl -X PATCH http://localhost:8000/api/1/tasks/{task_id}/complete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check recurring task service logs (should show new task created)
kubectl logs -l app=recurring-task-service -c recurring-task-service --tail=20

# Verify new task was created
curl http://localhost:8000/api/1/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 12: Test Reminders

```bash
# Create a task with reminder (5 minutes from now)
curl -X POST http://localhost:8000/api/1/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Task with reminder",
    "priority": "high",
    "due_date": "2026-03-05T21:20:00Z",
    "remind_at": "2026-03-05T21:15:00Z"
  }'

# Wait for reminder time
# Check notification service logs
kubectl logs -l app=notification-service -c notification-service --tail=20 -f
```

### Step 13: Access Frontend

```bash
# Get frontend URL
minikube service todo-frontend --url

# Or use port-forward
kubectl port-forward svc/todo-frontend 3000:3000

# Open browser to http://localhost:3000
```

## Verification Checklist

- [ ] Minikube running with 4GB memory
- [ ] Strimzi operator installed in kafka namespace
- [ ] Kafka cluster (todo-kafka) running with 1 broker, 1 zookeeper
- [ ] 3 Kafka topics created (task-events, reminders, task-updates)
- [ ] Dapr installed in dapr-system namespace
- [ ] Dapr components deployed (pubsub, statestore, secrets)
- [ ] Database schema updated with new columns
- [ ] All 5 Docker images built
- [ ] Backend pod running with Dapr sidecar (2/2)
- [ ] Frontend pod running (1/1)
- [ ] 3 microservice pods running with Dapr sidecars (2/2 each)
- [ ] Events published to Kafka when tasks created
- [ ] Recurring tasks auto-generate on completion
- [ ] Reminders trigger at scheduled time
- [ ] Frontend accessible and shows new features

## Testing Advanced Features

### Test Priority and Tags

1. Open frontend at http://localhost:3000
2. Create a new task
3. Set priority to "High"
4. Add tags: "work", "urgent"
5. Verify task displays with red priority indicator
6. Verify tags appear as badges

### Test Search and Filter

1. Create 10+ tasks with various priorities and tags
2. Use search box to search for keyword
3. Filter by priority (high/medium/low)
4. Filter by tags (select multiple)
5. Combine search + filters
6. Verify results update instantly

### Test Sort

1. Create tasks with different due dates
2. Sort by "Due Date" ascending
3. Verify tasks ordered by nearest due date first
4. Sort by "Priority" descending
5. Verify high priority tasks appear first

### Test Recurring Tasks

1. Create task with "Weekly" recurrence
2. Set due date to next week
3. Mark task as complete
4. Verify new task created with due date +7 days
5. Check original task remains completed

### Test Reminders

1. Create task with due date 10 minutes from now
2. Set reminder 5 minutes before due date
3. Wait for reminder time
4. Verify browser notification appears
5. Test snooze and dismiss actions

## Troubleshooting

### Kafka Not Starting

```bash
# Check Kafka logs
kubectl logs todo-kafka-kafka-0 -n kafka

# Check resource usage
kubectl top pods -n kafka

# If OOM, reduce Kafka memory in kafka-cluster.yaml
```

### Dapr Sidecar Not Injected

```bash
# Check Dapr installation
dapr status -k

# Verify pod annotations
kubectl describe pod <pod-name> | grep dapr

# Check Dapr logs
kubectl logs <pod-name> -c daprd
```

### Events Not Publishing

```bash
# Check backend logs
kubectl logs -l app=todo-backend -c backend

# Check Dapr sidecar logs
kubectl logs -l app=todo-backend -c daprd

# Test Dapr pub/sub directly
kubectl exec -it <backend-pod> -c daprd -- curl http://localhost:3500/v1.0/metadata
```

### Microservices Not Consuming Events

```bash
# Check subscription
kubectl get subscription

# Check microservice logs
kubectl logs -l app=recurring-task-service -c recurring-task-service

# Check Kafka consumer group
kubectl run kafka-consumer-groups -ti --image=quay.io/strimzi/kafka:latest-kafka-3.6.0 --rm=true --restart=Never -n kafka -- bin/kafka-consumer-groups.sh --bootstrap-server todo-kafka-kafka-bootstrap:9092 --describe --group todo-app
```

### Memory Issues

```bash
# Check resource usage
kubectl top nodes
kubectl top pods --all-namespaces

# Scale down non-essential services
kubectl scale deployment todo-frontend --replicas=0

# Restart Minikube with more memory
minikube stop
minikube start --memory=6144
```

## Resource Monitoring

```bash
# Monitor all pods
watch kubectl get pods --all-namespaces

# Monitor resource usage
watch kubectl top pods

# Check Kafka metrics
kubectl port-forward svc/todo-kafka-kafka-bootstrap 9092:9092 -n kafka
# Use Kafka tools to check lag, throughput, etc.

# Check Dapr metrics
kubectl port-forward <pod-name> 9090:9090
curl http://localhost:9090/metrics
```

## Cleanup

```bash
# Delete all deployments
helm uninstall todo-backend
helm uninstall todo-frontend
helm uninstall recurring-task-service
helm uninstall notification-service
helm uninstall audit-service

# Delete Kafka cluster
kubectl delete kafka todo-kafka -n kafka

# Delete Kafka topics
kubectl delete kafkatopics --all -n kafka

# Uninstall Strimzi
kubectl delete -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka

# Uninstall Dapr
dapr uninstall --kubernetes

# Delete namespaces
kubectl delete namespace kafka
kubectl delete namespace dapr-system

# Stop Minikube
minikube stop
```

## Next Steps

1. Run `/sp.tasks` to generate implementation tasks
2. Implement features incrementally (P1 → P2 → P3 → P4 → P5)
3. Write tests for each feature
4. Document any issues or improvements
5. Prepare for Phase 5B (cloud deployment)

## Support

- **Strimzi Docs**: https://strimzi.io/docs/
- **Dapr Docs**: https://docs.dapr.io/
- **Minikube Docs**: https://minikube.sigs.k8s.io/docs/
- **Project Issues**: See CLAUDE.md for issue reporting
