import { useState } from 'react';
import { Bell, AlertTriangle, Droplets, X, Check, Activity } from 'lucide-react';
import { Notification } from '../types';

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onClear: () => void;
}

export function NotificationPanel({ notifications, onMarkRead, onClear }: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'dry':
        return <AlertTriangle className="w-5 h-5 text-[#e8a836]" />;
      case 'wet':
        return <Droplets className="w-5 h-5 text-[#1e4d5c]" />;
      case 'anomaly':
        return <Activity className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-[#2d5a4a]" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-[#e8f0ed] rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6 text-[#1a2e1a]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#e8a836] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-[#2d5a4a]/20 z-50">
          <div className="p-4 border-b border-[#2d5a4a]/10">
            <div className="flex items-center justify-between">
              <h3 className="text-[#1a2e1a] font-bold">Notificações</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[#e8f0ed] rounded transition-colors"
              >
                <X className="w-5 h-5 text-[#5a7368]" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-[#5a7368]">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma notificação no momento</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-[#2d5a4a]/10 hover:bg-[#f8faf9] transition-colors ${
                    !notification.read ? 'bg-[#e8f0ed]/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      notification.type === 'dry' ? 'bg-[#fff4e6]' :
                      notification.type === 'wet' ? 'bg-[#e6f3f7]' :
                      notification.type === 'anomaly' ? 'bg-red-50' :
                      'bg-[#e8f0ed]'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-[#1a2e1a] mb-1 font-medium">{notification.message}</p>
                      <p className="text-sm text-[#5a7368] mb-2">{notification.location}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#5a7368]">{notification.time}</span>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <button
                              onClick={() => onMarkRead(notification.id)}
                              className="text-xs text-[#2d5a4a] hover:text-[#1a3d2f] flex items-center gap-1 font-medium"
                            >
                              <Check className="w-3 h-3" />
                              Marcar como lida
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-[#2d5a4a]/10">
              <button
                onClick={onClear}
                className="w-full text-center text-sm text-[#2d5a4a] hover:text-[#1a3d2f] py-2 font-medium"
              >
                Limpar todas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
