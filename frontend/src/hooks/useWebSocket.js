import { useEffect, useRef, useCallback } from 'react';
import useSimulationStore from '../store/simulationStore';

/**
 * Manages the WebSocket connection to the backend.
 * Reconnects automatically on disconnect.
 */
export default function useWebSocket() {
  const wsRef = useRef(null);
  const processEvent = useSimulationStore((s) => s.processEvent);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState <= 1) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/ws`);

    ws.onopen = () => {
      console.log('[WS] Connected');
    };

    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        processEvent(event);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected — reconnecting in 2s');
      reconnectTimer.current = setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [processEvent]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return wsRef;
}
