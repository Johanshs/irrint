import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CommandInput, Rule, Snapshot, Zone } from '../../../shared/contracts';

const base = import.meta.env.VITE_API_BASE_URL ?? '';
export async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  });
  const data = await response.json().catch(() => ({ error: 'Serviço demonstrativo indisponível.' }));
  if (!response.ok) throw new Error(data.error ?? 'Não foi possível concluir a operação.');
  return data as T;
}

interface Session {
  state: Snapshot | null;
  selectedId: string;
  select: (id: string) => void;
  error: string | null;
  connected: boolean;
  busy: boolean;
  refresh: () => Promise<void>;
  command: (zoneId: string, input: CommandInput) => Promise<void>;
  configure: (zoneId: string, rule: Rule) => Promise<void>;
  exportReport: () => Promise<void>;
}
const Context = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Snapshot | null>(null);
  const [selectedId, select] = useState('north');
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const next = await request<Snapshot>('/api/v1/state');
      if (next.schemaVersion !== '1.0' || !Array.isArray(next.zones))
        throw new Error('Contrato de comunicação incompatível.');
      setState(next);
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, []);
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      if (document.visibilityState !== 'hidden') await refresh();
      if (!stopped) timer = setTimeout(poll, 1000);
    };
    const visible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    void poll();
    document.addEventListener('visibilitychange', visible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [refresh]);
  async function mutate(path: string, method: string, body: unknown) {
    setBusy(true);
    setError(null);
    try {
      await request(path, method, body);
      await refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Operação não concluída.';
      setError(message);
      throw new Error(message);
    } finally {
      setBusy(false);
    }
  }
  async function exportReport() {
    setError(null);
    try {
      const data = await request('/api/v1/report');
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `irrint-execucao-${new Date().toISOString().replaceAll(':', '-')}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError('Não foi possível exportar. Verifique a conexão com o serviço.');
    }
  }
  return (
    <Context.Provider
      value={{
        state,
        selectedId,
        select,
        error,
        connected,
        busy,
        refresh,
        exportReport,
        command: (zoneId, input) => mutate(`/api/v1/zones/${zoneId}/commands`, 'POST', input),
        configure: (zoneId, rule) => mutate(`/api/v1/zones/${zoneId}/rule`, 'PUT', rule),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useSession() {
  const context = useContext(Context);
  if (!context) throw new Error('SessionProvider ausente.');
  return context;
}

export function zoneStatus(zone: Zone, state: Snapshot, connected: boolean) {
  const online =
    connected && zone.latest !== null && state.serverTime - zone.latest.receivedAt < state.offlineAfterMs;
  const active = state.commands.find((command) => command.id === zone.activeCommandId);
  const uncertain = !online || active?.status === 'expired' || active?.status === 'rejected';
  const pending = active?.status === 'pending';
  const irrigating =
    !uncertain &&
    !pending &&
    (active?.status === 'applied' ? active.action === 'open' : zone.latest?.valve === 'open');
  return {
    online,
    uncertain,
    pending,
    irrigating,
    label: uncertain
      ? 'Sem confirmação atual'
      : pending
        ? 'Aguardando confirmação'
        : irrigating
          ? 'Irrigando'
          : 'Irrigação desligada',
  };
}
