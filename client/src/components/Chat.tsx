import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Message from './Message';
import ChatBox from './ChatBox';
import { Message as MessageType } from '../types/chat';
import { agentService } from '../services/api';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>(uuidv4());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Generate a new session ID on component mount (page load/refresh)
    sessionIdRef.current = uuidv4();
    
    // Clear messages when a new session starts
    setMessages([]);
    
    // Add a welcome message
    const welcomeMessage: MessageType = {
      id: uuidv4(),
      content: `Welcome to a new chat session (ID: ${sessionIdRef.current.slice(0, 8)}). Your conversation history is fresh, but I'll still remember important information from past sessions.`,
      role: 'assistant',
      timestamp: new Date(),
    };
    
    setMessages([welcomeMessage]);
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: MessageType = {
      id: uuidv4(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await agentService.generateResponse(content, sessionIdRef.current);
      
      const assistantMessage: MessageType = {
        id: uuidv4(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError('Failed to get response from agent. Please try again.');
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#f5f5f5',
    }}>
      <header style={{
        padding: '15px 20px',
        borderBottom: '1px solid #e6e6e6',
        backgroundColor: '#0084ff',
        color: 'white',
        textAlign: 'center',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>Agent Chat</h1>
        <small style={{ fontSize: '12px' }}>
          Session ID: {sessionIdRef.current.slice(0, 8)}
        </small>
      </header>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            opacity: 0.7,
          }}>
            <p>Start a conversation with the agent!</p>
          </div>
        ) : (
          messages.map(message => (
            <Message key={message.id} message={message} />
          ))
        )}
        {error && (
          <div style={{
            color: 'red',
            textAlign: 'center',
            margin: '10px 0',
            padding: '10px',
            backgroundColor: '#ffebee',
            borderRadius: '8px',
          }}>
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatBox onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default Chat; 