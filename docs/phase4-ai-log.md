# Phase 4 AI Operations Log

## Gordon (Docker AI)
**Prompt**: "Create a production Dockerfile for a FastAPI app using Python 3.13 and uvicorn"
**Output**: Generated `backend/Dockerfile` using multi-stage build and non-root user.

**Prompt**: "Create a production Dockerfile for a Next.js app that uses pnpm"
**Output**: Generated `frontend/Dockerfile` using standalone output mode.

## kubectl-ai / Claude Code
**Prompt**: "Create a Helm chart for a todo-backend deployment with a ClusterIP service"
**Output**: Generated `helm/todo-backend` chart structure and templates.

**Prompt**: "Create a Helm chart for a todo-frontend deployment with a NodePort service"
**Output**: Generated `helm/todo-frontend` chart structure and templates.

## kagent
**Prompt**: "Analyse cluster health and suggest optimisations"
**Output**: (Simulated) Suggested setting explicit resource limits for pods to avoid OOM kills in Minikube. Implemented in `values.yaml`.
