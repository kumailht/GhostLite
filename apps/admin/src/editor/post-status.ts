import { useEffect, useRef, useState } from 'react';
import type { PostStatus } from '@tryghost/admin-x-framework/api/posts';
import {
  SESSION_EXPIRED_MESSAGE,
  SESSION_EXPIRED_RETRY_MESSAGE,
  UNREACHABLE_MESSAGE,
  writerMessage,
} from './publish/completion-message';
import {
  type PendingSave,
  type SaveEngineState,
  type SaveError,
  type SaveIntent,
  isStatusIntent,
} from './engine/save-engine';

/** How long "Saving…" stays on screen once a save starts, so it is noticeable. */
export const SAVING_MIN_DISPLAY_MS = 3000;

export interface EditorStatusRecord {
  status?: PostStatus;
  publishedAt?: string | null;
  url?: string;
}

export type EditorStatusView =
  /** A save the writer has to act on; the message is the failed save's. */
  | {
      kind: 'problem';
      message: string;
      error: SaveError;
      /** Whether the status line offers the failed save's retry. */
      retryable: boolean;
    }
  | { kind: 'saving' }
  /** Never saved, so there is nothing to report; the status line shows nothing. */
  | { kind: 'new' }
  | { kind: 'draft'; saved: boolean }
  | { kind: 'scheduled'; publishedAt: string | null }
  | { kind: 'published'; url?: string };

export interface DeriveEditorStatusInput {
  state: SaveEngineState;
  /** Work the engine is holding back, which a collision can block. */
  pendingSave?: PendingSave | null;
  record?: EditorStatusRecord;
  isDirty: boolean;
  /** Held true for a minimum window after a save starts. */
  isSaving: boolean;
  now?: Date;
}

/** A scheduled post whose time has passed reads as published; the server owns the transition. */
function isPastScheduled(record: EditorStatusRecord, now: Date): boolean {
  if (record.status !== 'scheduled' || !record.publishedAt) {
    return false;
  }
  const time = Date.parse(record.publishedAt);
  return !Number.isNaN(time) && time <= now.getTime();
}

/**
 * Whether the status line offers a failed save's retry. A failed publish,
 * schedule or unpublish is retried where it was asked for, since a retry here
 * would save the post without changing its status. A refusal by the editor's own
 * rules never reached the server, and only fixing the field ends it.
 */
function isRetryable(
  intent: SaveIntent,
  error: SaveError,
  pendingSave: PendingSave | null | undefined,
): boolean {
  if (isStatusIntent(intent) || pendingSave?.blockedBy?.kind === 'conflict') {
    return false;
  }
  return !(error.kind === 'validation' && error.cause === undefined);
}

/** A failed save as the status line words it. */
export function saveErrorMessage(error: SaveError, intent?: SaveIntent): string {
  switch (error.kind) {
    case 'session-invalid':
      // A status change is retried where it was asked for, so the status line offers no Retry.
      return intent && isStatusIntent(intent)
        ? SESSION_EXPIRED_MESSAGE
        : SESSION_EXPIRED_RETRY_MESSAGE;
    case 'transport':
      return UNREACHABLE_MESSAGE;
    default:
      return writerMessage(error);
  }
}

export function deriveEditorStatus({
  state,
  pendingSave,
  record,
  isDirty,
  isSaving,
  now = new Date(),
}: DeriveEditorStatusInput): EditorStatusView {
  // A collision has its own banner, which offers its ways out; any other failed
  // save, including a refused publish, is reported here.
  if (state.kind === 'error') {
    return {
      kind: 'problem',
      message: saveErrorMessage(state.error, state.intent),
      error: state.error,
      retryable: isRetryable(state.intent, state.error, pendingSave),
    };
  }

  const status = record?.status ?? 'draft';

  if (isSaving && status === 'draft') {
    return { kind: 'saving' };
  }

  if (!record) {
    return { kind: 'new' };
  }

  // GhostLite never emails posts; an imported "sent" post reads as published.
  if (status === 'published' || status === 'sent' || isPastScheduled(record, now)) {
    return { kind: 'published', url: record.url };
  }

  if (status === 'scheduled') {
    return { kind: 'scheduled', publishedAt: record.publishedAt ?? null };
  }

  return { kind: 'draft', saved: !isDirty };
}

/** Browsers clamp longer timeouts; reschedule in bounded steps for distant posts. */
export const MAX_SCHEDULE_TIMEOUT_MS = 2_147_483_647;

/** Rerenders the caller when a future scheduled time is reached. */
export function useScheduledBoundary(
  publishedAt: string | null | undefined,
  enabled: boolean,
): void {
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    if (!enabled || !publishedAt) {
      return;
    }

    const remaining = Date.parse(publishedAt) - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0) {
      return;
    }

    const timer = setTimeout(
      () => setGeneration((current) => current + 1),
      Math.min(remaining, MAX_SCHEDULE_TIMEOUT_MS),
    );
    return () => clearTimeout(timer);
  }, [enabled, generation, publishedAt]);
}

/**
 * Holds `true` for `minMs` once a save starts. A save that begins inside the
 * window does not extend it; one still running when it closes opens a new one.
 */
export function useSavingHold(isSaving: boolean, minMs: number = SAVING_MIN_DISPLAY_MS): boolean {
  const [held, setHeld] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!isSaving || timer.current) {
      return;
    }
    setHeld(true);
    timer.current = setTimeout(() => {
      timer.current = undefined;
      setHeld(false);
    }, minMs);
  }, [isSaving, held, minMs]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return held;
}
