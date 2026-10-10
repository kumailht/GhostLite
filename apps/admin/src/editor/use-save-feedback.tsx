import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { postPreviewUrl } from './preview/preview-url';
import { describeRevertToast, describeSaveToast, type SaveToast } from './save-toast';
import { useSiteTimezone } from './use-editor-settings';
import { useSmallScreen } from './use-small-screen';
import type { SaveCompletion } from './engine/save-engine';
import type { EditorSaveResult } from './session/editor-session';
import type { EditorRecord } from './session/projection';
import type { EditorSessionHandle } from './session/use-editor-session';

// Sonner keeps a dismissed id flagged for removal, so reusing one hides the new toast.
let saveToastSeq = 0;

/** How long a save button reads as saved before it returns to its label. */
export const SAVE_STATUS_DURATION_MS = 2500;

function savedRecordOf(completion: SaveCompletion): EditorRecord | undefined {
  if (completion.kind !== 'saved' || !('post' in completion.result)) {
    return undefined;
  }
  return (completion.result as EditorSaveResult).post;
}

function showSaveToast({ title, description, action }: SaveToast, smallScreen: boolean): string {
  saveToastSeq += 1;
  const id = `editor-save-${saveToastSeq}`;
  toast.success(title, {
    id,
    // Leave both the header and the mobile footer's actions reachable.
    position: smallScreen ? 'top-left' : 'bottom-left',
    className: smallScreen ? 'top-20!' : undefined,
    description: description ? (
      <>
        {description.map(({ text, strong }) =>
          strong ? <strong key={`strong:${text}`}>{text}</strong> : <span key={text}>{text}</span>,
        )}
      </>
    ) : undefined,
    action: action ? (
      <a
        className="ml-auto shrink-0 text-sm font-semibold text-foreground underline"
        href={action.href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {action.label}
      </a>
    ) : undefined,
  });
  return id;
}

interface SaveFeedbackSources {
  session: EditorSessionHandle;
  displayName: 'post' | 'page';
  siteUrl: string;
}

/**
 * Explicit saves that report what they did: each one clears the last save
 * toast and, once the server acknowledges it, describes the post's new state.
 */
export function useSaveFeedback({ session, displayName, siteUrl }: SaveFeedbackSources) {
  const smallScreen = useSmallScreen();
  const timezone = useSiteTimezone();
  const sources = { smallScreen, session, displayName, siteUrl, timezone };
  const latest = useRef(sources);
  latest.current = sources;
  const lastToastId = useRef<string | null>(null);

  const show = useCallback((described: SaveToast) => {
    if (lastToastId.current) {
      toast.dismiss(lastToastId.current);
    }
    lastToastId.current = showSaveToast(described, latest.current.smallScreen);
  }, []);

  const save = useCallback(async (): Promise<SaveCompletion> => {
    const previousStatus = latest.current.session.publishTime.status;
    if (lastToastId.current) {
      toast.dismiss(lastToastId.current);
      lastToastId.current = null;
    }

    const completion = await latest.current.session.saveExplicit();

    // A status change came from a publish command queued ahead of this save, not from it.
    if (completion.kind !== 'saved' || completion.result.status !== previousStatus) {
      return completion;
    }

    const current = latest.current;
    const record = savedRecordOf(completion) ?? current.session.loadedRecord;
    const described = describeSaveToast({
      displayName: current.displayName,
      previousStatus,
      status: completion.result.status,
      url: record?.url,
      previewUrl: postPreviewUrl(current.siteUrl, record?.uuid),
      publishedAt: record?.published_at,
      timezone: current.timezone,
    });

    if (described) {
      show(described);
    }
    return completion;
  }, [show]);

  const showReverted = useCallback(() => {
    show(describeRevertToast(latest.current.displayName));
  }, [show]);

  return { save, showReverted };
}

export type SaveButtonPhase = 'idle' | 'running' | 'success' | 'failure';

/** A save button's progress belongs to the document its click asked to save. */
export function useSaveButtonPhase(save: () => Promise<SaveCompletion>, contentKey: number) {
  const [phase, setPhase] = useState<SaveButtonPhase>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mounted = useRef(true);
  const generation = useRef(0);

  useLayoutEffect(() => {
    mounted.current = true;
    generation.current += 1;
    // Reloads and revision restores replace the document without remounting the header.
    setPhase('idle');
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, [contentKey]);

  const run = useCallback(async () => {
    const startedGeneration = generation.current;
    clearTimeout(timer.current);
    setPhase('running');

    let completion: SaveCompletion | null = null;
    try {
      completion = await save();
    } finally {
      if (mounted.current && generation.current === startedGeneration) {
        if (completion?.kind === 'saved') {
          setPhase('success');
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setPhase('idle'), SAVE_STATUS_DURATION_MS);
        } else {
          setPhase(completion === null || completion.kind === 'failed' ? 'failure' : 'idle');
        }
      }
    }
  }, [save]);

  return { phase, run };
}
