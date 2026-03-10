#!/bin/bash
# Verify Deployment Script for Phase 4

echo "Starting deployment verification..."

# Check if Minikube is running
if ! minikube status | grep -q "Running"; then
  echo "Error: Minikube is not running."
  exit 1
fi

# Build images
echo "Building images..."
eval $(minikube docker-env)
docker build -t todo-backend:latest ./backend
docker build -t todo-frontend:latest ./frontend

# Create secrets (dummy values if not present)
echo "Ensuring secrets exist..."
kubectl create secret generic todo-secrets 
  --from-literal=DATABASE_URL="postgresql://user:pass@host/db" 
  --from-literal=COHERE_API_KEY="dummy_key" 
  --from-literal=JWT_SECRET="secret" 
  --dry-run=client -o yaml | kubectl apply -f -

# Install Charts
echo "Installing Helm charts..."
helm upgrade --install todo-backend ./helm/todo-backend
helm upgrade --install todo-frontend ./helm/todo-frontend

# Wait for pods
echo "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=todo-backend --timeout=300s
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=todo-frontend --timeout=300s

echo "Deployment verified successfully!"
