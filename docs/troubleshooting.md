# Phase 5A Troubleshooting Guide

This guide helps resolve common issues encountered during Phase 5A deployment and operation.

## Table of Contents
1. [Minikube Issues](#minikube-issues)
2. [Docker Issues](#docker-issues)
3. [Strimzi/Kafka Issues](#strimzikafka-issues)
4. [Dapr Issues](#dapr-issues)
5. [Microservices Issues](#microservices-issues)
6. [Event Flow Issues](#event-flow-issues)
7. [Frontend Issues](#frontend-issues)
8. [Performance Issues](#performance-issues)

---

## Minikube Issues

### Minikube Won't Start
**Symptoms**: `minikube start` fails or hangs

**Solutions**:
```bash
# Check Docker Desktop is running
docker ps

# Delete and recreate Minikube cluster
minikube delete
minikube start --driver=docker --memory=4096

# Check system resources
docker system df
docker system prune  # If low on disk space
```

### Insufficient Memory
**Symptoms**: Pods stuck in Pending state, OOMKilled errors

**Solutions**:
```bash
# Increase Minikube memory
minikube delete
minikube start --driver=docker --memory=6144  # 6GB

# Check current resource allocation
minikube config view

# Monitor resource usage
kubectl top nodes
kubectl top pods --all-namespaces
```

### Cannot Access Services
**Symptoms**: `minikube service` command fails

**Solutions**:
```bash
# Check Minikube tunnel
minikube tunnel

# Use port-forward instead
kubectl port-forward svc/todo-frontend 3000:3000

# Check service endpoints
kubectl get endpoints
```

---

## Docker Issues

### Docker Desktop Not Running
**Symptoms**: "Cannot connect to Docker daemon" error

**Solutions**:
1. Start Docker Desktop application
2. Wait for Docker to fully initialize (check system tray icon)
3. Verify: `docker ps`

### Image Build Failures
**Symptoms**: `docker build` fails

**Solutions**:
```bash
# Ensure using Minikube's Docker daemon
eval $(minikube docker-env)

# Check Dockerfile syntax
docker build --no-cache -t <image-name>:latest .

# Check disk space
docker system df
docker system prune -a  # Remove unused images
```

### Images Not Found in Minikube
**Symptoms**: `ImagePullBackOff` or `ErrImagePull`

**Solutions**:
```bash
# Verify you're using Minikube's Docker
eval $(minikube docker-env)

# List images in Minikube
docker images

# Rebuild image
docker build -t <image-name>:latest .

# Set imagePullPolicy to Never in Helm values
# values.yaml:
image:
  pullPolicy: Never
```

---

## Strimzi/Kafka Issues

### Strimzi Operator Not Installing
**Symptoms**: Installation script fails

**Solutions**:
```bash
# Check namespace exists
kubectl get namespace kafka

# Create namespace if missing
kubectl create namespace kafka

# Manually install Strimzi
kubectl create -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka

# Verify operator is running
kubectl get pods -n kafka -l name=strimzi-cluster-operator
```

### Kafka Cluster Not Ready
**Symptoms**: Kafka pods in CrashLoopBackOff or Pending

**Solutions**:
```bash
# Check events
kubectl get events -n kafka --sort-by='.lastTimestamp'

# Check pod logs
kubectl logs -n kafka todo-kafka-kafka-0

# Check resource limits
kubectl describe pod -n kafka todo-kafka-kafka-0

# Reduce resources if needed (edit kafka-cluster.yaml)
spec:
  kafka:
    resources:
      requests:
        memory: 512Mi
        cpu: 250m
      limits:
        memory: 1Gi
        cpu: 500m
```

### Topics Not Created
**Symptoms**: `kubectl get kafkatopics` shows no topics

**Solutions**:
```bash
# Check entity operator is running
kubectl get pods -n kafka -l strimzi.io/name=todo-kafka-entity-operator

# Check entity operator logs
kubectl logs -n kafka -l strimzi.io/name=todo-kafka-entity-operator -c topic-operator

# Manually create topic
kubectl apply -f k8s/strimzi/kafka-topics.yaml

# Verify topic in Kafka directly
kubectl run kafka-topics -ti --rm --restart=Never --image=quay.io/strimzi/kafka:latest-kafka-3.6.0 -n kafka -- bin/kafka-topics.sh --bootstrap-server todo-kafka-kafka-bootstrap:9092 --list
```

### Cannot Connect to Kafka
**Symptoms**: Services can't publish/consume events

**Solutions**:
```bash
# Check Kafka service
kubectl get svc -n kafka todo-kafka-kafka-bootstrap

# Test connectivity from a pod
kubectl run kafka-test -ti --rm --restart=Never --image=quay.io/strimzi/kafka:latest-kafka-3.6.0 -n kafka -- bin/kafka-broker-api-versions.sh --bootstrap-server todo-kafka-kafka-bootstrap.kafka:9092

# Verify DNS resolution
kubectl run busybox -ti --rm --restart=Never --image=busybox -- nslookup todo-kafka-kafka-bootstrap.kafka
```

---

## Dapr Issues

### Dapr Not Installing
**Symptoms**: `dapr init -k` fails

**Solutions**:
```bash
# Check Dapr CLI version
dapr version

# Update Dapr CLI
curl -fsSL https://raw.githubusercontent.com/dapr/cli/master/install/install.sh | /bin/bash

# Uninstall and reinstall
dapr uninstall -k
dapr init -k

# Verify installation
dapr status -k
kubectl get pods -n dapr-system
```

### Sidecar Not Injected
**Symptoms**: Pod has no daprd container

**Solutions**:
```bash
# Check Dapr annotations in deployment
kubectl get deployment <deployment-name> -o yaml | grep dapr.io

# Verify annotations are correct:
annotations:
  dapr.io/enabled: "true"
  dapr.io/app-id: "my-app"
  dapr.io/app-port: "8000"

# Check sidecar injector is running
kubectl get pods -n dapr-system -l app=dapr-sidecar-injector

# Restart deployment
kubectl rollout restart deployment <deployment-name>
```

### Components Not Loading
**Symptoms**: Daprd logs show component errors

**Solutions**:
```bash
# Check component exists
kubectl get components

# Describe component
kubectl describe component pubsub

# Check daprd logs
kubectl logs <pod-name> -c daprd | grep -i component

# Verify component configuration
kubectl get component pubsub -o yaml

# Common issues:
# - Wrong namespace
# - Missing secrets
# - Incorrect broker address
```

### Pub/Sub Not Working
**Symptoms**: Events not being published/consumed

**Solutions**:
```bash
# Check pubsub component
kubectl get component pubsub -o yaml

# Verify Kafka broker address
# Should be: todo-kafka-kafka-brokers.kafka:9092

# Check subscription exists
kubectl get subscriptions

# Check daprd logs for pub/sub errors
kubectl logs <pod-name> -c daprd | grep -i pubsub

# Test publishing manually
kubectl port-forward <pod-name> 3500:3500
curl -X POST http://localhost:3500/v1.0/publish/pubsub/task-events \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

---

## Microservices Issues

### Microservice Not Starting
**Symptoms**: Pod in CrashLoopBackOff

**Solutions**:
```bash
# Check pod logs
kubectl logs <pod-name> -c <container-name>

# Check previous logs if restarting
kubectl logs <pod-name> -c <container-name> --previous

# Common issues:
# - Missing environment variables
# - Port conflicts
# - Import errors in Python code

# Check pod events
kubectl describe pod <pod-name>
```

### Microservice Not Receiving Events
**Symptoms**: No logs showing event processing

**Solutions**:
```bash
# Check subscription is applied
kubectl get subscription <subscription-name> -o yaml

# Verify route matches endpoint
# subscription.yaml:
spec:
  route: /task-completed  # Must match FastAPI endpoint

# Check daprd logs for subscription
kubectl logs <pod-name> -c daprd | grep -i subscription

# Check application logs
kubectl logs <pod-name> -c <container-name>

# Test endpoint directly
kubectl port-forward <pod-name> 8000:8000
curl -X POST http://localhost:8000/task-completed \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Service Invocation Fails
**Symptoms**: Microservice can't call backend API

**Solutions**:
```bash
# Check app-id is correct
# Should match backend's dapr.io/app-id annotation

# Test service invocation
kubectl exec <pod-name> -c daprd -- curl http://localhost:3500/v1.0/invoke/todo-backend/method/api/v1/health

# Check daprd logs
kubectl logs <pod-name> -c daprd | grep -i invoke

# Verify backend is accessible
kubectl get svc todo-backend
```

---

## Event Flow Issues

### Events Not Published
**Symptoms**: No events in Kafka topics

**Solutions**:
```bash
# Check backend daprd logs
kubectl logs -l app=todo-backend -c daprd | grep -i publish

# Check backend application logs
kubectl logs -l app=todo-backend -c todo-backend | grep -i event

# Verify event_publisher.py is being called
# Add debug logging in backend code

# Test Kafka directly
kubectl run kafka-consumer -ti --rm --restart=Never --image=quay.io/strimzi/kafka:latest-kafka-3.6.0 -n kafka -- bin/kafka-console-consumer.sh --bootstrap-server todo-kafka-kafka-bootstrap:9092 --topic task-events --from-beginning
```

### Events Not Consumed
**Symptoms**: Events in Kafka but microservices not processing

**Solutions**:
```bash
# Check subscription route matches endpoint
kubectl get subscription <name> -o yaml

# Check microservice logs
kubectl logs <pod-name> -c <container-name>

# Check daprd logs for delivery attempts
kubectl logs <pod-name> -c daprd | grep -i deliver

# Verify endpoint is responding
kubectl exec <pod-name> -- curl http://localhost:8000/health
```

---

## Frontend Issues

### Browser Notifications Not Working
**Symptoms**: No notification permission prompt

**Solutions**:
1. Check browser console for errors
2. Ensure HTTPS or localhost (notifications require secure context)
3. Check notification permission: `Notification.permission`
4. Clear browser cache and reload
5. Try different browser

### API Calls Failing
**Symptoms**: 401 Unauthorized or network errors

**Solutions**:
```bash
# Check backend is accessible
kubectl get svc todo-backend

# Port-forward to backend
kubectl port-forward svc/todo-backend 8000:8000

# Update frontend API URL
# .env.local:
NEXT_PUBLIC_API_URL=http://localhost:8000

# Check JWT token in localStorage
# Browser console:
localStorage.getItem('todo-app-auth')
```

### Tasks Not Updating
**Symptoms**: UI doesn't reflect changes

**Solutions**:
1. Check browser console for errors
2. Verify API response in Network tab
3. Check if result count is being handled:
```typescript
// Should handle { tasks: [], total: 0 } response
const { tasks, total } = await taskApi.getTasks(userId);
```

---

## Performance Issues

### Slow Search/Filter
**Symptoms**: Search takes >2 seconds

**Solutions**:
```bash
# Check if search index exists
# Connect to database and verify:
SELECT * FROM pg_indexes WHERE tablename = 'task';

# Recreate search index
# Run migration: backend/src/migrations/add_search_index.py

# Check query performance
# Add logging to task_service.py to measure query time
```

### High Memory Usage
**Symptoms**: Pods being OOMKilled

**Solutions**:
```bash
# Check resource usage
kubectl top pods

# Increase memory limits in Helm values
resources:
  limits:
    memory: 512Mi  # Increase from 256Mi

# Reduce Kafka/Zookeeper resources if needed
# Edit kafka-cluster.yaml
```

### Slow Recurring Task Creation
**Symptoms**: Takes >5 seconds to create next task

**Solutions**:
```bash
# Check recurring-task-service logs
kubectl logs -l app=recurring-task-service

# Check if service invocation is slow
# Add timing logs in recurrence.py

# Verify backend API is responsive
kubectl exec <pod-name> -- curl -w "@curl-format.txt" http://localhost:3500/v1.0/invoke/todo-backend/method/api/v1/health
```

---

## General Debugging Tips

### Enable Debug Logging
```yaml
# In deployment annotations
dapr.io/log-level: "debug"
```

### Check All Resources
```bash
# Get overview of all resources
kubectl get all
kubectl get all -n kafka
kubectl get all -n dapr-system

# Check events
kubectl get events --sort-by='.lastTimestamp'
```

### Restart Everything
```bash
# Restart all deployments
kubectl rollout restart deployment --all

# Restart Kafka
kubectl delete pod -n kafka todo-kafka-kafka-0

# Restart Dapr control plane
kubectl rollout restart deployment -n dapr-system --all
```

### Clean Slate
```bash
# Delete everything and start over
helm uninstall todo-backend recurring-task-service notification-service audit-service
kubectl delete kafka todo-kafka -n kafka
dapr uninstall -k
minikube delete
minikube start --driver=docker --memory=4096

# Then follow setup instructions from README.md
```

---

## Getting Help

If issues persist:
1. Check logs: `kubectl logs <pod-name> -c <container-name>`
2. Check events: `kubectl describe pod <pod-name>`
3. Review configuration: `kubectl get <resource> -o yaml`
4. Consult documentation:
   - [Strimzi Docs](https://strimzi.io/docs/)
   - [Dapr Docs](https://docs.dapr.io/)
   - [Kubernetes Docs](https://kubernetes.io/docs/)
