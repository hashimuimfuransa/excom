import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@utils/auth';
import { useTranslation } from 'react-i18next';

interface Message {
  _id: string;
  sender: string;
  senderType: 'buyer' | 'seller';
  message: string;
  messageType: 'text' | 'price_offer' | 'counter_offer' | 'accept_offer' | 'reject_offer';
  priceOffer?: number;
  isRead: boolean;
  timestamp: string;
}

interface BargainChatData {
  _id: string;
  product: {
    _id: string;
    title: string;
    price: number;
    currency: string;
    images: string[];
  };
  buyer: {
    _id: string;
    name: string;
  };
  seller: {
    _id: string;
    name: string;
  };
  status: 'active' | 'closed' | 'accepted' | 'rejected';
  messages: Message[];
  initialPrice: number;
  currentOffer?: number;
  finalPrice?: number;
}

interface BargainChatProps {
  chatId?: string;
  productId?: string;
  onClose: () => void;
  isOpen: boolean;
}

const BargainChat: React.FC<BargainChatProps> = ({ chatId, productId, onClose, isOpen }) => {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [chat, setChat] = useState<BargainChatData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [offerAmount, setOfferAmount] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Inline styles for guaranteed visibility
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor: 'white',
    width: '90%',
    maxWidth: '600px',
    height: '80%',
    maxHeight: '700px',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  const headerStyle: React.CSSProperties = {
    padding: '1rem',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const bodyStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  const messagesStyle: React.CSSProperties = {
    flex: 1,
    padding: '1rem',
    overflowY: 'auto',
    backgroundColor: '#fafafa'
  };

  const messageStyle: React.CSSProperties = {
    marginBottom: '1rem',
    padding: '0.75rem 1rem',
    borderRadius: '18px',
    maxWidth: '70%',
    wordWrap: 'break-word'
  };

  const buyerMessageStyle: React.CSSProperties = {
    ...messageStyle,
    backgroundColor: '#3b82f6',
    color: 'white',
    marginLeft: 'auto',
    borderBottomRightRadius: '4px'
  };

  const sellerMessageStyle: React.CSSProperties = {
    ...messageStyle,
    backgroundColor: '#f1f5f9',
    color: '#1e293b',
    marginRight: 'auto',
    borderBottomLeftRadius: '4px'
  };

  const priceOfferStyle: React.CSSProperties = {
    ...messageStyle,
    border: '2px solid #f59e0b',
    backgroundColor: '#fffbeb',
    color: '#92400e',
    fontWeight: 'bold'
  };

  const inputStyle: React.CSSProperties = {
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '1rem',
    flex: 1,
    marginRight: '0.5rem'
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontWeight: '500',
    cursor: 'pointer'
  };

  const warningButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#f59e0b'
  };

  // Initialize socket connection
  useEffect(() => {
    if (!isOpen || !user) return;

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      if (chatId) {
        newSocket.emit('join-bargain-room', chatId);
      }
    });

    newSocket.on('new-bargain-message', (data) => {
      if (data.chatId === chatId) {
        setMessages(prev => [...prev, data.message]);
        setChat(prev => prev ? {
          ...prev,
          status: data.chat.status,
          currentOffer: data.chat.currentOffer
        } : null);
      }
    });

    newSocket.on('bargain-chat-closed', (data) => {
      if (data.chatId === chatId) {
        setChat(prev => prev ? { ...prev, status: 'closed' } : null);
      }
    });

    return () => {
      if (chatId) {
        newSocket.emit('leave-bargain-room', chatId);
      }
      newSocket.disconnect();
    };
  }, [isOpen, user, chatId]);

  // Fetch chat data
  useEffect(() => {
    if (!isOpen || !chatId) return;
    fetchChatData();
  }, [isOpen, chatId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatData = async () => {
    if (!chatId || !token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bargain/chat/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChat(data.chat);
        setMessages(data.chat.messages || []);
      }
    } catch (error) {
      console.error('Error fetching chat data:', error);
    }
  };

  const startBargainChat = async () => {
    if (!productId || !token || !offerAmount) return;
    
    setIsStarting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bargain/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          initialOffer: offerAmount,
          message: newMessage || `I would like to offer $${offerAmount} for this item.`
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChat(data.chat);
        setMessages(data.chat.messages || []);
        setNewMessage('');
        setOfferAmount('');
        
        // Join the new chat room
        if (socket) {
          socket.emit('join-bargain-room', data.chat._id);
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to start bargaining');
      }
    } catch (error) {
      console.error('Error starting bargain chat:', error);
      alert('Failed to start bargaining');
    }
    setIsStarting(false);
  };

  const sendMessage = async (messageType: string = 'text', priceOffer?: number) => {
    if (!chat || !token || (!newMessage.trim() && messageType === 'text')) return;

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bargain/chat/${chat._id}/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: newMessage || (priceOffer ? `Price offer: $${priceOffer}` : ''),
          messageType,
          priceOffer
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.chat.messages || []);
        setChat(prev => prev ? {
          ...prev,
          status: data.chat.status,
          currentOffer: data.chat.currentOffer
        } : null);
        setNewMessage('');
        setOfferAmount('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
    setLoading(false);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getUserType = () => {
    if (!chat || !user) return null;
    return chat.buyer._id === user._id ? 'buyer' : 'seller';
  };

  const canMakeOffer = () => {
    const userType = getUserType();
    return chat?.status === 'active' && userType;
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {chat ? (
              <>
                <img 
                  src={chat.product.images[0] || '/placeholder-image.jpg'} 
                  alt={chat.product.title}
                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{chat.product.title}</h3>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#64748b' }}>
                    Original: {formatCurrency(chat.product.price, chat.product.currency)}
                  </p>
                  {chat.currentOffer && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#059669', fontWeight: 600 }}>
                      Current Offer: {formatCurrency(chat.currentOffer, chat.product.currency)}
                    </p>
                  )}
                  <p style={{ margin: '0.25rem 0', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '12px', backgroundColor: '#dcfce7', color: '#166534', display: 'inline-block' }}>
                    Status: {chat.status}
                  </p>
                </div>
              </>
            ) : (
              <h3 style={{ margin: 0 }}>Start Bargaining</h3>
            )}
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '1.5rem', 
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '4px'
            }}
          >
            ×
          </button>
        </div>

        <div style={bodyStyle}>
          {!chat && productId ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h4 style={{ marginBottom: '1.5rem' }}>Start Bargaining</h4>
              <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Your Offer:</label>
                <input
                  type="number"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value ? parseFloat(e.target.value) : '')}
                  placeholder="Enter your offer amount"
                  min="0"
                  step="0.01"
                  style={{ ...inputStyle, marginRight: 0, width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Message (optional):</label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Add a message with your offer..."
                  rows={3}
                  style={{ ...inputStyle, marginRight: 0, width: '100%', height: 'auto', minHeight: '80px' }}
                />
              </div>
              <button 
                onClick={startBargainChat} 
                disabled={!offerAmount || isStarting}
                style={{
                  ...buttonStyle,
                  opacity: (!offerAmount || isStarting) ? 0.6 : 1,
                  cursor: (!offerAmount || isStarting) ? 'not-allowed' : 'pointer'
                }}
              >
                {isStarting ? 'Starting...' : 'Send Offer'}
              </button>
            </div>
          ) : (
            <>
              <div style={messagesStyle}>
                {messages.map((message, index) => {
                  const isFromUser = message.senderType === getUserType();
                  const messageStyleToUse = message.messageType.includes('offer') 
                    ? priceOfferStyle 
                    : isFromUser 
                      ? buyerMessageStyle 
                      : sellerMessageStyle;
                  
                  return (
                    <div 
                      key={message._id || index}
                      style={{
                        display: 'flex',
                        justifyContent: isFromUser ? 'flex-end' : 'flex-start',
                        marginBottom: '1rem'
                      }}
                    >
                      <div style={messageStyleToUse}>
                        <p style={{ margin: 0 }}>{message.message}</p>
                        {message.priceOffer && (
                          <div style={{ fontSize: '1.125rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
                            {formatCurrency(message.priceOffer, chat?.product.currency)}
                          </div>
                        )}
                        <small style={{ fontSize: '0.75rem', opacity: 0.7, display: 'block', marginTop: '0.25rem' }}>
                          {formatTimestamp(message.timestamp)}
                        </small>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {canMakeOffer() && (
                <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', backgroundColor: 'white' }}>
                  {getUserType() === 'seller' && chat?.currentOffer && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', justifyContent: 'center' }}>
                      <button 
                        onClick={() => sendMessage('accept_offer')} 
                        style={{ 
                          ...buttonStyle, 
                          backgroundColor: '#10b981',
                          padding: '0.5rem 1rem' 
                        }}
                      >
                        Accept Offer
                      </button>
                      <button 
                        onClick={() => sendMessage('reject_offer')} 
                        style={{ 
                          ...buttonStyle, 
                          backgroundColor: '#ef4444',
                          padding: '0.5rem 1rem' 
                        }}
                      >
                        Reject Offer
                      </button>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      style={inputStyle}
                    />
                    <button 
                      onClick={() => sendMessage()} 
                      disabled={loading || !newMessage.trim()}
                      style={{
                        ...buttonStyle,
                        opacity: (loading || !newMessage.trim()) ? 0.6 : 1,
                        cursor: (loading || !newMessage.trim()) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Send
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="number"
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value ? parseFloat(e.target.value) : '')}
                      placeholder="Counter offer amount"
                      min="0"
                      step="0.01"
                      style={inputStyle}
                    />
                    <button 
                      onClick={() => offerAmount && sendMessage('counter_offer', Number(offerAmount))} 
                      disabled={loading || !offerAmount}
                      style={{
                        ...warningButtonStyle,
                        opacity: (loading || !offerAmount) ? 0.6 : 1,
                        cursor: (loading || !offerAmount) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Counter Offer
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BargainChat;