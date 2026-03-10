# Complete Step-by-Step Guide to Run Phase 5A Project

## Overview
This guide will help you run the complete Phase 5A Todo application with all advanced features on your local machine using Minikube.

**Estimated Time**: 45-60 minutes for first-time setup

---

## Part 1: Prerequisites Installation (15 minutes)

### Step 1.1: Install Docker Desktop
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Install and start Docker Desktop
3. Verify: Open terminal and run `docker ps`
4. Expected: Should show running containers (or empty list, no errors)

### Step 1.2: Install Minikube
**Windows**:
```powershell
choco install minikube
# OR download from https://minikube.sigs.k8s.io/docs/start/
```

**Mac**:
```bash
brew install minikube
```

**Linux**:
```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

Verify: `minikube version`

### Step 1.3: Install kubectl
**Windows**:
```powershell
choco install kubernetes-cli
```

**Mac**:
```bash
brew install kubectl
```

**Linux**:
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

Verify: `kubectl version --client`

### Step 1.4: Install Helm
**Windows**:
```powershell
choco install kubernetes-helm
```

**Mac**:
```bash
brew install helm
```

**Linux**:
```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

Verify: `helm version`

### Step 1.5: Install Dapr CLI
**Windows**:
```powershell
powershell -Command "iwr -useb https://raw.githubusercontent.com/dapr/cli/master/install/install.ps1 | iex"
```

**Mac/Linux**:
```bash
curl -fsSL https://raw.githubusercontent.com/dapr/cli/master/install/install.sh | /bin/bash
```

Verify: `dapr version`

### Step 1.6: Install Python 3.11+
Download from https://www.python.org/downloads/
Verify: `python --version`

### Step 1.7: Install Node.js 18+
Download from https://nodejs.org/
Verify: `node --version`

### Step 1.8: Run Prerequisites Check
```bash
cd "C:\Users\Hp\Documents\H_2_F - Phase 4 copy"
bash scripts/check-prerequisites.sh
```

Expected: All items should show ✓

---

## Part 2: Start Infrastructure (10 minutes)

### Step 2.1: Start Docker Desktop
1. Open Docker Desktop application
2. Wait until Docker icon shows "Docker Desktop is running"
3. Verify: `docker ps` (should not show errors)

### Step 2.2: Start Minikube
```bash
# Start with 4GB memory (minimum for Phase 5A)
minikube start --driver=docker --memory=4096

# Wait for startup (2-3 minutes)
# Expected output: "Done! kubectl is now configured to use 'minikube' cluster"
```

Verify:
```bash
minikube status
# Expected:
# minikube: Running
# kubelet: Running
# apiserver: Running
```

### Step 2.3: Enable Minikube Addons
```bash
minikube addons enable metrics-server
minikube addons enable dashboard
```

---

## Part 3: Database Setup (5 minutes)

### Step 3.1: Set Up Neon Database
1. Go to https://neon.tech
2. Sign up for free account (if you don't have one)
3. Create a new project: "todo-app-phase5"
4. Copy the connection string (looks like: `postgresql://user:pass@host/dbname`)

### Step 3.2: Create Backend .env File
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://your_neon_connection_string
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
COHERE_API_KEY=your_cohere_api_key_from_phase3
DAPR_HTTP_PORT=3500
DAPR_GRPC_PORT=50001
```

### Step 3.3: Run Database Migrations
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run migrations
python -c "from src.database import init_db; init_db()"
```

---

## Part 4: Install Kafka (Strimzi) (10 minutes)

### Step 4.1: Install Strimzi Operator
```bash
cd "C:\Users\Hp\Documents\H_2_F - Phase 4 copy"
bash scripts/install-strimzi.sh
```

Expected output: "Strimzi operator installed successfully"

Verify:
```bash
kubectl get pods -n kafka
# Wait until strimzi-cluster-operator pod is Running
```

### Step 4.2: Deploy Kafka Cluster
```bash
kubectl apply -f k8s/strimzi/kafka-cluster.yaml
```

Wait for Kafka to be ready (2-3 minutes):
```bash
kubectl wait kafka/todo-kafka --for=condition=Ready --timeout=300s -n kafka
```

Verify:
```bash
kubectl get pods -n kafka
# Expected: todo-kafka-kafka-0, todo-kafka-zookeeper-0 in Running state
```

### Step 4.3: Create Kafka Topics
```bash
kubectl apply -f k8s/strimzi/kafka-topics.yaml
```

Verify:
```bash
kubectl get kafkatopics -n kafka
# Expected: task-events, reminders, task-updates
```

---

## Part 5: Install Dapr (5 minutes)

### Step 5.1: Initialize Dapr on Minikube
```bash
dapr init -k
```

Wait for installation (1-2 minutes)

Verify:
```bash
dapr status -k
# Expected: All components showing "Running" and "Healthy"
```

### Step 5.2: Apply Dapr Configuration
```bash
kubectl apply -f k8s/dapr/configuration.yaml
```

---

## Part 6: Build Docker Images (10 minutes)

### Step 6.1: Configure Docker to Use Minikube
```bash
# Windows (PowerShell)
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# Mac/Linux
eval $(minikube docker-env)
```

### Step 6.2: Build Backend Image
```bash
cd "C:\Users\Hp\Documents\H_2_F - Phase 4 copy\backend"
docker build -t todo-backend:latest .
```

Expected: "Successfully tagged todo-backend:latest"

### Step 6.3: Build Frontend Image
```bash
cd ../frontend
docker build -t todo-frontend:latest .
```

### Step 6.4: Build Microservices Images
```bash
# Recurring task service
cd ../microservices/recurring-task-service
docker build -t recurring-task-service:latest .

# Notification service
cd ../notification-service
docker build -t notification-service:latest .

# Audit service
cd ../audit-service
docker build -t audit-service:latest .
```

Verify all images:
```bash
docker images | grep -E "todo-backend|todo-frontend|recurring|notification|audit"
```

---

## Part 7: Create Kubernetes Secrets (2 minutes)

```bash
cd "C:\Users\Hp\Documents\H_2_F - Phase 4 copy"

kubectl create secret generic todo-secrets \
  --from-literal=DATABASE_URL="your_neon_connection_string" \
  --from-literal=COHERE_API_KEY="your_cohere_api_key" \
  --from-literal=JWT_SECRET="your_jwt_secret"
```

Verify:
```bash
kubectl get secrets
# Expected: todo-secrets listed
```

---

## Part 8: Deploy with Helm (5 minutes)

### Step 8.1: Deploy Backend
```bash
helm install todo-backend ./helm/todo-backend
```

Wait and verify:
```bash
kubectl get pods -l app=todo-backend
# Wait until 2/2 containers ready (app + daprd sidecar)
```

### Step 8.2: Deploy Microservices
```bash
helm install recurring-task-service ./helm/recurring-task-service
helm install notification-service ./helm/notification-service
helm install audit-service ./helm/audit-service
```

Verify all pods:
```bash
kubectl get pods
# Expected: All pods showing 2/2 Ready
```

### Step 8.3: Deploy Frontend
```bash
helm install todo-frontend ./helm/todo-frontend
```

---

## Part 9: Access the Application (2 minutes)

### Step 9.1: Get Frontend URL
```bash
minikube service todo-frontend --url
```

Expected output: `http://127.0.0.1:xxxxx`

### Step 9.2: Open in Browser
1. Copy the URL from previous command
2. Open in your browser
3. You should see the Todo app login page

### Step 9.3: Create Account
1. Click "Sign Up"
2. Enter email and password
3. Click "Create Account"
4. Login with your credentials

---

## Part 10: Verify Everything Works (5 minutes)

### Step 10.1: Check All Pods
```bash
kubectl get pods --all-namespaces
```

Expected: All pods in Running state

### Step 10.2: Check Dapr Components
```bash
kubectl get components
```

Expected: pubsub, statestore, secrets components

### Step 10.3: Check Kafka Topics
```bash
kubectl get kafkatopics -n kafka
```

Expected: task-events, reminders, task-updates

### Step 10.4: Test Basic Functionality
1. Create a task in the UI
2. Check backend logs:
```bash
kubectl logs -l app=todo-backend -c todo-backend --tail=20
```
Expected: "Publishing task.created event"

3. Check audit service logs:
```bash
kubectl logs -l app=audit-service -c audit-service --tail=20
```
Expected: "Audit log: task.created"

### Step 10.5: Test Advanced Features
Follow the demo script:
```bash
cat docs/phase5a-demo-script.md
```

---

## Part 11: Monitoring & Debugging

### Open Dapr Dashboard
```bash
dapr dashboard -k
```
Opens at http://localhost:8080

### Open Kubernetes Dashboard
```bash
minikube dashboard
```

### View Logs
```bash
# Backend logs
kubectl logs -l app=todo-backend -c todo-backend -f

# Dapr sidecar logs
kubectl logs -l app=todo-backend -c daprd -f

# Microservice logs
kubectl logs -l app=recurring-task-service -c recurring-task-service -f
kubectl logs -l app=notification-service -c notification-service -f
kubectl logs -l app=audit-service -c audit-service -f
```

### Check Resource Usage
```bash
kubectl top nodes
kubectl top pods
```

---

## Troubleshooting

If you encounter issues, see:
```bash
cat docs/troubleshooting.md
```

Common issues:
1. **Docker not running**: Start Docker Desktop
2. **Minikube not starting**: Run `minikube delete` then `minikube start`
3. **Pods not starting**: Check logs with `kubectl describe pod <pod-name>`
4. **Images not found**: Ensure you ran `eval $(minikube docker-env)` before building

---

## Stopping the Application

### Stop all services but keep data:
```bash
# Stop Minikube
minikube stop
```

### Complete cleanup:
```bash
# Delete everything
helm uninstall todo-backend todo-frontend recurring-task-service notification-service audit-service
kubectl delete kafka todo-kafka -n kafka
dapr uninstall -k
minikube delete
```

---

## Quick Start (After First Setup)

Once everything is installed, you can start quickly:

```bash
# 1. Start Docker Desktop (GUI)

# 2. Start Minikube
minikube start

# 3. Access application
minikube service todo-frontend --url
```

---

## Next Steps

Once everything is running:
1. Follow the demo script: `docs/phase5a-demo-script.md`
2. Test all features (priorities, tags, search, recurring tasks, reminders)
3. Monitor events in Kafka
4. Check audit logs

Enjoy your fully-featured event-driven Todo application! 🎉
