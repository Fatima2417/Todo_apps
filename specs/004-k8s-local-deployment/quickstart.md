# Quickstart: Phase 4 - Local Kubernetes Deployment

This guide provides the steps to build, deploy, and verify the Todo Chatbot on Minikube.

## Prerequisites
1. **Minikube**: Installed and running (`minikube start --driver=docker`).
2. **Helm**: Installed (`helm version`).
3. **AI Tools**: Gordon, kubectl-ai, kagent.

## Step 1: Build Images
Use Gordon to generate Dockerfiles and build images inside the Minikube environment.

```bash
# Point shell to Minikube's Docker daemon
eval $(minikube docker-env)

# Build Backend
docker ai "Create a Dockerfile for FastAPI"
docker build -t todo-backend:latest ./backend

# Build Frontend
docker ai "Create a Dockerfile for Next.js"
docker build -t todo-frontend:latest ./frontend
```

## Step 2: Deploy Secrets
Create the necessary Kubernetes secrets before installing the Helm charts.

```bash
kubectl create secret generic todo-secrets 
  --from-literal=DATABASE_URL="your_neon_url" 
  --from-literal=COHERE_API_KEY="your_cohere_key" 
  --from-literal=JWT_SECRET="your_jwt_secret"
```

## Step 3: Install Helm Charts
Deploy the application using the Helm charts.

```bash
helm install todo-backend ./helm/todo-backend
helm install todo-frontend ./helm/todo-frontend
```

## Step 4: Verification
Verify that the pods are running and access the application.

```bash
# Check Pods
kubectl get pods

# Access Frontend
minikube service todo-frontend
```

## Step 5: AI Operations Log
Document all AI tool commands in `docs/phase4-ai-log.md`.
