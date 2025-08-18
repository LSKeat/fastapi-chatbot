import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, AIMessage
from sqlalchemy.future import select

from database import AsyncSessionLocal, ChatSession, init_db, serialize_history, deserialize_history
from llm import generate_response

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up application...")
    try:
        await init_db()
        logger.info("Application startup completed successfully!")
    except Exception as e:
        logger.error(f"Failed to initialize application: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")

app = FastAPI(lifespan=lifespan)

# Update CORS to include the frontend service
origins = [
    "http://localhost:3000",
    "http://frontend:3000",
    "http://frontend:80",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/chat")
async def read_chat(input: str, session_id: str = Query("default")):
    try:
        async with AsyncSessionLocal() as db:
            # Load session from Database
            result = await db.execute(select(ChatSession).where(ChatSession.session_id == session_id))
            chat_row = result.scalars().first()

            if chat_row:
                chat_history = deserialize_history(chat_row.history)
            else:
                chat_history = []

            chat_history.append(HumanMessage(content=input))

            async def event_stream():
                full_response = ""
                
                async for chunk in generate_response(input, chat_history[:-1]):
                    full_response += chunk
                    yield f"{chunk}"
                    await asyncio.sleep(0.01)
                
                chat_history.append(AIMessage(content=full_response))

                try:
                    async with AsyncSessionLocal() as save_db:
                        result = await save_db.execute(select(ChatSession).where(ChatSession.session_id == session_id))
                        current_chat_row = result.scalars().first()
                        
                        if current_chat_row:
                            current_chat_row.history = serialize_history(chat_history)
                            current_chat_row.message_count = len(chat_history)
                        else:
                            new_row = ChatSession(
                                session_id=session_id, 
                                history=serialize_history(chat_history),
                                message_count=len(chat_history)
                            )
                            save_db.add(new_row)

                        await save_db.commit()
                except Exception as e:
                    logger.error(f"Error saving to database: {e}")

            return StreamingResponse(
                event_stream(), 
                media_type="text/plain",
                headers={
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no",
                    "Transfer-Encoding": "chunked",
                    "Content-Type": "text/plain; charset=utf-8"
                }
            )
    
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        return {"error": "Internal server error"}