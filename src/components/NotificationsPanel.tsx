import { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import { Card } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '../lib/api';

interface Notification {
  notification_id: number;
  employee_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  related_entity_type?: string;
  related_entity_id?: string;
}

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const employeeId = user?.id || localStorage.getItem('employeeId');

  useEffect(() => {
    if (employeeId) {
      loadNotifications();
      // Refresh notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [employeeId]);

  const loadNotifications = async () => {
    if (!employeeId) return;
    try {
      const res = await fetch(`${API_BASE}/notifications?employee_id=${employeeId}`);
      const data = res.ok ? await res.json() : [];
      setNotifications(Array.isArray(data) ? data : []);
      
      // Count unread
      const unread = (Array.isArray(data) ? data : []).filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      await loadNotifications();
    } catch (err) {
      console.error('Error marking as read:', err);
      toast({ title: 'Failed to mark as read', variant: 'destructive' });
    }
  };

  const markAllAsRead = async () => {
    if (!employeeId) return;
    try {
      await fetch(`${API_BASE}/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId }),
      });
      await loadNotifications();
      toast({ title: 'All notifications marked as read' });
    } catch (err) {
      console.error('Error marking all as read:', err);
      toast({ title: 'Failed to mark all as read', variant: 'destructive' });
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await fetch(`${API_BASE}/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      await loadNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast({ title: 'Failed to delete notification', variant: 'destructive' });
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'leave_request': return 'bg-blue-50 border-blue-200';
      case 'payment_request': return 'bg-green-50 border-green-200';
      case 'project_review': return 'bg-purple-50 border-purple-200';
      case 'approval': return 'bg-yellow-50 border-yellow-200';
      case 'alert': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'leave_request': return '📋';
      case 'payment_request': return '💰';
      case 'project_review': return '📊';
      case 'approval': return '✅';
      case 'alert': return '⚠️';
      default: return '🔔';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1 -translate-y-1 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <div
                    key={notif.notification_id}
                    className={`p-4 border-l-4 transition-colors ${
                      notif.is_read
                        ? 'bg-gray-50 border-l-gray-300'
                        : 'bg-blue-50 border-l-blue-500 hover:bg-blue-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-1">
                        {getNotificationIcon(notif.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm break-words">
                          {notif.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 break-words">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatTime(notif.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {!notif.is_read && (
                          <button
                            onClick={() => markAsRead(notif.notification_id)}
                            className="p-1 hover:bg-blue-200 rounded text-blue-600 transition"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.notification_id)}
                          className="p-1 hover:bg-red-200 rounded text-red-600 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 flex gap-2">
              <button
                onClick={markAllAsRead}
                className="flex-1 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition"
              >
                Mark all as read
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
