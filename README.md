# 🤖 LLM Chat Interface with fastapi

A modern, real-time chat interface for Large Language Models with streaming responses and persistent chat history.

![Chat Interface Demo](https://img.shields.io/badge/status-active-brightgreen.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)
![React](https://img.shields.io/badge/React-22+-61dafb.svg)

## ✨ Features

* **Real-time Streaming**: Token-by-token response streaming for natural conversation flow
* **Persistent Chat History**: MySQL database integration with chat session management
* **Modern UI**: Responsive React interface
* **RESTful API**: FastAPI backend with comprehensive endpoint coverage
* **Session Management**: Single chat sessions with unique identifiers
* **Dockerized**: Complete Docker setup for easy deployment

### Key Components

1. **Frontend (React)**

   * Real-time chat interface
   * Server-Sent Events (SSE) for streaming
   * Responsive design
   * Error handling and loading states

2. **Backend (FastAPI)**

   * RESTful API endpoints
   * Async streaming responses
   * MySQL Database integration
   * Local LLM

3. **Database (MySQL)
   * Chat session persistence
   * Message history storage
   * Async operations

## 🚀 Quick Start

### Prerequisites

* Python 3.11+
* Node.js 22+
* npm
* Docker (optional)
* Ollama

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/LSKeat/fastapi-chatbot.git
   cd fastapi-chatbot
   ```

2. **Backend Setup**

   ```bash
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate

   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Frontend Setup**

   ```bash
   cd my-app

   # Install dependencies
   npm install
   ```

## Ollama Installation Steps:

### Install Ollama

**macOS**

```bash
brew install ollama
```

**Linux**

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows**

```bash
Download from https://ollama.com/download
```

### Start Ollama Service

```bash
# Start the Ollama server
ollama serve

# In another terminal, pull a model
ollama pull llama3.1
```

### Test Ollama Setup

```bash
# Test if Ollama is working
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1",
  "prompt": "Hello, how are you?",
  "stream": false
}'
```

### System Requirements for Ollama:

* **Minimum**: 8GB RAM, 4GB free disk space
* **Recommended**: 16GB RAM, 8GB free disk space
* **GPU Support**: NVIDIA GPUs with CUDA for faster inference

### Running Locally

1. **Start the Backend**

   ```bash
   # From server directory
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start the Frontend**

   ```bash
   # From my-app directory
   npm start
   ```

3. **Run Ollama locally**

   ```bash
   ollama serve
   ollama pull llama3.1
   ```

4. **Access the Application**

   * Frontend: [http://localhost:3000](http://localhost:3000)
   * Backend API: [http://localhost:8000](http://localhost:8000)
   * API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)


## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

1. **Build and run all services**
   ```bash
   docker-compose up --build
   ```
   
2. **Run Ollama locally**
   ```bash
   ollama serve
   ollama pull llama3.1
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000

### Individual Docker Commands

**Backend:**
```bash
docker build -t llm-chat-backend .
docker run -p 8000:8000 llm-chat-backend
```

**Frontend:**
```bash
docker build -t llm-chat-frontend -f frontend/Dockerfile frontend/
docker run -p 3000:80 llm-chat-frontend
```

## 🔌 API Documentation

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check and welcome message |
| `GET` | `/health` | System health status |
| `POST` | `/chat/stream` | Stream chat responses (SSE) |
| `GET` | `/chat/history/{session_id}` | Get chat history for session |
| `DELETE` | `/chat/history/{session_id}` | Delete chat session |

### Streaming Chat Example

**Request:**
```bash
curl -X POST "http://localhost:8000/chat/stream" \
     -H "Content-Type: application/json" \
     -d '{
       "message": "Hello, how are you?",
       "session_id": "user_123"
     }'
```

**Response (Server-Sent Events):**
```
data: {"chunk": "Hello", "session_id": "user_123"}

data: {"chunk": "!", "session_id": "user_123"}

data: {"chunk": " I'm", "session_id": "user_123"}

data: {"done": true, "session_id": "user_123"}
```

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern web framework for Python
- [React](https://reactjs.org/) - JavaScript library for building user interfaces
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [SQLAlchemy](https://sqlalchemy.org/) - Python SQL toolkit and ORM

## 📞 Support

If you have any questions or need help with setup, please:

1. Check the [Issues](https://github.com/LSKeat/fastapi-chatbot/issues) page
2. Create a new issue with detailed information

---

**Made with ❤️ by LSKeat**

*Star ⭐ this repository if you find it helpful!*
