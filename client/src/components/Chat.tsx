import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Message from './Message';
import ChatBox from './ChatBox';
import { Message as MessageType } from '../types/chat';
import { agentService } from '../services/api';

// Function to validate and sanitize user input
const validateAndSanitizeInput = (input: string): { valid: boolean; sanitized: string; error?: string } => {
  // Trim whitespace
  const trimmed = input.trim();
  
  // Check if empty after trimming
  if (!trimmed) {
    return { valid: false, sanitized: '', error: 'Input cannot be empty.' };
  }
  
  // Check for excessive length which could be used for prompt injection
  if (trimmed.length > 2000) {
    return { valid: false, sanitized: '', error: 'Input is too long. Please limit your message to 2000 characters.' };
  }
  
  // Check for potential prompt injection patterns
  const suspiciousPatterns = [
    /ignore previous instructions/i,
    /system prompt/i,
    /disregard all previous commands/i,
    /ignore all previous instructions/i,
    /you are now/i,
    /new role:/i,
    /export data from/i,
    /execute code/i,
    /\<\/?script/i,
    /\<\/?iframe/i,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      return { 
        valid: false, 
        sanitized: '',
        error: 'Your message contains patterns that are not allowed for security reasons.' 
      };
    }
  }
  
  // Basic sanitization
  const sanitized = trimmed
    .replace(/[<>]/g, '') // Remove angle brackets which could be used for HTML/XML injection
    .replace(/(\r\n|\n|\r)/gm, " ") // Replace newlines with spaces
    .replace(/\s+/g, " "); // Replace multiple spaces with a single space
  
  return { valid: true, sanitized };
};

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    // Validate and sanitize the input
    const { valid, sanitized, error: validationError } = validateAndSanitizeInput(content);
    
    if (!valid) {
      setError(validationError || 'Invalid input. Please try again.');
      return;
    }

    const userMessage: MessageType = {
      id: uuidv4(),
      content: sanitized, // Use sanitized content for display
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Send the sanitized content to the agent service
      const response = await agentService.generateResponse(sanitized);
      
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
      }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>Agent Chat</h1>
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