import React, { useState, FormEvent } from 'react';

interface ChatBoxProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatBox: React.FC<ChatBoxProps> = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        padding: '10px',
        borderTop: '1px solid #e6e6e6',
        backgroundColor: 'white',
      }}
    >
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        disabled={isLoading}
        style={{
          flex: 1,
          padding: '12px 15px',
          borderRadius: '24px',
          border: '1px solid #e6e6e6',
          outline: 'none',
          fontSize: '14px',
        }}
      />
      <button
        type="submit"
        disabled={isLoading || !message.trim()}
        style={{
          marginLeft: '10px',
          padding: '0 20px',
          backgroundColor: '#0084ff',
          color: 'white',
          border: 'none',
          borderRadius: '24px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: isLoading || !message.trim() ? 'not-allowed' : 'pointer',
          opacity: isLoading || !message.trim() ? 0.7 : 1,
        }}
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
};

export default ChatBox; 