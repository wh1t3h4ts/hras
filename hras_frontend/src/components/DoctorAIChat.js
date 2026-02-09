import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, AlertTriangle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const DoctorAIChat = () => {
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm your AI Medical Assistant. I can help with general medical information, symptom analysis, and healthcare guidance. Please remember that I'm not a substitute for professional medical advice. How can I assist you today?",
      sender: 'ai',
      timestamp: new Date(),
      id: 'welcome'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      text: input.trim(),
      sender: 'user',
      timestamp: new Date(),
      id: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    const currentInput = input;
    setInput('');

    try {
      const response = await axios.post('http://localhost:8000/api/ai-chat/', {
        message: currentInput,
        conversation_id: conversationId
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      const aiMessage = {
        text: response.data.response || 'I apologize, but I couldn\'t generate a response. Please try rephrasing your question.',
        sender: 'ai',
        timestamp: new Date(),
        id: Date.now() + 1
      };

      setMessages(prev => [...prev, aiMessage]);
      setConversationId(response.data.conversation_id);
    } catch (error) {
      console.error('AI Chat Error:', error);
      const errorMessage = {
        text: 'I\'m sorry, I\'m experiencing technical difficulties. Please try again later or contact support.',
        sender: 'ai',
        timestamp: new Date(),
        id: Date.now() + 1,
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to send message. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">AI Medical Assistant</h1>
            <p className="text-sm text-gray-600">Powered by advanced healthcare AI</p>
          </div>
        </div>
      </div>

      {/* Disclaimer Banner */}
      <div className="bg-red-50 border-b border-red-200 px-6 py-3">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-700">
            <strong>Medical Disclaimer:</strong> This AI assistant provides general information only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult qualified healthcare professionals for medical concerns.
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex space-x-3 max-w-3xl ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.sender === 'user'
                  ? 'bg-blue-600'
                  : msg.error
                    ? 'bg-red-600'
                    : 'bg-green-600'
              }`}>
                {msg.sender === 'user' ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl max-w-2xl shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.error
                      ? 'bg-red-50 border border-red-200 text-red-800'
                      : 'bg-white border border-gray-200 text-gray-900'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-xs text-gray-500 mt-1 px-2">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="flex space-x-3 max-w-3xl">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a medical question or describe symptoms..."
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm"
                rows="1"
                style={{ minHeight: '48px', maxHeight: '120px' }}
                disabled={loading}
              />
              <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2 font-medium shadow-sm hover:shadow-md"
            >
              <Send className="h-4 w-4" />
              <span>Send</span>
            </button>
          </div>

          <div className="mt-3 text-xs text-gray-500 text-center">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAIChat;