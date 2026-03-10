# Deployment Model: Phase 4 - Local Kubernetes

This document defines the Kubernetes resources and configurations for the Phase 4 deployment.

## Kubernetes Resources

### 1. Todo Backend
- **Type**: `Deployment`
- **Replicas**: 1
- **Containers**: `todo-backend:latest`
- **Environment**:
  - `DATABASE_URL` (from Secret)
  - `COHERE_API_KEY` (from Secret)
  - `JWT_SECRET` (from Secret)
- **Service**: `todo-backend` (Type: `ClusterIP`)
- **Ports**: 8000

### 2. Todo Frontend
- **Type**: `Deployment`
- **Replicas**: 1
- **Containers**: `todo-frontend:latest`
- **Environment**:
  - `NEXT_PUBLIC_API_URL` (from ConfigMap)
- **Service**: `todo-frontend` (Type: `NodePort`)
- **Ports**: 3000

### 3. ConfigMaps & Secrets
- **ConfigMap**: `todo-config`
  - `NEXT_PUBLIC_API_URL`: Internal cluster URL or NodePort URL.
- **Secret**: `todo-secrets` (Opaque)
  - `DATABASE_URL`
  - `COHERE_API_KEY`
  - `JWT_SECRET`

## Resource Limits
| Component | CPU (Req/Limit) | Memory (Req/Limit) |
|-----------|-----------------|--------------------|
| Frontend  | 200m / 500m     | 256Mi / 512Mi      |
| Backend   | 100m / 300m     | 128Mi / 256Mi      |
