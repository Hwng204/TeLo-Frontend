import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { createNotificationInboxSession } from '../../services/notificationApi';
import { storage } from '../../utils/storage';
import type { NotificationInboxItem } from '../../types/notificationV2';
import { NotificationContext, notificationError } from './notificationContext';
import './notifications.css';

const subscribeSession = (callback: () => void) => {
  window.addEventListener('storage', callback);
  window.addEventListener('branch_changed', callback);
  window.addEventListener('focus', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('branch_changed', callback);
    window.removeEventListener('focus', callback);
  };
};

function NotificationSession({ token, children }: { token: string | null; children: ReactNode }) {
  const api = useMemo(() => token ? createNotificationInboxSession(token) : null, [token]);
  const [count, setCount] = useState(0);
  const [latest, setLatest] = useState<NotificationInboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [revision, setRevision] = useState(0);
  const active = useRef(true);
  const listRequest = useRef(0);
  const countRequest = useRef(0);
  const latestUnreadOnly = useRef(false);
  useEffect(() => {
    api?.resume();
    active.current = true;
    return () => { active.current = false; api?.cancel(); };
  }, [api]);
  const current = useCallback(() => Boolean(active.current && token && storage.getToken() === token), [token]);
  const report = useCallback((failure: unknown) => {
    if (!current()) return;
    const result = notificationError(failure);
    setError(result.message); setDisabled(result.disabled);
    if (result.disabled) { setCount(0); setLatest([]); }
  }, [current]);
  const refresh = useCallback(async () => {
    if (!current() || !api) return;
    const request = ++countRequest.current;
    try {
      const result = await api.unreadCount();
      if (current() && request === countRequest.current) { setCount(result.count); setDisabled(false); setError(''); }
    } catch (failure) { if (request === countRequest.current) report(failure); }
  }, [current, report, api]);
  const loadLatest = useCallback(async (unreadOnly = latestUnreadOnly.current) => {
    if (!current() || !api) return;
    latestUnreadOnly.current = unreadOnly;
    const request = ++listRequest.current;
    setLoading(true);
    try {
      const result = await api.inbox({ page: 1, pageSize: 8, unreadOnly });
      if (current() && request === listRequest.current) { setLatest(result.items); setError(''); setDisabled(false); }
    } catch (failure) { if (request === listRequest.current) report(failure); }
    finally { if (current() && request === listRequest.current) setLoading(false); }
  }, [current, report, api]);
  useEffect(() => {
    if (!token) return;
    const check = () => { if (document.visibilityState !== 'hidden') void refresh(); };
    check();
    const timer = window.setInterval(check, 45_000);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', check); window.removeEventListener('focus', check); };
  }, [refresh, token]);
  const markRead = useCallback(async (id: number) => {
    if (!current() || !api) return;
    await api.markRead(id);
    if (!current()) return;
    // Use the server count; concurrent tabs can already have read this item.
    setRevision(value => value + 1);
    await Promise.all([refresh(), loadLatest()]);
  }, [current, refresh, loadLatest, api]);
  const markAllRead = useCallback(async (before: string) => {
    if (!current() || !api) return;
    await api.markAllRead(before);
    if (!current()) return;
    setRevision(value => value + 1);
    await Promise.all([refresh(), loadLatest()]);
  }, [current, refresh, loadLatest, api]);
  return <NotificationContext.Provider value={{ count, latest, loading, error, disabled, revision, sessionKey: token, api, refresh, loadLatest, markRead, markAllRead }}>{children}</NotificationContext.Provider>;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  useLocation(); // Login/logout navigation also re-reads same-tab localStorage changes.
  const token = useSyncExternalStore(subscribeSession, storage.getToken, () => null);
  return <NotificationSession key={token ?? 'signed-out'} token={token}>{children}</NotificationSession>;
}
