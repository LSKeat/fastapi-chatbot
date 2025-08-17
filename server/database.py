import os
import json
from datetime import datetime
from typing import List
from dotenv import load_dotenv

from langchain_core.messages import BaseMessage, messages_from_dict, messages_to_dict

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, String, Text, DateTime, Integer

load_dotenv()

DATABASE_URL = os.getenv("SQL_DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("SQL_DATABASE_URL environment variable is required")

engine = create_async_engine(
    DATABASE_URL, 
    echo=False,
    future=True,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=300
)

AsyncSessionLocal = sessionmaker(
    engine, 
    expire_on_commit=False, 
    class_=AsyncSession
)

Base = declarative_base()

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    session_id = Column(String(255), primary_key=True, index=True)
    history = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    message_count = Column(Integer, default=0)

async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

def serialize_history(history: List[BaseMessage]) -> str:
    """Serialize chat history to JSON string"""
    try:
        return json.dumps(messages_to_dict(history))
    except Exception as e:
        print(f"Error serializing history: {e}")
        return "[]"

def deserialize_history(history_str: str) -> List[BaseMessage]:
    """Deserialize chat history from JSON string"""
    try:
        if not history_str:
            return []
        return messages_from_dict(json.loads(history_str))
    except Exception as e:
        print(f"Error deserializing history: {e}")
        return []