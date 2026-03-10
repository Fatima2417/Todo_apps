# Dapr Commands Reference

This guide covers common Dapr commands and operations for Phase 5A deployment on Minikube.

## Prerequisites

- Dapr CLI installed
- Minikube running
- kubectl configured

## Installation & Setup

### Install Dapr on Minikube
```bash
dapr init -k
```

This installs:
- Dapr control plane in `dapr-system` namespace
- Dapr Operator
- Dapr Sidecar Injector
- Dapr Placement service
- Dapr Sentry (mTLS)

### Verify Dapr Installation
```bash
dapr status -k
```

Expected output:
```
NAME                   NAMESPACE    HEALTHY  STATUS   REPLICAS  VERSION  AGE  CREATED
dapr-operator          dapr-system  True     Running  1         1.12.0   1m   2026-03-06 11:25:37
dapr-sidecar-injector  dapr-system  True     Running  1         1.12.0   1m   2026-03-06 11:25:37
dapr-sentry            dapr-system  True     Running  1         1.12.0   1m   2026-03-06 11:25:37
dapr-placement-server  dapr-system  True     Running  1         1.12.0   1m   2026-03-06 11:25:37
```

### Check Dapr Version
```bash
dapr version
```

## Managing Dapr Components

### List All Components
```bash
kubectl get components
```

### Describe a Component
```bash
kubectl describe component pubsub
```

### View Component Configuration
```bash
kubectl get component pubsub -o yaml
```

### Apply a Component
```bash
kubectl apply -f helm/todo-backend/templates/dapr-components/pubsub.yaml
```

### Delete a Component
```bash
kubectl delete component <component-name>
```

## Managing Dapr Subscriptions

### List Subscriptions
```bash
kubectl get subscriptions
```

### View Subscription Details
```bash
kubectl get subscription audit-task-subscription -o yaml
```

### Apply Subscription
```bash
kubectl apply -f microservices/audit-service/subscription.yaml
```

## Checking Dapr Sidecars

### List Pods with Dapr Sidecars
```bash
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.metadata.annotations.dapr\.io/enabled}{"\n"}{end}'
```

### Check Sidecar Logs
```bash
# View daprd sidecar logs for a specific pod
kubectl logs <pod-name> -c daprd

# Follow logs
kubectl logs <pod-name> -c daprd -f

# View last 50 lines
kubectl logs <pod-name> -c daprd --tail=50
```

### Check Application Logs
```bash
kubectl logs <pod-name> -c <container-name>
```

## Pub/Sub Operations

### Publish an Event (Testing)
```bash
# Port-forward to Dapr sidecar
kubectl port-forward <pod-name> 3500:3500

# Publish event using curl
curl -X POST http://localhost:3500/v1.0/publish/pubsub/task-events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "task.created",
    "data": {
      "task_id": 123,
      "title": "Test Task"
    }
  }'
```

### Check Pub/Sub Metadata
```bash
kubectl exec <pod-name> -c daprd -- curl http://localhost:3500/v1.0/metadata
```

## State Store Operations

### Get State
```bash
# Port-forward to Dapr sidecar
kubectl port-forward <pod-name> 3500:3500

# Get state
curl http://localhost:3500/v1.0/state/statestore/<key>
```

### Save State
```bash
curl -X POST http://localhost:3500/v1.0/state/statestore \
  -H "Content-Type: application/json" \
  -d '[{
    "key": "test-key",
    "value": "test-value"
  }]'
```

### Delete State
```bash
curl -X DELETE http://localhost:3500/v1.0/state/statestore/<key>
```

## Dapr Jobs API (Reminders)

### Schedule a Job
```bash
curl -X POST http://localhost:3500/v1.0-alpha1/jobs/reminder-task-123 \
  -H "Content-Type: application/json" \
  -d '{
    "dueTime": "2026-03-06T12:00:00Z",
    "data": {
      "task_id": 123,
      "type": "reminder"
    }
  }'
```

### Get Job Status
```bash
curl http://localhost:3500/v1.0-alpha1/jobs/reminder-task-123
```

### Delete a Job
```bash
curl -X DELETE http://localhost:3500/v1.0-alpha1/jobs/reminder-task-123
```

## Service Invocation

### Invoke Another Service
```bash
# From within a pod with Dapr sidecar
curl http://localhost:3500/v1.0/invoke/todo-backend/method/api/v1/health
```

### Invoke from Outside Cluster
```bash
# Port-forward to a Dapr sidecar
kubectl port-forward <pod-name> 3500:3500

# Invoke service
curl http://localhost:3500/v1.0/invoke/todo-backend/method/api/v1/health
```

## Monitoring & Debugging

### Check Dapr Dashboard
```bash
dapr dashboard -k
```

This opens the Dapr dashboard at http://localhost:8080

### View Dapr Metrics
```bash
# Port-forward to metrics endpoint
kubectl port-forward -n dapr-system svc/dapr-operator 9090:9090

# Access metrics at http://localhost:9090/metrics
```

### Check Dapr Control Plane Logs
```bash
# Operator logs
kubectl logs -n dapr-system -l app=dapr-operator

# Sidecar injector logs
kubectl logs -n dapr-system -l app=dapr-sidecar-injector

# Placement logs
kubectl logs -n dapr-system -l app=dapr-placement-server

# Sentry logs
kubectl logs -n dapr-system -l app=dapr-sentry
```

### Debug Sidecar Injection
```bash
# Check if pod has Dapr annotations
kubectl get pod <pod-name> -o jsonpath='{.metadata.annotations}'

# Check if sidecar was injected
kubectl get pod <pod-name> -o jsonpath='{.spec.containers[*].name}'
```

## Troubleshooting

### Sidecar Not Injected
```bash
# Check if Dapr is enabled in annotations
kubectl get pod <pod-name> -o yaml | grep dapr.io/enabled

# Check sidecar injector logs
kubectl logs -n dapr-system -l app=dapr-sidecar-injector --tail=50

# Verify namespace has Dapr enabled
kubectl get namespace <namespace> -o yaml | grep dapr
```

### Component Not Loading
```bash
# Check component status
kubectl describe component <component-name>

# Check daprd logs for component errors
kubectl logs <pod-name> -c daprd | grep -i component

# Verify component configuration
kubectl get component <component-name> -o yaml
```

### Pub/Sub Not Working
```bash
# Check if pubsub component exists
kubectl get component pubsub

# Check subscription exists
kubectl get subscriptions

# Check daprd logs for pub/sub errors
kubectl logs <pod-name> -c daprd | grep -i pubsub

# Verify Kafka connectivity
kubectl logs <pod-name> -c daprd | grep -i kafka
```

### State Store Issues
```bash
# Check state store component
kubectl get component statestore

# Test database connectivity
kubectl exec <pod-name> -c daprd -- curl http://localhost:3500/v1.0/metadata

# Check daprd logs
kubectl logs <pod-name> -c daprd | grep -i state
```

### Jobs Not Triggering
```bash
# Check if jobs are scheduled
kubectl logs <pod-name> -c daprd | grep -i job

# Verify job endpoint exists
kubectl logs <pod-name> -c <app-container> | grep "/api/jobs/trigger"

# Check time synchronization
kubectl exec <pod-name> -- date
```

## Configuration

### Enable Dapr for a Deployment
Add these annotations to your deployment:
```yaml
annotations:
  dapr.io/enabled: "true"
  dapr.io/app-id: "my-app"
  dapr.io/app-port: "8000"
  dapr.io/log-level: "info"
  dapr.io/config: "dapr-config"
```

### Dapr Configuration Resource
```yaml
apiVersion: dapr.io/v1alpha1
kind: Configuration
metadata:
  name: dapr-config
spec:
  tracing:
    samplingRate: "1"
  metric:
    enabled: true
  mtls:
    enabled: true
```

## Cleanup

### Uninstall Dapr from Minikube
```bash
dapr uninstall -k
```

### Delete All Components
```bash
kubectl delete components --all
```

### Delete All Subscriptions
```bash
kubectl delete subscriptions --all
```

## Performance Tuning

### Adjust Sidecar Resources
```yaml
annotations:
  dapr.io/sidecar-cpu-limit: "1000m"
  dapr.io/sidecar-memory-limit: "512Mi"
  dapr.io/sidecar-cpu-request: "100m"
  dapr.io/sidecar-memory-request: "128Mi"
```

### Enable HTTP/2
```yaml
annotations:
  dapr.io/enable-api-logging: "false"
  dapr.io/http-max-request-size: "4"
```

## References

- [Dapr Documentation](https://docs.dapr.io/)
- [Dapr CLI Reference](https://docs.dapr.io/reference/cli/)
- [Dapr Kubernetes](https://docs.dapr.io/operations/hosting/kubernetes/)
- [Dapr Components](https://docs.dapr.io/reference/components-reference/)
