import { CheckCircle, AlertTriangle, UserPlus, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface Notification {
  id: number;
  type: 'assignment' | 'status_change' | 'sla_warning' | 'mention' | 'info';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: number) => void;
}

const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const NotificationItem = ({ notification, onRead }: NotificationItemProps) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'assignment': return <UserPlus size={16} className="text-blue-500" />;
      case 'status_change': return <CheckCircle size={16} className="text-green-500" />;
      case 'sla_warning': return <AlertTriangle size={16} className="text-amber-500" />;
      default: return <Info size={16} className="text-slate-500" />;
    }
  };

  const Content = (
    <div className={`p-3 border-b border-border-main hover:bg-surface/50 transition-colors cursor-pointer ${notification.read ? 'opacity-60' : 'bg-blue-50/30 dark:bg-blue-900/10'}`}>
      <div className="flex gap-3">
        <div className="mt-1 flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-main mb-0.5">{notification.title}</p>
          <p className="text-xs text-muted line-clamp-2">{notification.message}</p>
          <p className="text-[10px] text-slate-400 mt-1.5">
            {timeAgo(notification.created_at)}
          </p>
        </div>
        {!notification.read && (
          <div className="mt-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-950"></div>
          </div>
        )}
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link to={notification.link} onClick={() => onRead(notification.id)}>
        {Content}
      </Link>
    );
  }

  return (
    <div onClick={() => onRead(notification.id)}>
      {Content}
    </div>
  );
};

export default NotificationItem;
