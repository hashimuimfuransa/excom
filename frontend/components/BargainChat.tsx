import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@utils/auth';
import { useTranslation } from 'react-i18next';
import { addToCart } from '@utils/cart';
import styles from './BargainChat.module.css';

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
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const messagesEndRef = useRef<HTMLDivElement>(null);


  // Initialize socket connection
  useEffect(() => {
    if (!isOpen || !user || !token) return;

    setConnectionStatus('connecting');
    const newSocket = io(process.env.NEXT_PUBLIC_API_BASE?.replace('/api', '') || 'http://localhost:4000', {
      auth: {
        token: token
      }
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      setConnectionStatus('connected');
      setError(null);
      if (chatId) {
        newSocket.emit('join-bargain-room', chatId);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to chat server');
      setConnectionStatus('disconnected');
    });

    newSocket.on('new-bargain-message', (data) => {
      if (data.chatId === chatId) {
        setMessages(prev => [...prev, data.message]);
        setChat(prev => {
          if (!prev) return null;
          
          const updatedChat = {
            ...prev,
            status: data.chat.status,
            currentOffer: data.chat.currentOffer
          };
          
          // If offer was accepted, add to cart
          if (data.message.messageType === 'accept_offer' && data.chat.status === 'accepted') {
            const cartItem = {
              id: prev.product._id,
              title: prev.product.title,
              price: data.chat.currentOffer || prev.currentOffer || prev.product.price,
              image: prev.product.images[0] || '/placeholder-product.svg',
              quantity: 1
            };
            
            try {
              addToCart(cartItem);
              console.log('Added accepted offer to cart:', cartItem);
              setSuccessMessage(`Offer accepted! Added ${prev.product.title} to cart for ${formatCurrency(cartItem.price, prev.product.currency)}`);
              setTimeout(() => setSuccessMessage(null), 5000);
            } catch (error) {
              console.error('Failed to add to cart:', error);
            }
          }
          
          return updatedChat;
        });
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
  }, [isOpen, user, token, chatId]);

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

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api'}/bargain/chat/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChat(data.chat);
        setMessages(data.chat.messages || []);
      } else if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (response.status === 404) {
        setError('Chat not found or access denied.');
      } else {
        setError('Failed to load chat data.');
      }
    } catch (error) {
      console.error('Error fetching chat data:', error);
      setError('Network error. Please check your connection.');
    }
    setLoading(false);
  };

  const startBargainChat = async () => {
    if (!productId || !token || !offerAmount) return;
    
    setIsStarting(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api'}/bargain/start`, {
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
      } else if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to start bargaining');
      }
    } catch (error) {
      console.error('Error starting bargain chat:', error);
      setError('Network error. Please check your connection.');
    }
    setIsStarting(false);
  };

  const sendMessage = async (messageType: string = 'text', priceOffer?: number) => {
    if (!chat || !token || (!newMessage.trim() && messageType === 'text')) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api'}/bargain/chat/${chat._id}/message`, {
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
        setChat(prev => {
          if (!prev) return null;
          
          const updatedChat = {
            ...prev,
            status: data.chat.status,
            currentOffer: data.chat.currentOffer
          };
          
          // If current user accepted the offer, add to cart
          if (messageType === 'accept_offer' && data.chat.status === 'accepted') {
            const cartItem = {
              id: prev.product._id,
              title: prev.product.title,
              price: data.chat.currentOffer || prev.currentOffer || prev.product.price,
              image: prev.product.images[0] || '/placeholder-product.svg',
              quantity: 1
            };
            
            try {
              addToCart(cartItem);
              console.log('Added accepted offer to cart:', cartItem);
              setSuccessMessage(`Offer accepted! Added ${prev.product.title} to cart for ${formatCurrency(cartItem.price, prev.product.currency)}`);
              setTimeout(() => setSuccessMessage(null), 5000);
            } catch (error) {
              console.error('Failed to add to cart:', error);
            }
          }
          
          return updatedChat;
        });
        setNewMessage('');
        setOfferAmount('');
      } else if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Network error. Please check your connection.');
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
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.chatInfo}>
            {chat ? (
              <>
                <img 
                  src={chat.product.images[0] || '/placeholder-product.svg'} 
                  alt={chat.product.title}
                  className={styles.productThumbnail}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-product.svg';
                  }}
                />
                <div className={styles.productDetails}>
                  <h3 className={styles.productTitle}>{chat.product.title}</h3>
                  <p className={styles.originalPrice}>
                    Original: {formatCurrency(chat.product.price, chat.product.currency)}
                  </p>
                  {chat.currentOffer && (
                    <p className={styles.currentOffer}>
                      Current Offer: {formatCurrency(chat.currentOffer, chat.product.currency)}
                    </p>
                  )}
                  <span className={`${styles.status} ${styles[chat.status]}`}>
                    {chat.status}
                  </span>
                </div>
              </>
            ) : (
              <h3 className={styles.startTitle}>Start Bargaining</h3>
            )}
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Connection Status */}
        {connectionStatus === 'connecting' && (
          <div className={styles.connectionStatus}>
            <div className={styles.spinner}></div>
            Connecting to chat...
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className={styles.errorMessage}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            {error}
          </div>
        )}

        {/* Success Display */}
        {successMessage && (
          <div className={styles.successMessage}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22,4 12,14.01 9,11.01"></polyline>
            </svg>
            {successMessage}
          </div>
        )}

        {/* Body */}
        <div className={styles.body}>
          {!chat && productId ? (
            <div className={styles.startBargaining}>
              <div className={styles.startHeader}>
                <h4>Make Your Offer</h4>
                <p>Start negotiating with the seller</p>
              </div>
              
              <div className={styles.offerInput}>
                <label>Your Offer Amount</label>
                <div className={styles.inputGroup}>
                  <span className={styles.currencySymbol}>$</span>
                  <input
                    type="number"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={styles.offerInputField}
                  />
                </div>
              </div>
              
              <div className={styles.messageInput}>
                <label>Message (Optional)</label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Add a message with your offer..."
                  rows={3}
                  className={styles.messageTextarea}
                />
              </div>
              
              <button 
                onClick={startBargainChat} 
                disabled={!offerAmount || isStarting}
                className={`${styles.startBtn} ${(!offerAmount || isStarting) ? styles.disabled : ''}`}
              >
                {isStarting ? (
                  <>
                    <div className={styles.spinner}></div>
                    Starting...
                  </>
                ) : (
                  'Send Offer'
                )}
              </button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className={styles.messagesContainer}>
                {loading && !messages.length ? (
                  <div className={styles.loadingMessages}>
                    <div className={styles.spinner}></div>
                    Loading messages...
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isFromUser = message.senderType === getUserType();
                    const messageClass = `${styles.message} ${isFromUser ? styles.buyer : styles.seller} ${styles[message.messageType]}`;
                    
                    return (
                      <div key={message._id || index} className={messageClass}>
                        <div className={styles.messageContent}>
                          <p>{message.message}</p>
                          {message.priceOffer && (
                            <div className={styles.priceOffer}>
                              {formatCurrency(message.priceOffer, chat?.product.currency)}
                            </div>
                          )}
                          <small className={styles.timestamp}>
                            {formatTimestamp(message.timestamp)}
                          </small>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Actions */}
              {canMakeOffer() && (
                <div className={styles.chatActions}>
                  {/* Show accept/reject buttons for both buyer and seller when there's a current offer */}
                  {chat?.currentOffer && chat.status === 'active' && (
                    <div className={styles.offerActions}>
                      <button 
                        onClick={() => sendMessage('accept_offer')} 
                        className={`${styles.acceptBtn} ${loading ? styles.disabled : ''}`}
                        disabled={loading}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                        Accept Offer ({formatCurrency(chat.currentOffer, chat.product.currency)})
                      </button>
                      <button 
                        onClick={() => sendMessage('reject_offer')} 
                        className={`${styles.rejectBtn} ${loading ? styles.disabled : ''}`}
                        disabled={loading}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Reject Offer
                      </button>
                    </div>
                  )}
                  
                  <div className={styles.messageForm}>
                    <div className={styles.inputRow}>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className={styles.messageInput}
                        disabled={loading}
                      />
                      <button 
                        onClick={() => sendMessage()} 
                        disabled={loading || !newMessage.trim()}
                        className={`${styles.sendBtn} ${(loading || !newMessage.trim()) ? styles.disabled : ''}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                        </svg>
                      </button>
                    </div>
                    
                    <div className={styles.offerRow}>
                      <div className={styles.inputGroup}>
                        <span className={styles.currencySymbol}>$</span>
                        <input
                          type="number"
                          value={offerAmount}
                          onChange={(e) => setOfferAmount(e.target.value ? parseFloat(e.target.value) : '')}
                          placeholder="Counter offer amount"
                          min="0"
                          step="0.01"
                          className={styles.offerInputField}
                          disabled={loading}
                        />
                      </div>
                      <button 
                        onClick={() => offerAmount && sendMessage('counter_offer', Number(offerAmount))} 
                        disabled={loading || !offerAmount}
                        className={`${styles.offerBtn} ${(loading || !offerAmount) ? styles.disabled : ''}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                          <path d="M2 17l10 5 10-5"></path>
                          <path d="M2 12l10 5 10-5"></path>
                        </svg>
                        Counter Offer
                      </button>
                    </div>
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