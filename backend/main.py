from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from src.dependencies import get_db
from src.database.session import get_session
from src.repositories.task_repository import get_tasks_for_user
from sqlmodel import Session
from src.database.init_db import initialize_database
from src.api.routes.auth import router as auth_router
from src.api.routes.tasks import router as tasks_router
from src.api.routes.jobs import router as jobs_router
from src.api.routes.diagnostic import router as diagnostic_router
from src.api.chat import router as chat_router
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler to manage application startup and shutdown events.
    """
    # Startup: Initialize database tables (redundant but safe for local/dev)
    try:
        initialize_database()
    except:
        pass
    yield

app = FastAPI(
    title="Todo API with Database Integration",
    lifespan=lifespan
)

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables at global scope for serverless environments
try:
    initialize_database()
except Exception as e:
    print(f"Database initialization failed: {str(e)}")

# Register routes
app.include_router(auth_router, prefix="")
app.include_router(chat_router, prefix="")
app.include_router(tasks_router, prefix="/api/v1/{path_user_id}")
app.include_router(jobs_router, prefix="/api")
app.include_router(diagnostic_router, prefix="")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Todo API"}

@app.get("/api/db-test")
def test_db_connection(db: Session = Depends(get_db)):
    try:
        mock_user_id = "test_user_123"
        tasks = get_tasks_for_user(db=db, user_id=mock_user_id, completed_filter=None)
        return {
            "message": "Database connection successful",
            "user_id": mock_user_id,
            "task_count": len(tasks),
            "sample_tasks": tasks[:5]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection failed: {str(e)}"
        )

@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Todo API is running successfully"}
