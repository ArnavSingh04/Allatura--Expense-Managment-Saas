'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { authFetcher } from '@/lib/swr-fetcher';
import { importErrorMessage } from '@/lib/import-errors';
import { importService } from '@/services/importService';
import { IMPORT_TOUCHED_PREFIXES, keys } from '@/lib/swr-keys';
import type {
  DuplicatePolicy,
  ImportEntityType,
  ImportSession,
} from '@/types/imports';

/** Stop polling a background import after this long and offer a manual refresh. */
const POLL_GIVE_UP_MS = 10 * 60_000;
/** Debounce on mapping writes — selects fire fast, the server need not. */
const MAPPING_DEBOUNCE_MS = 400;

type PendingMapping = {
  member: ImportEntityType | null;
  mapping: Record<string, string>;
};

export type UseImportSession = {
  session: ImportSession | undefined;
  isLoading: boolean;
  isPolling: boolean;
  /** A write is in flight — disable the control that would start another. */
  busy: boolean;
  error: string | null;
  clearError: () => void;
  /** Local mapping overrides not yet flushed, so selects feel instant. */
  draftMapping: Record<string, Record<string, string>>;
  setMapping: (
    fieldKey: string,
    header: string,
    member: ImportEntityType | null,
  ) => void;
  setDuplicatePolicy: (
    policy: DuplicatePolicy,
    member: ImportEntityType | null,
  ) => Promise<void>;
  setRowAction: (
    row: number,
    action: DuplicatePolicy,
    member: ImportEntityType | null,
  ) => Promise<void>;
  runPreview: () => Promise<boolean>;
  confirm: () => Promise<boolean>;
  /** Await any queued mapping writes before advancing a step. */
  flush: () => Promise<void>;
  refresh: () => Promise<void>;
};

export function useImportSession(sessionId: string | null): UseImportSession {
  const swrKey = sessionId ? keys.importSession(sessionId) : null;

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draftMapping, setDraftMapping] = useState<
    Record<string, Record<string, string>>
  >({});

  // When the async confirm started, so polling can give up eventually.
  const pollStartedAt = useRef(0);
  // Serialises writes: overlapping PATCHes can otherwise land out of order and
  // clobber each other, since each response is a whole session.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const pendingMappings = useRef<Record<string, PendingMapping>>({});

  const { data: session, isLoading } = useSWR<ImportSession>(
    swrKey,
    authFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshWhenHidden: false,
      refreshWhenOffline: false,
      dedupingInterval: 1000,
      refreshInterval: (data) => {
        if (data?.status !== 'importing') return 0;
        if (!pollStartedAt.current) pollStartedAt.current = Date.now();
        const elapsed = Date.now() - pollStartedAt.current;
        if (elapsed > POLL_GIVE_UP_MS) return 0;
        if (elapsed < 15_000) return 1_500;
        if (elapsed < 60_000) return 3_000;
        return 5_000;
      },
      onError: (e) => setError(importErrorMessage(e)),
    },
  );

  const isPolling = session?.status === 'importing';

  /** Write a server response straight into the cache — never refetch. */
  const apply = useCallback(
    (next: ImportSession) => {
      if (!swrKey) return;
      void globalMutate(swrKey, next, { revalidate: false });
    },
    [swrKey],
  );

  const enqueue = useCallback(
    <T>(fn: () => Promise<T>): Promise<T | undefined> => {
      const run = queue.current.then(fn).then(
        (result) => result,
        (e: unknown) => {
          setError(importErrorMessage(e));
          return undefined;
        },
      );
      queue.current = run;
      return run as Promise<T | undefined>;
    },
    [],
  );

  const sendMapping = useCallback(
    (pending: PendingMapping) => {
      if (!sessionId) return Promise.resolve(undefined);
      setBusy(true);
      return enqueue(async () => {
        const next = await importService.setMapping(sessionId, {
          mapping: pending.mapping,
          ...(pending.member ? { member: pending.member } : {}),
        });
        apply(next);
        return next;
      }).finally(() => setBusy(false));
    },
    [apply, enqueue, sessionId],
  );

  const flush = useCallback(async () => {
    // Fire any debounced mapping writes immediately, then drain the queue.
    for (const [key, timer] of Object.entries(debounceTimers.current)) {
      clearTimeout(timer);
      delete debounceTimers.current[key];
      const pending = pendingMappings.current[key];
      if (pending) {
        delete pendingMappings.current[key];
        void sendMapping(pending);
      }
    }
    await queue.current;
  }, [sendMapping]);

  const setMapping = useCallback(
    (fieldKey: string, header: string, member: ImportEntityType | null) => {
      if (!sessionId || !session) return;
      const key = member ?? '__single__';

      // Render from the draft immediately; the server catches up on debounce.
      setDraftMapping((prev) => {
        const current =
          prev[key] ??
          (member
            ? (session.members.find((m) => m.entityType === member)?.mapping ??
              {})
            : session.mapping);
        const next = { ...current };
        if (header) next[fieldKey] = header;
        else delete next[fieldKey];
        pendingMappings.current[key] = { member, mapping: next };
        return { ...prev, [key]: next };
      });

      clearTimeout(debounceTimers.current[key]);
      debounceTimers.current[key] = setTimeout(() => {
        delete debounceTimers.current[key];
        const pending = pendingMappings.current[key];
        if (!pending) return;
        delete pendingMappings.current[key];
        void sendMapping(pending);
      }, MAPPING_DEBOUNCE_MS);
    },
    [sendMapping, session, sessionId],
  );

  const setDuplicatePolicy = useCallback(
    async (policy: DuplicatePolicy, member: ImportEntityType | null) => {
      if (!sessionId) return;
      setBusy(true);
      await enqueue(async () => {
        const next = await importService.setMapping(sessionId, {
          duplicatePolicy: policy,
          ...(member ? { member } : {}),
        });
        apply(next);
        return next;
      });
      setBusy(false);
    },
    [apply, enqueue, sessionId],
  );

  const setRowAction = useCallback(
    async (
      row: number,
      action: DuplicatePolicy,
      member: ImportEntityType | null,
    ) => {
      if (!sessionId) return;
      setBusy(true);
      await enqueue(async () => {
        const next = await importService.setRowAction(sessionId, row, {
          action,
          ...(member ? { member } : {}),
        });
        apply(next);
        return next;
      });
      setBusy(false);
    },
    [apply, enqueue, sessionId],
  );

  const runPreview = useCallback(async () => {
    if (!sessionId) return false;
    await flush();
    setBusy(true);
    const next = await enqueue(() => importService.preview(sessionId));
    setBusy(false);
    if (!next) return false;
    apply(next);
    // A fresh preview supersedes every local draft.
    setDraftMapping({});
    return true;
  }, [apply, enqueue, flush, sessionId]);

  const confirm = useCallback(async () => {
    if (!sessionId) return false;
    await flush();
    setBusy(true);
    const outcome = await enqueue(() => importService.confirm(sessionId));
    setBusy(false);
    if (!outcome) return false;
    if (outcome.mode === 'sync') {
      apply(outcome.session);
    } else {
      // Background run: start the poll clock and let SWR pick it up.
      pollStartedAt.current = Date.now();
      if (swrKey) void globalMutate(swrKey);
    }
    return true;
  }, [apply, enqueue, flush, sessionId, swrKey]);

  const refresh = useCallback(async () => {
    if (!swrKey) return;
    await globalMutate(swrKey);
  }, [swrKey]);

  // Once the data has actually landed, drop the caches of every screen that
  // now shows it. This is what makes the existing pages light up.
  const invalidatedFor = useRef<string | null>(null);
  const sessionStatus = session?.status;
  const currentSessionId = session?.id;
  useEffect(() => {
    if (sessionStatus !== 'completed' || !currentSessionId) return;
    if (invalidatedFor.current === currentSessionId) return;
    invalidatedFor.current = currentSessionId;
    void globalMutate(
      (key) =>
        typeof key === 'string' &&
        IMPORT_TOUCHED_PREFIXES.some((prefix) => key.startsWith(prefix)),
    );
    // An already-open overview or calendar keeps its empty snapshot unless
    // these keys are revalidated by name, including the calendar's query string.
    void globalMutate(keys.companyDashboard());
    void globalMutate(
      (key) =>
        typeof key === 'string' &&
        (key === 'dashboards/calendar' || key.startsWith('dashboards/calendar?')),
    );
  }, [currentSessionId, sessionStatus]);

  // Clear timers on unmount so a debounced write cannot fire into a dead tree.
  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      for (const timer of Object.values(timers)) clearTimeout(timer);
    };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return useMemo(
    () => ({
      session,
      isLoading,
      isPolling,
      busy,
      error,
      clearError,
      draftMapping,
      setMapping,
      setDuplicatePolicy,
      setRowAction,
      runPreview,
      confirm,
      flush,
      refresh,
    }),
    [
      session,
      isLoading,
      isPolling,
      busy,
      error,
      clearError,
      draftMapping,
      setMapping,
      setDuplicatePolicy,
      setRowAction,
      runPreview,
      confirm,
      flush,
      refresh,
    ],
  );
}
