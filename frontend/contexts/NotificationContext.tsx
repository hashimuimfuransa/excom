"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@utils/auth';
import { Alert, Snackbar, Badge, IconButton } from '@mui/material';
import { Notifications as NotificationsIcon, Close as CloseIcon } from '@mui/icons-material';

interface Notification {
  id: string;
  type: 'bargain_request' | 'bargain_message' | 'bargain_accepted' | 'bargain_rejected';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  clearAll: () => {},
  addNotification: () => {}
});

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [currentSnackbar, setCurrentSnackbar] = useState<Notification | null>(null);

  // Initialize socket connection for real-time notifications
  useEffect(() => {
    if (!user || !token) return;

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Notification socket connected');
      // Join user-specific room for notifications
      newSocket.emit('join-user-room', user._id);
    });

    // Listen for bargain-related notifications
    newSocket.on('new-bargain-request', (data) => {
      addNotification({
        type: 'bargain_request',
        title: 'New Bargain Request',
        message: `${data.buyer.name} wants to bargain on ${data.product.title}`,
        data: data
      });
    });

    newSocket.on('new-bargain-message', (data) => {
      addNotification({
        type: 'bargain_message',
        title: 'New Bargain Message',
        message: `New message in your bargaining chat`,
        data: data
      });
    });

    newSocket.on('bargain-accepted', (data) => {
      addNotification({
        type: 'bargain_accepted',
        title: 'Offer Accepted!',
        message: `Your offer has been accepted!`,
        data: data
      });
    });

    newSocket.on('bargain-rejected', (data) => {
      addNotification({
        type: 'bargain_rejected',
        title: 'Offer Rejected',
        message: `Your offer was rejected`,
        data: data
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    
    // Show snackbar for new notification
    setCurrentSnackbar(newNotification);
    setShowSnackbar(true);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'bargain_request':
        return 'info';
      case 'bargain_message':
        return 'primary';
      case 'bargain_accepted':
        return 'success';
      case 'bargain_rejected':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      clearAll,
      addNotification
    }}>
      {children}
      
      {/* Floating Notification Badge */}
      {unreadCount > 0 && (
        <Badge 
          badgeContent={unreadCount} 
          color="error"
          sx={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 1200
          }}
        >
          <IconButton
            color="primary"
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <NotificationsIcon />
          </IconButton>
        </Badge>
      )}

      {/* Notification Snackbar */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={5000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={currentSnackbar ? getNotificationColor(currentSnackbar.type) as any : 'info'}
          onClose={() => setShowSnackbar(false)}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={() => setShowSnackbar(false)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
          sx={{ 
            borderRadius: 2,
            minWidth: '300px'
          }}
        >
          <div>
            <strong>{currentSnackbar?.title}</strong>
            <div style={{ fontSize: '0.875rem', marginTop: '4px' }}>
              {currentSnackbar?.message}
            </div>
          </div>
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;