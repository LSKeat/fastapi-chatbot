import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="send-icon">
    <path d="m22 2-7 20-4-9-9-4Z"/>
    <path d="M22 2 11 13"/>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="plus-icon">
    <circle cx="12" cy="12" r="10"/>
    <path d="M8 12h8"/>
    <path d="M12 8v8"/>
  </svg>
);

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chat-icon">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="trash-icon">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

const BotIcon = () => (
  <div className="bot-avatar">
    AI
  </div>
);

const UserIcon = () => (
  <div className="user-avatar">
    You
  </div>
);

function App() {
  const [input, setInput] = useState('');
  const [chats, setChats] = useState([
    { 
      id: 1, 
      title: 'Welcome Chat', 
      messages: [{ 
        type: 'bot', 
        content: 'Hello! I\'m your AI assistant. How can I help you today?',
        timestamp: new Date().toISOString()
      }],
      createdAt: new Date().toISOString()
    }
  ]);
  const [activeChatId, setActiveChatId] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef(null);

  const [sessionId] = useState(() => {
    let stored = localStorage.getItem("chatSessionId");
    if (!stored) {
      stored = crypto.randomUUID();
      localStorage.setItem("chatSessionId", stored);
    }
    return stored;
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats, isLoading, activeChatId]);

  const activeChat = chats.find(chat => chat.id === activeChatId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { 
      type: 'user', 
      content: input,
      timestamp: new Date().toISOString()
    };
    
    const updatedChats = chats.map(chat =>
      chat.id === activeChatId
        ? { 
            ...chat, 
            messages: [...chat.messages, userMessage],
            title: chat.messages.length === 1 ? input.slice(0, 30) + (input.length > 30 ? '...' : '') : chat.title
          }
        : chat
    );
    setChats(updatedChats);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/chat?input=${encodeURIComponent(input)}&session_id=${sessionId}`);
      if (!response.body) return;

      const botMessage = { type: 'bot', content: '', timestamp: new Date().toISOString() };
      const finalChats = updatedChats.map(chat =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, botMessage] }
          : chat
      );
      setChats(finalChats);
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let content = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        content += chunk;

        const updatedContent = content;
        setChats(prev => prev.map(chat =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: chat.messages.map((msg, index) =>
                  index === chat.messages.length - 1
                    ? { ...msg, content: updatedContent }
                    : msg
                )
              }
            : chat
        ));
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { type: 'error', content: 'Sorry, something went wrong!', timestamp: new Date().toISOString() };
      setChats(prev => prev.map(chat =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, errorMessage] }
          : chat
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = () => {
    const newChatId = Date.now();
    const newChat = {
      id: newChatId,
      title: `New Chat`,
      messages: [{ 
        type: 'bot', 
        content: 'Hello! I\'m ready to help you with anything you need. What would you like to discuss?',
        timestamp: new Date().toISOString()
      }],
      createdAt: new Date().toISOString()
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChatId);
  };

  const deleteChat = (chatId, e) => {
    e.stopPropagation();
    if (chats.length <= 1) return;
    
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    setChats(updatedChats);
    
    if (chatId === activeChatId) {
      setActiveChatId(updatedChats[0].id);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {!sidebarCollapsed && (
            <>
              <div className="brand-section">
                <div className="brand-icon">
                  <ChatIcon />
                </div>
                <div className="brand-text">
                  <h1>AI Assistant</h1>
                  <p>Your intelligent companion</p>
                </div>
              </div>
              <button onClick={createNewChat} className="new-chat-btn">
                <PlusIcon />
                New Chat
              </button>
            </>
          )}
        </div>

        <div className="chat-list-container">
          <div className="chat-list">
            {chats.map(chat => (
              <div
                key={chat.id}
                className={`chat-list-item ${chat.id === activeChatId ? 'active' : ''}`}
                onClick={() => setActiveChatId(chat.id)}
              >
                {!sidebarCollapsed && (
                  <>
                    <div className="chat-item-header">
                      <ChatIcon />
                      <span className="chat-title">{chat.title}</span>
                      {chats.length > 1 && (
                        <button
                          onClick={(e) => deleteChat(chat.id, e)}
                          className="delete-btn"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                    <div className="chat-item-meta">
                      <span>{chat.messages.length} messages</span>
                      <span>{new Date(chat.createdAt).toLocaleDateString()}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="collapse-btn"
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="main-content">
        {/* Chat Header */}
        <header className="chat-header">
          <div className="header-content">
            <div className="header-info">
              <h2>{activeChat?.title}</h2>
              <p>{activeChat?.messages.length} messages</p>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="messages-container">
          {activeChat?.messages.map((message, index) => (
            <div
              key={index}
              className={`message-wrapper ${message.type}`}
            >
              <div className="message-avatar">
                {message.type === 'bot' ? <BotIcon /> : <UserIcon />}
              </div>
              <div className="message-content">
                <div className={`message-bubble ${message.type}`}>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                <span className="message-time">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message-wrapper bot">
              <div className="message-avatar">
                <BotIcon />
              </div>
              <div className="message-content">
                <div className="message-bubble bot">
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <span className="typing-text">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-container">
          <div className="input-wrapper">
            <div className="input-field">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here..."
                disabled={isLoading}
                rows={1}
                style={{ resize: 'none' }}
              />
              <button
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className="send-btn"
              >
                <SendIcon />
              </button>
            </div>
          </div>
          <p className="input-hint">
            AI assistant can make mistakes. Check important info.
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;