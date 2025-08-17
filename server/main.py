import asyncio
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, AIMessage
from sqlalchemy.future import select

from database import AsyncSessionLocal, ChatSession, init_db, serialize_history, deserialize_history
from llm import generate_response

app = FastAPI()

origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    await init_db()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/chat")
async def read_chat(input: str, session_id: str = Query("default")):
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
                yield chunk
            
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
                print(f"Error saving to database: {e}")

        return StreamingResponse(event_stream(), media_type="text/plain")