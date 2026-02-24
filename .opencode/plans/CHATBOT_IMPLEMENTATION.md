# AI Chatbot Implementation Plan

## Overview

This document outlines the implementation of an **AI-powered chatbot** using Anthropic Claude for the SwahiliPot Hub booking system. The chatbot will provide 24/7 support, assist with bookings, and answer FAQs in both English and Swahili.

---

## Current State

### Existing Features
- User registration and login
- Room booking management
- Admin and Super Admin dashboards
- 2FA authentication
- Email notifications
- Socket.io for real-time updates

### Gaps Identified
- No customer support feature
- Users need help with bookings outside business hours
- No instant FAQ answering system

---

## Implementation Plan

### Phase 1: Backend Setup (Priority: HIGH)

#### 1.1 Install Claude SDK
**File:** `backend/package.json`

Add dependency:
```json
"@anthropic-ai/sdk": "^0.24.0"
```

#### 1.2 Create Chatbot Service
**File:** `backend/services/chatbotService.js`

```javascript
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

// System prompt for the hotel booking assistant
const SYSTEM_PROMPT = `You are a helpful booking assistant for SwahiliPot Hub, a hotel booking system. 
Your role is to help users with:
- Room availability 
- Making, modifying, or cancelling bookings
- Checking booking status
- Answering FAQs about amenities, check-in times, cancellation policy
- General system information

Keep responses friendly, concise, and helpful. If you cannot answer a question, 
advise the user to contact support at support@swahilipothub.com.`;

// Function to process user message
async function processMessage(userMessage, conversationHistory) {
    const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [...conversationHistory, { role: 'user', content: userMessage }]
    });
    
    return response.content[0].text;
}

module.exports = { processMessage };
```

#### 1.3 Create Chatbot API Routes
**File:** `backend/routes/chatbotRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const { processMessage } = require('../services/chatbotService');
const { authLimiter } = require('../middleware/rateLimiter');

// POST /api/chatbot/message - Send a message to the chatbot
router.post('/message', authLimiter, async (req, res) => {
    const { message, history } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    
    try {
        const response = await processMessage(message, history || []);
        res.json({ response });
    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

// POST /api/chatbot/quick-replies - Get quick reply suggestions
router.get('/quick-replies', (req, res) => {
    res.json({
        suggestions: [
            'What rooms are available?',
            'How do I cancel my booking?',
            'What are the check-in times?',
            'What amenities do you have?',
            
        ]
    });
});

module.exports = router;
```

#### 1.4 Register Routes in Server
**File:** `backend/server.js`

```javascript
const chatbotRoutes = require('./routes/chatbotRoutes');
app.use('/api/chatbot', chatbotRoutes);
```

---

### Phase 2: Frontend Chatbot Component (Priority: HIGH)

#### 2.1 Create Chatbot Service
**File:** `frontend/src/services/chatbotService.js`

```javascript
import { apiFetch } from './api';

const chatbotService = {
    async sendMessage(message, history = []) {
        const response = await apiFetch('/chatbot/message', {
            method: 'POST',
            body: { message, history }
        });
        
        if (response.ok) {
            const data = await response.json();
            return { success: true, response: data.response };
        }
        
        const error = await response.json();
        return { success: false, error: error.error };
    },
    
    async getQuickReplies() {
        const response = await apiFetch('/chatbot/quick-replies', {
            method: 'GET'
        });
        
        if (response.ok) {
            const data = await response.json();
            return { success: true, suggestions: data.suggestions };
        }
        
        return { success: false, suggestions: [] };
    }
};

export default chatbotService;
```

#### 2.2 Create Chatbot Widget Component
**File:** `frontend/src/components/ChatbotWidget.jsx`

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import chatbotService from '../services/chatbotService';
import authService from '../services/authService';

const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { 
            role: 'assistant', 
            content: 'Hello! I\'m SwahiliPot Hub Assistant. How can I help you today?' 
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    const handleSend = async () => {
        if (!input.trim() || loading) return;
        
        const userMessage = input.trim();
        setInput('');
        
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);
        
        try {
            const history = messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }));
            
            const result = await chatbotService.sendMessage(userMessage, history);
            
            if (result.success) {
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: result.response 
                }]);
            } else {
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: 'Sorry, I\'m having trouble responding right now. Please try again later.' 
                }]);
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'Sorry, something went wrong. Please try again.' 
            }]);
        } finally {
            setLoading(false);
        }
    };
    
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-[#0B4F6C] text-white p-4 rounded-full shadow-lg hover:bg-[#094558] transition-all transform hover:scale-105"
                >
                    <MessageCircle size={28} />
                </button>
            )}
            
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white rounded-xl shadow-2xl w-[380px] h-[500px] flex flex-col overflow-hidden border border-gray-200">
                    {/* Header */}
                    <div className="bg-[#0B4F6C] text-white p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-full">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold">SwahiliPot Assistant</h3>
                                <p className="text-xs text-white/70">Online 24/7</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-white/10 p-1 rounded"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((msg, index) => (
                            <div 
                                key={index}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex gap-2 max-w-[80%] ${
                                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                                }`}>
                                    <div className={`p-2 rounded-full h-fit ${
                                        msg.role === 'user' ? 'bg-[#0B4F6C]' : 'bg-gray-200'
                                    }`}>
                                        {msg.role === 'user' ? (
                                            <User size={16} className="text-white" />
                                        ) : (
                                            <Bot size={16} className="text-gray-600" />
                                        )}
                                    </div>
                                    <div className={`p-3 rounded-lg ${
                                        msg.role === 'user' 
                                            ? 'bg-[#0B4F6C] text-white' 
                                            : 'bg-white border border-gray-200 text-gray-800'
                                    }`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="flex gap-2 items-center bg-white border border-gray-200 p-3 rounded-lg">
                                    <Loader2 size={16} className="animate-spin text-gray-500" />
                                    <span className="text-sm text-gray-500">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Input */}
                    <div className="p-3 border-t bg-white">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4F6C] focus:border-transparent outline-none text-sm"
                                disabled={loading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                className="bg-[#0B4F6C] text-white p-2 rounded-lg hover:bg-[#094558] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatbotWidget;
```

---

### Phase 3: Integration (Priority: HIGH)

#### 3.1 Add Chatbot to App
**File:** `frontend/src/App.jsx`

```javascript
import ChatbotWidget from './components/ChatbotWidget';

function App() {
  return (
    <Router>
      <Routes>
        {/* ... existing routes ... */}
      </Routes>
      <ChatbotWidget />
    </Router>
  );
}
```

#### 3.2 Add Environment Variables
**File:** `backend/.env`

```env
# Anthropic Claude API Key
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

---

### Phase 4: Advanced Features (Priority: MEDIUM)

#### 4.1 Context-Aware Responses
Enhance the chatbot to:
- Access user's booking data (with consent)
- Provide personalized recommendations
- Handle booking modifications

#### 4.2 Multilingual Support
Add Swahili language support:
```javascript
const SYSTEM_PROMPT = `You are bilingual (English/Swahili) assistant...`
```

#### 4.3 Chat History Persistence
Store chat sessions in database for:
- Better customer support
- Analytics on common questions
- Improved AI training

---

## File Structure Summary

```
backend/
├── services/
│   └── chatbotService.js       # Claude API integration
├── routes/
│   └── chatbotRoutes.js        # API endpoints
└── server.js                   # Register routes

frontend/
├── src/
│   ├── components/
│   │   └── ChatbotWidget.jsx   # Chat UI component
│   ├── services/
│   │   └── chatbotService.js   # Frontend API calls
│   └── App.jsx                 # Add ChatbotWidget
```

---

## Environment Variables Required

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Claude API key from Anthropic |

---

## Cost Estimation

- **Claude 3.5 Sonnet**: ~$3.00 per 1M input tokens, ~$15.00 per 1M output tokens
- **Estimated usage**: ~500-1000 messages/month = ~$0.50-2/month

---

## Testing Checklist

- [ ] Chatbot widget appears on all pages
- [ ] Messages send and receive correctly
- [ ] Loading states work properly
- [ ] Chat window opens/closes smoothly
- [ ] Quick reply suggestions work
- [ ] Works on mobile devices
- [ ] Rate limiting prevents abuse
- [ ] Error handling for API failures
