import os
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")

llm = ChatOllama(
    base_url=OLLAMA_BASE_URL,
    model=OLLAMA_MODEL,
    temperature=0.7
)


async def generate_response(query: str, chat_history: list):
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful assistant."),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{query}")
    ])

    try:
        chain = prompt | llm
        response = chain.stream({"query": query, "chat_history": chat_history})

        for chunk in response:
            yield chunk.content or ""

    except Exception as e:
        print(f"Error during stream generation: {e}")
        yield "Sorry, an error occurred while generating the response."
