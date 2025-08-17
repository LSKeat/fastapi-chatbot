from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage

llm = ChatOllama(model="llama3.1", temperature=0)

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
