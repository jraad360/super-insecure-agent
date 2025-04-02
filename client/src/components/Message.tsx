import React from 'react';
import { Message as MessageType } from '../types/chat';

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div 
      className={`message ${isUser ? 'user-message' : 'assistant-message'}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '70%',
        padding: '10px 15px',
        borderRadius: '18px',
        marginBottom: '10px',
        backgroundColor: isUser ? '#0084ff' : '#f0f0f0',
        color: isUser ? 'white' : 'black',
      }}
    >
      <div style={{ fontSize: '14px', marginBottom: '4px', fontWeight: 'bold' }}>
        {isUser ? 'You' : 'Agent'}
      </div>
      <div style={{ whiteSpace: 'pre-wrap' }}>
        {message.content}
      </div>
      <div style={{ fontSize: '11px', opacity: 0.7, alignSelf: 'flex-end', marginTop: '4px' }}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
};

export default Message; 