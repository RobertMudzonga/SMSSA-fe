import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Import to ensure fetch patching is applied
import '../lib/api';

interface Notification {
  notification_id: number;
  employee_id: number;
  type: string;
  title: string;
  message: string;
  related_entity_type?: string;
  related_entity_id?: number;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  employee_name?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: (employeeId: number) => Promise<void>;
  fetchUnreadCount: (employeeId: number) => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: (employeeId: number) => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  employeeId?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children, 
  employeeId 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async (empId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?employee_id=${empId}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async (empId: number) => {
    try {
      const response = await fetch(`/api/notifications/unread-count?employee_id=${empId}`);
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async (empId: number) => {
    try {
      const response = await fetch(`/api/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: empId }),
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
        const wasUnread = notifications.find(n => n.notification_id === notificationId)?.is_read === false;
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Auto-fetch notifications when employeeId changes
  useEffect(() => {
    if (employeeId) {
      fetchNotifications(employeeId);
      fetchUnreadCount(employeeId);

      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount(employeeId);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [employeeId]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
