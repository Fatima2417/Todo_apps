# Deployment Guide - Todo Application Phase 5

**Last Updated**: March 11, 2026
**Status**: ✅ Local Deployment Working | 📋 Cloud Deployment Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Local Deployment (Minikube)](#local-deployment-minikube)
3. [Cloud Deployment Prerequisites](#cloud-deployment-prerequisites)
4. [Oracle Cloud (OKE) Deployment](#oracle-cloud-oke-deployment)
5. [Verification Steps](#verification-steps)
6. [Troubleshooting](#troubleshooting)

---

## Overview

This application supports two deployment modes:

### ✅ Local Deployment (Working)
- **Platform**: Minikube on Windows/Linux/macOS
- **Infrastructure**: Kafka (Strimzi), Dapr, PostgreSQL
- **Status**: Fully tested and operational
- **Use Case**: Development, testing, demonstration

### 📋 Cloud Deployment (Ready)
- **Platform**: Oracle Kubernetes Engine (OKE) / AKS / GKE
- **Infrastructure**: Managed Kafka, Dapr, Cloud PostgreSQL
- **Status**: Manifests prepared, not deployed
- **Blocker**: Requires cloud provider account with payment method

---

## Local Deployment (Minikube)

### Prerequisites

- **Minikube**: v1.32.0 or higher
- **kubectl**: v1.28.0 or higher
- **Helm**: v3.12.0 or higher
- **Dapr CLI**: v1.12.0 or higher
- **Docker**: 20.10.0 or higher
- **System Resources**: 8GB RAM, 4 CPU cores, 20GB disk

### Step 1: Start Minikube

```bash
# Start Minikube with sufficient resources
minikube start --memory=8192 --cpus=4 --disk-size=20g

# Verify Minikube is running
minikube status

# Enable required addons
minikube addons enable ingress
minikube addons enable metrics-server
```

### Step 2: Install Strimzi Kafka Operator

```bash
# Create Kafka namespace
kubectl create namespace kafka

# Install Strimzi operator
kubectl create -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka

# Wait for operator to be ready
kubectl wait --for=condition=ready pod -l name=strimzi-cluster-operator -n kafka --timeout=300s

# Deploy Kafka cluster
kubectl apply -f k8s/kafka/kafka-cluster.yaml -n kafka

# Wait for Kafka to be ready (this may take 3-5 minutes)
kubectl wait kafka/my-cluster --for=condition=Ready --timeout=300s -n kafka

# Verify Kafka pods
kubectl get pods -n kafka
```

**Expected Output**:
```
NAME                                          READY   STATUS    RESTARTS   AGE
my-cluster-entity-operator-xxxxx              3/3     Running   0          2m
my-cluster-kafka-0                            1/1     Running   0          3m
my-cluster-zookeeper-0                        1/1     Running   0          4m
strimzi-cluster-operator-xxxxx                1/1     Running   0          5m
```

### Step 3: Install Dapr

```bash
# Initialize Dapr on Kubernetes
dapr init -k

# Wait for Dapr to be ready
kubectl wait --for=condition=ready pod -l app=dapr-operator -n dapr-system --timeout=300s

# Verify Dapr installation
dapr status -k
```

**Expected Output**:
```
NAME                   NAMESPACE    HEALTHY  STATUS   REPLICAS  VERSION  AGE  CREATED
dapr-operator          dapr-system  True     Running  1         1.12.0   30s  2024-03-11 10:00:00
dapr-sidecar-injector  dapr-system  True     Running  1         1.12.0   30s  2024-03-11 10:00:00
dapr-sentry            dapr-system  True     Running  1         1.12.0   30s  2024-03-11 10:00:00
dapr-placement-server  dapr-system  True     Running  1         1.12.0   30s  2024-03-11 10:00:00
```

### Step 4: Deploy Dapr Components

```bash
# Apply Dapr components (pub/sub, state store, secrets)
kubectl apply -f k8s/dapr/components/

# Verify components
kubectl get components -n default
```

**Expected Output**:
```
NAME       AGE
pubsub     10s
statestore 10s
secrets    10s
```

### Step 5: Create Kafka Topics

```bash
# Apply Kafka topic definitions
kubectl apply -f k8s/kafka/topics/ -n kafka

# Verify topics
kubectl get kafkatopics -n kafka
```

**Expected Output**:
```
NAME           CLUSTER      PARTITIONS   REPLICATION FACTOR   READY
task-events    my-cluster   3            1                    True
reminders      my-cluster   3            1                    True
task-updates   my-cluster   3            1                    True
```

### Step 6: Deploy Application Services

```bash
# Create application namespace
kubectl create namespace todo-app

# Deploy backend service
kubectl apply -f k8s/backend/deployment.yaml -n todo-app
kubectl apply -f k8s/backend/service.yaml -n todo-app

# Deploy microservices
kubectl apply -f k8s/microservices/ -n todo-app

# Deploy frontend
kubectl apply -f k8s/frontend/deployment.yaml -n todo-app
kubectl apply -f k8s/frontend/service.yaml -n todo-app

# Wait for all pods to be ready
kubectl wait --for=condition=ready pod --all -n todo-app --timeout=300s

# Verify deployments
kubectl get pods -n todo-app
```

**Expected Output**:
```
NAME                                    READY   STATUS    RESTARTS   AGE
todo-backend-xxxxx                      2/2     Running   0          2m
recurring-task-service-xxxxx            2/2     Running   0          2m
notification-service-xxxxx              2/2     Running   0          2m
audit-service-xxxxx                     2/2     Running   0          2m
todo-frontend-xxxxx                     1/1     Running   0          2m
```

### Step 7: Access the Application

```bash
# Get Minikube IP
minikube ip

# Port forward to access services
kubectl port-forward -n todo-app svc/todo-backend 8000:8000 &
kubectl port-forward -n todo-app svc/todo-frontend 3000:3000 &

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Step 8: Verify Event Flow

```bash
# Watch backend logs for event publishing
kubectl logs -f -n todo-app deployment/todo-backend -c todo-backend

# Watch recurring task service logs
kubectl logs -f -n todo-app deployment/recurring-task-service -c recurring-task-service

# Watch audit service logs
kubectl logs -f -n todo-app deployment/audit-service -c audit-service

# Create a task via API and watch events flow through the system
```

---

## Cloud Deployment Prerequisites

### What You Need

1. **Cloud Provider Account**
   - Oracle Cloud (OKE)
   - Azure (AKS)
   - Google Cloud (GKE)
   - AWS (EKS)

2. **Payment Method**
   - Credit card for account verification
   - Even free tier requires card on file
   - No charges for free tier usage

3. **CLI Tools**
   - `oci` CLI (for Oracle Cloud)
   - `az` CLI (for Azure)
   - `gcloud` CLI (for Google Cloud)
   - `aws` CLI (for AWS)

4. **Domain Name** (Optional)
   - For production deployment
   - SSL certificate
   - DNS configuration

### Why Cloud Deployment Wasn't Completed

**Reason**: Credit card requirement for cloud provider account verification.

**Impact**:
- ✅ All features work locally on Minikube
- ✅ All Kubernetes manifests are prepared
- ✅ Application is cloud-ready
- ❌ Cannot create cloud Kubernetes cluster without payment method

**Learning Experience**:
- Cloud providers require payment verification even for free tiers
- This is a common requirement for preventing abuse
- Local development with Minikube provides identical functionality
- Cloud deployment is a configuration change, not a code change

---

## Oracle Cloud (OKE) Deployment

### Prerequisites

```bash
# Install OCI CLI
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"

# Configure OCI CLI
oci setup config

# Verify authentication
oci iam region list
```

### Step 1: Create OKE Cluster

```bash
# Set variables
export COMPARTMENT_ID="ocid1.compartment.oc1..xxxxx"
export CLUSTER_NAME="todo-app-cluster"
export K8S_VERSION="v1.28.2"

# Create VCN (Virtual Cloud Network)
oci network vcn create \
  --compartment-id $COMPARTMENT_ID \
  --display-name todo-app-vcn \
  --cidr-block 10.0.0.0/16

# Create OKE cluster
oci ce cluster create \
  --compartment-id $COMPARTMENT_ID \
  --name $CLUSTER_NAME \
  --kubernetes-version $K8S_VERSION \
  --vcn-id <VCN_OCID> \
  --wait-for-state SUCCEEDED

# Get kubeconfig
oci ce cluster create-kubeconfig \
  --cluster-id <CLUSTER_OCID> \
  --file ~/.kube/config-oke \
  --region us-ashburn-1

# Set kubeconfig
export KUBECONFIG=~/.kube/config-oke

# Verify cluster access
kubectl get nodes
```

### Step 2: Install Cloud-Specific Components

```bash
# Install cert-manager for SSL
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Install NGINX Ingress Controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace

# Install Strimzi Kafka (same as local)
kubectl create namespace kafka
kubectl create -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka

# Install Dapr (same as local)
dapr init -k
```

### Step 3: Deploy Application with Helm

```bash
# Update values for cloud deployment
helm install todo-app ./helm/todo-app \
  --namespace todo-app \
  --create-namespace \
  --set environment=production \
  --set backend.image.repository=<YOUR_REGISTRY>/todo-backend \
  --set backend.image.tag=latest \
  --set frontend.image.repository=<YOUR_REGISTRY>/todo-frontend \
  --set frontend.image.tag=latest \
  --set ingress.enabled=true \
  --set ingress.host=todo.yourdomain.com \
  --set database.host=<CLOUD_DB_HOST> \
  --set database.password=<SECURE_PASSWORD>

# Wait for deployment
kubectl wait --for=condition=ready pod --all -n todo-app --timeout=600s

# Get ingress IP
kubectl get ingress -n todo-app
```

### Step 4: Configure DNS

```bash
# Get load balancer IP
export LB_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Create DNS A record
# todo.yourdomain.com -> $LB_IP

# Verify DNS propagation
nslookup todo.yourdomain.com
```

### Step 5: Configure SSL

```bash
# Apply ClusterIssuer for Let's Encrypt
kubectl apply -f k8s/cert-manager/cluster-issuer.yaml

# Certificate will be automatically provisioned by cert-manager
# Verify certificate
kubectl get certificate -n todo-app
```

---

## Verification Steps

### Local Deployment Verification

```bash
# 1. Check all pods are running
kubectl get pods -A

# 2. Check Kafka topics exist
kubectl get kafkatopics -n kafka

# 3. Check Dapr components
kubectl get components -n default

# 4. Test backend health
curl http://localhost:8000/health

# 5. Test frontend
curl http://localhost:3000

# 6. Create a task and verify event flow
# Watch logs in separate terminals:
kubectl logs -f -n todo-app deployment/todo-backend -c todo-backend
kubectl logs -f -n todo-app deployment/audit-service -c audit-service

# Create task via API
curl -X POST http://localhost:8000/api/v1/<user-id>/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","priority":"high"}'

# Expected: See event published in backend logs, received in audit logs
```

### Cloud Deployment Verification

```bash
# 1. Check cluster nodes
kubectl get nodes

# 2. Check all namespaces
kubectl get pods -A

# 3. Check ingress
kubectl get ingress -n todo-app

# 4. Test public URL
curl https://todo.yourdomain.com/health

# 5. Test SSL certificate
curl -vI https://todo.yourdomain.com 2>&1 | grep -i "SSL certificate"

# 6. Monitor application
kubectl top pods -n todo-app
kubectl top nodes
```

---

## Troubleshooting

### Minikube Issues

**Problem**: Minikube won't start
```bash
# Solution: Delete and recreate
minikube delete
minikube start --memory=8192 --cpus=4
```

**Problem**: Pods stuck in Pending
```bash
# Check resources
kubectl describe pod <pod-name> -n <namespace>

# Increase Minikube resources
minikube stop
minikube start --memory=10240 --cpus=6
```

**Problem**: Cannot access services
```bash
# Check port forwards
ps aux | grep "kubectl port-forward"

# Restart port forwards
kubectl port-forward -n todo-app svc/todo-backend 8000:8000 &
kubectl port-forward -n todo-app svc/todo-frontend 3000:3000 &
```

### Kafka Issues

**Problem**: Kafka pods not starting
```bash
# Check Strimzi operator logs
kubectl logs -n kafka deployment/strimzi-cluster-operator

# Check Kafka cluster status
kubectl get kafka -n kafka
kubectl describe kafka my-cluster -n kafka

# Restart Kafka cluster
kubectl delete kafka my-cluster -n kafka
kubectl apply -f k8s/kafka/kafka-cluster.yaml -n kafka
```

**Problem**: Topics not created
```bash
# Check topic status
kubectl get kafkatopics -n kafka
kubectl describe kafkatopic task-events -n kafka

# Manually create topic
kubectl apply -f k8s/kafka/topics/task-events.yaml -n kafka
```

### Dapr Issues

**Problem**: Dapr sidecar not injecting
```bash
# Check Dapr annotation on deployment
kubectl get deployment <deployment-name> -n todo-app -o yaml | grep dapr

# Verify Dapr is running
dapr status -k

# Restart deployment
kubectl rollout restart deployment/<deployment-name> -n todo-app
```

**Problem**: Pub/sub not working
```bash
# Check Dapr component
kubectl get component pubsub -n default
kubectl describe component pubsub -n default

# Check Dapr sidecar logs
kubectl logs <pod-name> -n todo-app -c daprd

# Verify Kafka connection
kubectl exec -it <pod-name> -n todo-app -c daprd -- curl localhost:3500/v1.0/metadata
```

### Application Issues

**Problem**: Backend can't connect to database
```bash
# Check database connection string
kubectl get secret -n todo-app database-secret -o yaml

# Check backend logs
kubectl logs -n todo-app deployment/todo-backend -c todo-backend

# Test database connectivity
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- psql -h <db-host> -U <db-user>
```

**Problem**: Events not flowing
```bash
# Check event publisher logs
kubectl logs -n todo-app deployment/todo-backend -c todo-backend | grep "Publishing event"

# Check Kafka consumer logs
kubectl logs -n todo-app deployment/audit-service -c audit-service | grep "Received event"

# Check Kafka topics have messages
kubectl exec -it my-cluster-kafka-0 -n kafka -- bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic task-events \
  --from-beginning \
  --max-messages 10
```

### Cloud Deployment Issues

**Problem**: Cannot create OKE cluster
```bash
# Check OCI CLI configuration
oci iam region list

# Check compartment permissions
oci iam compartment list

# Verify service limits
oci limits resource-availability get \
  --compartment-id $COMPARTMENT_ID \
  --service-name compute
```

**Problem**: Ingress not getting external IP
```bash
# Check ingress controller
kubectl get svc -n ingress-nginx

# Check load balancer provisioning
kubectl describe svc ingress-nginx-controller -n ingress-nginx

# Wait for cloud provider to provision LB (can take 5-10 minutes)
```

---

## Performance Tuning

### Kafka Configuration

```yaml
# k8s/kafka/kafka-cluster.yaml
spec:
  kafka:
    replicas: 3  # Increase for production
    config:
      num.partitions: 6  # Increase for higher throughput
      default.replication.factor: 2  # Increase for reliability
      min.insync.replicas: 2
```

### Resource Limits

```yaml
# k8s/backend/deployment.yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Horizontal Pod Autoscaling

```bash
# Enable HPA for backend
kubectl autoscale deployment todo-backend -n todo-app \
  --cpu-percent=70 \
  --min=2 \
  --max=10

# Verify HPA
kubectl get hpa -n todo-app
```

---

## Monitoring

### Prometheus + Grafana

```bash
# Install Prometheus stack
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3001:80

# Default credentials: admin / prom-operator
```

### Dapr Dashboard

```bash
# Install Dapr dashboard
dapr dashboard -k -p 8080

# Access at http://localhost:8080
```

---

## Backup and Disaster Recovery

### Database Backup

```bash
# Backup PostgreSQL
kubectl exec -n todo-app deployment/todo-backend -- \
  pg_dump -h <db-host> -U <db-user> -d todo_db > backup.sql

# Restore
kubectl exec -i -n todo-app deployment/todo-backend -- \
  psql -h <db-host> -U <db-user> -d todo_db < backup.sql
```

### Kafka Backup

```bash
# Backup Kafka topics
kubectl exec -it my-cluster-kafka-0 -n kafka -- \
  bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic task-events \
  --from-beginning > task-events-backup.json
```

---

## Security Best Practices

1. **Use Secrets for Sensitive Data**
   ```bash
   kubectl create secret generic database-secret \
     --from-literal=password=<secure-password> \
     -n todo-app
   ```

2. **Enable Network Policies**
   ```bash
   kubectl apply -f k8s/network-policies/
   ```

3. **Use RBAC**
   ```bash
   kubectl apply -f k8s/rbac/
   ```

4. **Enable Pod Security Standards**
   ```bash
   kubectl label namespace todo-app \
     pod-security.kubernetes.io/enforce=restricted
   ```

---

## Cost Optimization (Cloud)

1. **Use Spot/Preemptible Instances** for non-critical workloads
2. **Enable Cluster Autoscaler** to scale down during low usage
3. **Use Managed Services** (Kafka, PostgreSQL) instead of self-hosted
4. **Set Resource Limits** to prevent over-provisioning
5. **Use Reserved Instances** for predictable workloads

---

## Next Steps

### For Local Development
1. ✅ All features working on Minikube
2. ✅ Event-driven architecture operational
3. ✅ Microservices communicating via Kafka
4. ✅ Dapr components configured
5. ✅ Ready for demonstration

### For Cloud Deployment
1. 📋 Obtain cloud provider account with payment method
2. 📋 Create Kubernetes cluster (OKE/AKS/GKE)
3. 📋 Deploy using Helm charts
4. 📋 Configure DNS and SSL
5. 📋 Set up monitoring and alerts

---

## Support

For issues or questions:
- Check [Troubleshooting](#troubleshooting) section
- Review logs: `kubectl logs -n todo-app <pod-name>`
- Check Dapr status: `dapr status -k`
- Verify Kafka: `kubectl get kafkatopics -n kafka`

---

**Documentation Version**: 1.0
**Last Updated**: March 11, 2026
**Maintained By**: Todo App Team
