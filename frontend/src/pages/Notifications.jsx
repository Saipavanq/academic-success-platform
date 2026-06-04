import { useState, useEffect } from 'react';
import { notificationsAPI } from '../services/api';
import { Bell, Check, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.list();
      setNotifications(response.data.results || response.data);
    } catch (error) { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) { toast.error('Failed to mark as read'); }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (error) { toast.error('Failed to mark all as read'); }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'exam_reminder': return '📚';
      case 'quiz_reminder': return '📝';
      case 'study_task': return '📖';
      case 'goal_deadline': return '🎯';
      default: return '🔔';
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <button onClick={handleMarkAllRead} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          Mark all as read
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                notification.is_read ? 'bg-white border-gray-100' : 'bg-primary-50 border-primary-100'
              }`}
              onClick={() => !notification.is_read && handleMarkRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{getNotificationIcon(notification.notification_type)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {notification.title}
                    </h3>
                    {!notification.is_read && <span className="w-2 h-2 bg-primary-500 rounded-full"></span>}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
