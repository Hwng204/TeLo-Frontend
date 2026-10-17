import { createContext, useContext } from 'react';
import type { NotificationInboxItem } from '../../types/notificationV2';
import type { NotificationInboxSession } from '../../services/notificationApi';

export interface NotificationState {
  count: number;
  latest: NotificationInboxItem[];
  loading: boolean;
  error: string;
  disabled: boolean;
  revision: number;
  sessionKey: string | null;
  api: NotificationInboxSession | null;
  refresh: () => Promise<void>;
  loadLatest: (unreadOnly?: boolean) => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: (before: string) => Promise<void>;
}

export const NotificationContext = createContext<NotificationState | null>(null);
export function useNotifications() {
  const value = useContext(NotificationContext);
  if (!value) throw new Error('NotificationProvider is required');
  return value;
}

export function notificationError(error: unknown): { disabled: boolean; message: string } {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 503) return { disabled: true, message: 'Thông báo đang chờ cấu hình. Vui lòng quay lại sau.' };
  if (status === 404 || status === 403) return { disabled: false, message: 'Thông báo không còn khả dụng hoặc bạn không có quyền xem.' };
  return { disabled: false, message: 'Không tải được thông báo. Vui lòng thử lại.' };
}

export function safeNotificationPath(value: string | null): string | null {
  if (!value || !/^\/(?:matrix-tasks|matrices|exam-packages|notifications)(?:\/\d+)?(?:\/questions|\/matrix\/new)?(?:\?[^\\\r\n]*)?$/.test(value)) return null;
  return value;
}

export const notificationTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(date);
};
