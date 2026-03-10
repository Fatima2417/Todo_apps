# Phase 5A Quick Reference Card

## Daily Operations

### Start Everything
```bash
# 1. Start Docker Desktop (GUI application)

# 2. Start Minikube
minikube start

# 3. Access application
minikube service todo-frontend --url
# Open the URL in your browser
```

### Stop Everything
```bash
# Stop Minikube (keeps data)
minikube stop

# Or completely delete (removes all data)
minikube delete
```

---

## Monitoring Commands

### Check Status
```bash
# All pods
kubectl get pods

# Specific service
kubectl get pods -l app=todo-backend

# All resources
kubectl get all
```

### View Logs
```bash
# Backend application logs
kubectl logs -l app=todo-backend -c todo-backend -f

# Backend Dapr sidecar logs
kubectl logs -l app=todo-backend -c daprd -f

# Recurring task service
kubectl logs -l app=recurring-task-service -c recurring-task-service -f

# Notification service
kubectl logs -l app=notification-service -c notification-service -f

# Audit service
kubectl logs -l app=audit-service -c audit-service -f

# Last 50 lines only
kubectl logs -l app=todo-backend -c todo-backend --tail=50
```

### Check Resource Usage
```bash
# Node resources
kubectl top nodes

# Pod resources
kubectl top pods

# Kafka resources
kubectl top pods -n kafka
```

---

## Kafka Commands

### Check Kafka Status
```bash
# Kafka cluster
kubectl get kafka -n kafka

# Kafka pods
kubectl get pods -n kafka

# Kafka topics
kubectl get kafkatopics -n kafka
```

### View Kafka Messages
```bash
# Consume task-events topic
kubectl run kafka-consumer -ti --rm --restart=Never \
  --image=quay.io/strimzi/kafka:latest-kafka-3.6.0 -n kafka -- \
  bin/kafka-console-consumer.sh \
  --bootstrap-server todo-kafka-kafka-bootstrap:9092 \
  --topic task-events \
  --from-beginning

# Consume reminders topic
kubectl run kafka-consumer -ti --rm --restart=Never \
  --image=quay.io/strimzi/kafka:latest-kafka-3.6.0 -n kafka -- \
  bin/kafka-console-consumer.sh \
  --bootstrap-server todo-kafka-kafka-bootstrap:9092 \
  --topic reminders \
  --from-beginning
```

---

## Dapr Commands

### Check Dapr Status
```bash
# Dapr control plane
dapr status -k

# Dapr components
kubectl get components

# Dapr subscriptions
kubectl get subscriptions
```

### Dapr Dashboard
```bash
dapr dashboard -k
# Opens at http://localhost:8080
```

### Check Sidecar Injection
```bash
# List all containers in pods
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].name}{"\n"}{end}'
```

---

## Debugging Commands

### Describe Resources
```bash
# Describe pod (shows events and errors)
kubectl describe pod <pod-name>

# Describe service
kubectl describe svc <service-name>

# Describe component
kubectl describe component pubsub
```

### Check Events
```bash
# Recent events
kubectl get events --sort-by='.lastTimestamp'

# Events for specific namespace
kubectl get events -n kafka --sort-by='.lastTimestamp'
```

### Port Forwarding
```bash
# Forward backend port
kubectl port-forward svc/todo-backend 8000:8000

# Forward frontend port
kubectl port-forward svc/todo-frontend 3000:3000

# Forward to specific pod
kubectl port-forward <pod-name> 8000:8000
```

### Execute Commands in Pod
```bash
# Get shell in pod
kubectl exec -it <pod-name> -c <container-name> -- /bin/bash

# Run single command
kubectl exec <pod-name> -c <container-name> -- curl http://localhost:8000/health
```

---

## Restart Commands

### Restart Deployments
```bash
# Restart specific deployment
kubectl rollout restart deployment todo-backend

# Restart all deployments
kubectl rollout restart deployment --all

# Check rollout status
kubectl rollout status deployment todo-backend
```

### Restart Kafka
```bash
# Delete Kafka pod (will auto-restart)
kubectl delete pod -n kafka todo-kafka-kafka-0
```

---

## Helm Commands

### List Installed Charts
```bash
helm list
```

### Upgrade Deployment
```bash
# After code changes, rebuild image and upgrade
eval $(minikube docker-env)
docker build -t todo-backend:latest ./backend
helm upgrade todo-backend ./helm/todo-backend
```

### Uninstall Chart
```bash
helm uninstall todo-backend
```

### Reinstall Everything
```bash
helm uninstall todo-backend todo-frontend recurring-task-service notification-service audit-service
helm install todo-backend ./helm/todo-backend
helm install todo-frontend ./helm/todo-frontend
helm install recurring-task-service ./helm/recurring-task-service
helm install notification-service ./helm/notification-service
helm install audit-service ./helm/audit-service
```

---

## Database Commands

### Connect to Database
```bash
# From backend pod
kubectl exec -it <backend-pod> -c todo-backend -- python

# Then in Python:
from src.database import engine
from sqlmodel import Session, select
from src.models.task import Task

with Session(engine) as session:
    tasks = session.exec(select(Task)).all()
    print(f"Total tasks: {len(tasks)}")
```

---

## Testing Commands

### Test Event Flow
```bash
# Terminal 1: Watch backend logs
kubectl logs -l app=todo-backend -c todo-backend -f

# Terminal 2: Watch audit logs
kubectl logs -l app=audit-service -c audit-service -f

# Terminal 3: Watch Kafka
kubectl run kafka-consumer -ti --rm --restart=Never \
  --image=quay.io/strimzi/kafka:latest-kafka-3.6.0 -n kafka -- \
  bin/kafka-console-consumer.sh \
  --bootstrap-server todo-kafka-kafka-bootstrap:9092 \
  --topic task-events \
  --from-beginning

# Then create a task in the UI and watch events flow
```

### Test API Directly
```bash
# Port forward backend
kubectl port-forward svc/todo-backend 8000:8000

# In another terminal, test endpoints
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/<user-id>/tasks \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## Cleanup Commands

### Clean Pods
```bash
# Delete failed pods
kubectl delete pod --field-selector=status.phase=Failed

# Delete all pods (will recreate)
kubectl delete pods --all
```

### Clean Images
```bash
# List images
docker images

# Remove unused images
docker image prune -a
```

### Complete Reset
```bash
# Delete everything
helm uninstall todo-backend todo-frontend recurring-task-service notification-service audit-service
kubectl delete kafka todo-kafka -n kafka
kubectl delete namespace kafka
dapr uninstall -k
minikube delete

# Then follow setup guide again
```

---

## Useful Aliases

Add to your `.bashrc` or `.zshrc`:

```bash
# Kubernetes
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgs='kubectl get svc'
alias kgc='kubectl get components'
alias kl='kubectl logs'
alias kd='kubectl describe'
alias ke='kubectl exec -it'

# Minikube
alias mk='minikube'
alias mks='minikube start'
alias mkst='minikube stop'
alias mkd='minikube delete'

# Helm
alias h='helm'
alias hl='helm list'
alias hi='helm install'
alias hu='helm uninstall'

# Dapr
alias ds='dapr status -k'
alias dd='dapr dashboard -k'

# Docker
alias d='docker'
alias dps='docker ps'
alias di='docker images'
```

---

## Emergency Procedures

### Application Not Responding
```bash
# 1. Check pod status
kubectl get pods

# 2. Check logs for errors
kubectl logs -l app=todo-backend -c todo-backend --tail=100

# 3. Restart deployment
kubectl rollout restart deployment todo-backend

# 4. If still failing, check events
kubectl get events --sort-by='.lastTimestamp' | tail -20
```

### Out of Memory
```bash
# 1. Check resource usage
kubectl top pods

# 2. Increase Minikube memory
minikube stop
minikube start --memory=6144

# 3. Redeploy
helm upgrade todo-backend ./helm/todo-backend
```

### Kafka Not Working
```bash
# 1. Check Kafka status
kubectl get pods -n kafka

# 2. Check operator logs
kubectl logs -n kafka -l name=strimzi-cluster-operator --tail=50

# 3. Restart Kafka
kubectl delete pod -n kafka todo-kafka-kafka-0

# 4. If still failing, recreate cluster
kubectl delete kafka todo-kafka -n kafka
kubectl apply -f k8s/strimzi/kafka-cluster.yaml
```

---

## Performance Tuning

### Increase Resources
Edit `helm/*/values.yaml`:
```yaml
resources:
  limits:
    cpu: 1000m      # Increase from 500m
    memory: 1Gi     # Increase from 512Mi
  requests:
    cpu: 200m       # Increase from 100m
    memory: 256Mi   # Increase from 128Mi
```

Then upgrade:
```bash
helm upgrade <service-name> ./helm/<service-name>
```

---

## Documentation Links

- Full Setup Guide: `docs/SETUP-GUIDE.md`
- Troubleshooting: `docs/troubleshooting.md`
- Kafka Management: `docs/kafka-management.md`
- Dapr Commands: `docs/dapr-commands.md`
- Demo Script: `docs/phase5a-demo-script.md`
- README: `README.md`
