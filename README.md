# Full-Stack Todo Application

A comprehensive full-stack todo application featuring a FastAPI backend with JWT authentication and a Next.js frontend with modern UI components.

## 📚 Documentation

**Phase 5A is complete!** For setup and usage instructions, see:

- **[📖 Documentation Index](docs/INDEX.md)** - Start here for all documentation
- **[🚀 Setup Guide](docs/SETUP-GUIDE.md)** - Complete installation instructions
- **[⚡ Quick Reference](docs/QUICK-REFERENCE.md)** - Common commands
- **[🎯 Demo Script](docs/phase5a-demo-script.md)** - Feature demonstration
- **[🔧 Troubleshooting](docs/troubleshooting.md)** - Problem resolution

## Overview

This is a full-featured todo application built with modern web technologies. The application includes:
- A FastAPI backend with JWT authentication and SQLModel database integration
- A Next.js frontend with responsive UI components and state management
- AI Chat Assistant for natural language task management (Phase 3)
- Event-driven architecture with Kafka and Dapr (Phase 5A)
- Advanced task management features (Phase 5A)
- Authentication system with signup/login functionality
- Task management with CRUD operations
- Responsive dashboard layout

## Features

### Phase 5A: Advanced Features (NEW! ✨)
- **Priorities & Tags**: Organize tasks with priority levels (low/medium/high) and custom tags
- **Search & Filter**: Full-text search with multiple filters (status, priority, tags, date range)
- **Sort Tasks**: Sort by due date, priority, title, creation date, or completion date
- **Recurring Tasks**: Automatically create next occurrence when recurring tasks are completed
- **Due Dates & Reminders**: Set due dates with time-based reminders and browser notifications
- **Event-Driven Architecture**: Kafka + Dapr for scalable microservices
- **Microservices**: Recurring task service, notification service, audit service
- **Overdue Highlighting**: Visual indicators for overdue tasks

### AI Assistant (Phase 3)
- **Natural Language CRUD**: Add, list, complete, and delete tasks using plain English.
- **Persistent Conversation**: Chat history is saved and reloaded across sessions.
- **MCP Tool Integration**: Standardized tool-calling via Model Context Protocol.
- **Secure Data Isolation**: AI only accesses tasks belonging to the authenticated user.

### Backend (FastAPI)
- JWT-based authentication system
- User registration and login
- Task CRUD operations (Create, Read, Update, Delete)
- SQLModel database schema for data persistence
- Protected API routes
- Neon database integration
- Event publishing via Dapr (Phase 5A)
- Reminder scheduling via Dapr Jobs (Phase 5A)

### Frontend (Next.js)
- Responsive dashboard layout
- Task management interface
- Authentication flows (sign up, sign in)
- Modern UI components with Tailwind CSS
- State management with Zustand
- API integration with custom hooks
- Type-safe development with TypeScript

### Authentication
- Secure JWT token handling
- Session management
- Protected routes
- User isolation for tasks

## Tech Stack

### Backend
- **Python 3.13+**: Programming language
- **FastAPI**: Web framework
- **SQLModel**: Database ORM
- **Pydantic**: Data validation
- **JWT**: Token-based authentication
- **Neon**: Cloud PostgreSQL database

### Frontend
- **Next.js 14+**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Zustand**: State management
- **TanStack Query**: Server state management
- **Better Auth**: Authentication library

## Prerequisites

- Python 3.13 or higher
- Node.js 18+ and npm/yarn
- PostgreSQL database (or Neon account)
- Git

## Setup Instructions

### Backend Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Navigate to the backend directory and set up Python environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and secret keys
   ```

4. Run the backend:
   ```bash
   python app.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend  # or cd ../frontend if coming from backend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API URL and other configuration
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

### Phase 3 Setup (AI Assistant)

1. **Cohere API Key**: Obtain a free API key from [Cohere](https://dashboard.cohere.com/api-keys).
2. **Environment Variables**:
   - Backend (.env): Add `COHERE_API_KEY=your_key_here`
   - Frontend (.env.local): Add `NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your_domain_key` (if using OpenAI ChatKit)
3. **Database Migration**: Run the chat migration script to create new tables:
   ```bash
   cd backend
   python migrate_chat.py
   ```

### Phase 4 Setup (Local Kubernetes Deployment)

1. **Prerequisites**: Ensure `minikube`, `kubectl`, and `helm` are installed.
2. **Start Minikube**:
   ```bash
   minikube start --driver=docker
   ```
3. **Build Images**:
   ```bash
   eval $(minikube docker-env)
   docker build -t todo-backend:latest ./backend
   docker build -t todo-frontend:latest ./frontend
   ```
4. **Deploy**:
   ```bash
   # Create secrets first
   kubectl create secret generic todo-secrets \
     --from-literal=DATABASE_URL="your_db_url" \
     --from-literal=COHERE_API_KEY="your_api_key" \
     --from-literal=JWT_SECRET="your_jwt_secret"

   # Install charts
   helm install todo-backend ./helm/todo-backend
   helm install todo-frontend ./helm/todo-frontend
   ```
5. **Access**:
   ```bash
   minikube service todo-frontend
   ```

### Phase 5A Setup (Advanced Features with Event-Driven Architecture)

**Overview**: Phase 5A adds advanced task management features with event-driven architecture using Kafka (Strimzi) and Dapr, all running locally on Minikube.

#### New Features
- **Priorities & Tags**: Organize tasks with priority levels (low/medium/high) and custom tags
- **Search & Filter**: Find tasks by keyword, filter by status, priority, tags, and date range
- **Sort Tasks**: Sort by due date, priority, title, creation date, or completion date
- **Recurring Tasks**: Automatically create next occurrence when recurring tasks are completed
- **Due Dates & Reminders**: Set due dates with time-based reminders and browser notifications

#### Prerequisites
- Minikube running with at least 4GB memory
- Docker Desktop running
- kubectl and helm installed
- Dapr CLI installed: `curl -fsSL https://raw.githubusercontent.com/dapr/cli/master/install/install.sh | /bin/bash`

#### Step 1: Install Strimzi (Kafka Operator)
```bash
# Run the installation script
./scripts/install-strimzi.sh

# Verify Strimzi is running
kubectl get pods -n kafka
```

#### Step 2: Deploy Kafka Cluster
```bash
# Apply Kafka cluster configuration
kubectl apply -f k8s/strimzi/kafka-cluster.yaml

# Wait for Kafka to be ready (may take 2-3 minutes)
kubectl wait kafka/todo-kafka --for=condition=Ready --timeout=300s -n kafka

# Create Kafka topics
kubectl apply -f k8s/strimzi/kafka-topics.yaml

# Verify topics are created
kubectl get kafkatopics -n kafka
```

#### Step 3: Install Dapr on Minikube
```bash
# Run the installation script
./scripts/install-dapr.sh

# Verify Dapr is running
kubectl get pods -n dapr-system
```

#### Step 4: Deploy Dapr Components
```bash
# Apply Dapr configuration
kubectl apply -f k8s/dapr/configuration.yaml

# Deploy Dapr components (will be applied with Helm charts)
# Components include: Pub/Sub (Kafka), State Store (PostgreSQL), Secrets (Kubernetes)
```

#### Step 5: Build and Deploy Microservices
```bash
# Set Docker environment to Minikube
eval $(minikube docker-env)

# Build backend with Dapr support
docker build -t todo-backend:latest ./backend

# Build microservices
docker build -t recurring-task-service:latest ./microservices/recurring-task-service
docker build -t notification-service:latest ./microservices/notification-service
docker build -t audit-service:latest ./microservices/audit-service

# Deploy backend with Dapr sidecar
helm upgrade --install todo-backend ./helm/todo-backend

# Deploy microservices
helm install recurring-task-service ./helm/recurring-task-service
helm install notification-service ./helm/notification-service
helm install audit-service ./helm/audit-service
```

#### Step 6: Verify Deployment
```bash
# Check all pods are running
kubectl get pods

# Check Dapr sidecars are injected
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].name}{"\n"}{end}'

# Verify Kafka topics
kubectl get kafkatopics -n kafka

# Check Dapr components
kubectl get components
```

#### Step 7: Test Event Flow
```bash
# Create a task via API and check logs
kubectl logs -l app=todo-backend -c daprd --tail=50

# Check recurring-task-service received events
kubectl logs -l app=recurring-task-service -c recurring-task-service --tail=50

# Check audit-service logged events
kubectl logs -l app=audit-service -c audit-service --tail=50
```

#### Troubleshooting
See `docs/troubleshooting.md` for common issues and solutions.

#### Management Commands
- **Kafka**: See `docs/kafka-management.md`
- **Dapr**: See `docs/dapr-commands.md`

#### Demo
Follow `docs/phase5a-demo-script.md` to see all features in action.


## Project Structure

```
.
├── backend/
│   ├── app.py                 # Main FastAPI application
│   ├── models/                # Database models
│   │   └── task.py           # Task model and operations
│   ├── src/                   # Source code
│   ├── auth/                  # Authentication logic
│   ├── api/                   # API route definitions
│   ├── requirements.txt       # Python dependencies
│   └── vercel.json            # Vercel deployment config
├── frontend/
│   ├── app/                   # Next.js app router pages
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Utilities and API clients
│   │   ├── api.js            # API client
│   │   ├── auth.ts           # Authentication helpers
│   │   └── types.ts          # TypeScript types
│   ├── hooks/                 # Custom React hooks
│   ├── package.json           # Node.js dependencies
│   ├── next.config.js         # Next.js configuration
│   └── tsconfig.json          # TypeScript configuration
├── .env.example              # Environment variable template
├── .gitignore                # Git ignore rules
├── README.md                 # This file
└── requirements.txt          # Root Python dependencies
```

## API Endpoints

### Authentication
- `POST /auth/sign-up/email` - Register a new user
- `POST /auth/sign-in/email` - Login with email/password
- `POST /auth/sign-out` - Logout

### Tasks
- `GET /tasks` - Get all user's tasks
- `POST /tasks` - Create a new task
- `GET /tasks/{task_id}` - Get a specific task
- `PUT /tasks/{task_id}` - Update a task
- `DELETE /tasks/{task_id}` - Delete a task

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@host:port/database
SECRET_KEY=your-secret-key-for-jwt
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Development

### Running in Development Mode

1. Start the backend server
2. Start the frontend development server
3. Access the application at `http://localhost:3000`

### Testing

Backend tests can be run with:
```bash
pytest
```

## Deployment

### Backend (Vercel)
The backend is configured for Vercel deployment with the `vercel.json` file.

### Frontend (Vercel)
The Next.js frontend can be deployed directly to Vercel.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please file an issue in the GitHub repository.