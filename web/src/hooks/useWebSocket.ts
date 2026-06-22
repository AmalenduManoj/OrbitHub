import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { getAccessToken, setTokens, clearTokens } from '../api/client';

const API_BASE = 'http://localhost:8081';
const WS_BASE = 'ws://localhost:8081';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

async function ensureValidToken(): Promise<string | null> {
  const token = getAccessToken();
  if (!token) return null;
  if (!isTokenExpired(token)) return token;

  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    clearTokens();
    window.location.href = '/login';
    return null;
  }

  try {
    const { data } = await axios.post<{ access_token: string; refresh_token: string }>(
      `${API_BASE}/auth/refresh`,
      { refresh_token: refreshToken },
    );
    setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    clearTokens();
    window.location.href = '/login';
    return null;
  }
}

export function useWebSocket(
  path: string | null,
  onMessage: (data: unknown) => void,
): { isConnected: boolean } {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!path) return;

    let cancelled = false;

    const connect = async () => {
      if (cancelled) return;

      const token = await ensureValidToken();
      if (!token || cancelled) return;

      const url = `${WS_BASE}${path}?token=${token}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) { ws.close(); return; }
        setIsConnected(true);
        retriesRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessageRef.current(data);
        } catch {}
      };

      ws.onclose = () => {
        if (cancelled) return;
        setIsConnected(false);
        wsRef.current = null;

        const delay = Math.min(1000 * Math.pow(2, retriesRef.current), 30000);
        retriesRef.current++;
        timerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {};
    };

    connect();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [path]);

  return { isConnected };
}
