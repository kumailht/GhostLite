import { useEffect, useState } from 'react';
import { Text } from '@tryghost/shade/primitives';
import { Button, buttonVariants } from '@tryghost/shade/components';
import { useShade } from '@tryghost/shade/app';
import { cn } from '@tryghost/shade/utils';
import {
  editorSaveError,
  editorScheduleCountdown,
  editorStatus,
} from '@/editor/selectors';
import { formatPostTime } from '@/posts/list/post-time';
import { ErrorLine } from './publish/components/failure-banner';
import { useSiteTimezone } from './use-editor-settings';
import type { PendingSave, SaveEngineState } from './engine/save-engine';
import {
  type EditorStatusRecord,
  type EditorStatusView,
  deriveEditorStatus,
  useScheduledBoundary,
  useSavingHold,
} from './post-status';

function ScheduleCountdown({
  publishedAt,
  timezone,
}: {
  publishedAt: string | null;
  timezone: string;
}) {
  return (
    <time
      className="text-state-success"
      data-testid={editorScheduleCountdown}
      dateTime={publishedAt ?? undefined}
    >
      to be published{' '}
      {formatPostTime(publishedAt, { timezone, scheduled: true })}
    </time>
  );
}

/** A failed or refused save: what went wrong, and a retry where one helps. */
function SaveProblem({
  view,
  onRetrySave,
}: {
  view: Extract<EditorStatusView, { kind: 'problem' }>;
  onRetrySave?: () => void;
}) {
  const { message } = view;

  return (
    <ErrorLine className="text-destructive" data-testid={editorSaveError}>
      <span role="alert">
{message}
      </span>
      {view.retryable && onRetrySave ? (
        <>
          {' '}
          <Button className="h-auto p-0 text-destructive" variant="link" onClick={onRetrySave}>
            Retry
          </Button>
        </>
      ) : null}
    </ErrorLine>
  );
}

function StatusBody({
  view,
  timezone,
  isHovered,
  onRetrySave,
}: {
  view: Exclude<EditorStatusView, { kind: 'new' }>;
  timezone: string;
  isHovered: boolean;
  onRetrySave?: () => void;
}) {
  switch (view.kind) {
    case 'problem':
      return <SaveProblem view={view} onRetrySave={onRetrySave} />;
    case 'saving':
      return <>Saving…</>;
    case 'draft':
      return <>{view.saved ? 'Draft - Saved' : 'Draft'}</>;
    case 'scheduled':
      return (
        <span className="text-state-success">
          Scheduled
          {isHovered && (
            <>
              {' '}
              <ScheduleCountdown publishedAt={view.publishedAt} timezone={timezone} />
            </>
          )}
        </span>
      );
    default:
      return view.url ? (
        <a className="hover:text-foreground" href={view.url} rel="noopener noreferrer" target="_blank">
          Published
        </a>
      ) : (
        <>Published</>
      );
  }
}

export interface EditorStatusProps {
  state: SaveEngineState;
  /** Work the engine is holding back; a collision blocking it leaves the retry to its banner. */
  pendingSave?: PendingSave | null;
  record?: EditorStatusRecord;
  isDirty: boolean;
  /** Retries the failed save the status line reports. */
  onRetrySave?: () => void;
}

/**
 * Where the post stands: its status and the last save. A save
 * that failed or was refused replaces the status until a later save lands.
 */
export function EditorStatus({
  state,
  pendingSave,
  record,
  isDirty,
  onRetrySave,
}: EditorStatusProps) {
  const { isAdmin7 } = useShade();
  const timezone = useSiteTimezone();
  const isSaving = useSavingHold(state.kind === 'saving' || state.kind === 'pending-coalesced');
  const [isHovered, setIsHovered] = useState(false);
  const [, setTick] = useState(0);

  useScheduledBoundary(record?.publishedAt, record?.status === 'scheduled');

  // The countdown only reads while hovered, so it only has to tick then.
  useEffect(() => {
    if (!isHovered) {
      return;
    }
    const interval = setInterval(() => setTick((tick) => tick + 1), 1000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const view = deriveEditorStatus({ state, pendingSave, record, isDirty, isSaving });
  // A post that has never been saved has no status yet. Its first save still
  // reads "Saving…", and a failed one still reports the problem.
  if (view.kind === 'new') {
    return null;
  }

  return (
    <Text
      as="span"
      // Its first line sits where a one-line status centres it, level with the
      // back link's label, so a wrapped status grows downward from there.
      className={cn(
        buttonVariants({
          variant: null,
          size: isAdmin7 ? 'default' : 'sm',
          shape: 'pill',
          isAdmin7,
        }),
        'pointer-events-auto h-auto max-w-full min-w-0 items-start justify-self-start bg-background/80 px-3 text-(length:--text-control) whitespace-normal text-text-secondary backdrop-blur-sm',
        isAdmin7
          ? 'min-h-(--control-height) py-[calc((var(--control-height)-1lh)/2)]'
          : 'min-h-7 py-[calc((--spacing(7)-1lh)/2)]',
      )}
      data-testid={editorStatus}
      tone="secondary"
      weight="medium"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="min-w-0 break-words">
        <StatusBody
          isHovered={isHovered}
          timezone={timezone}
          view={view}
          onRetrySave={onRetrySave}
        />
      </span>
    </Text>
  );
}
