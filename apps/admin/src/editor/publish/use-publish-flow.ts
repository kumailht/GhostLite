import { apiUrl } from '@tryghost/admin-x-framework/helpers';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useFetchApi } from '@tryghost/admin-x-framework/hooks';
import { publishedPostCountResponseSchema } from './api-response-schemas';
import { createPublishOptions } from './publish-options';
import { reportPublishFailure } from './report-publish-failure';
import {
  CompletionFailureError,
  DROPPED_MESSAGE,
  UNEXPECTED_MESSAGE,
  describeCompletionFailure,
  describeRejectedAction,
  type CompletionFailure,
} from './completion-message';
import { EDITOR_REQUEST_OPTIONS } from '@/editor/request-options';
import { writePublishCelebration } from './celebration-handoff';
import type { PublishFlowPost } from './flow-post';
import type { PublishDispatcher, PublishOptionsMachine, PublishOptionsState } from './publish-options';
import type { SaveCompletion } from '@/editor/engine/save-engine';

export type PublishStep = 'options' | 'confirm' | 'complete';
export type ConfirmStatus = 'idle' | 'running' | 'success' | 'failure';

export interface PublishFlowOptions {
  post: PublishFlowPost;
  /** The machine's clock, injected for tests. */
  now?: () => Date;
  dispatch: PublishDispatcher;
  showCompletion?: boolean;
  onBeforePublish?: () => Promise<void>;
  onCompleted?: (info: { postId: string; isScheduled: boolean }) => void;
}

type PublishOptionActions = Pick<PublishOptionsMachine, 'setScheduledAt' | 'setIsScheduled'>;

export interface PublishFlow extends PublishOptionActions {
  state: PublishOptionsState;
  step: PublishStep;
  confirmStatus: ConfirmStatus;
  failure: CompletionFailure | null;
  /** The site's published count including this post, for the complete step's copy. */
  postCount: number | null;
  /** When the publish landed, standing in for the publish time the server stamped. */
  completedAt: string | null;
  /** True while the publish request itself is in flight; closing then would hide its outcome. */
  publishInFlight: boolean;
  /** Publish intent captured on entering confirm, so saving cannot change the copy. */
  captured: { isScheduled: boolean };
  toConfirm: () => void;
  toOptions: () => void;
  confirmPublish: () => Promise<void>;
  /** Abandons any asynchronous continuation before the caller closes the modal. */
  cancel: () => void;
}

export const SCHEDULE_PASSED =
  'The scheduled time has passed. Go back and choose a future date and time.';

export function usePublishFlow({
  post,
  now,
  dispatch,
  showCompletion = true,
  onBeforePublish,
  onCompleted,
}: PublishFlowOptions): PublishFlow {
  const fetchApi = useFetchApi();
  const [, refresh] = useReducer((tick: number) => tick + 1, 0);

  // The machine reads its inputs once, so it is keyed on the post rather than on
  // the identity of props a re-rendering caller rebuilds.
  const inputs = useRef({ post, now });
  inputs.current = { post, now };
  const activeRef = useRef(true);

  const machine = useMemo(() => {
    const current = inputs.current;
    return createPublishOptions({ post: current.post, now: current.now });
  }, [post.id]);

  // Keep model changes and React updates together; callers only receive actions.
  const optionActions = useMemo<PublishOptionActions>(
    () => ({
      setScheduledAt: (value) => {
        machine.setScheduledAt(value);
        refresh();
      },
      setIsScheduled: (value) => {
        machine.setIsScheduled(value);
        refresh();
      },
    }),
    [machine],
  );

  const [step, setStep] = useState<PublishStep>('options');
  const [confirmStatus, setConfirmStatus] = useState<ConfirmStatus>('idle');
  const [failure, setFailure] = useState<CompletionFailure | null>(null);
  const [postCount, setPostCount] = useState<number | null>(null);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [publishInFlight, setPublishInFlight] = useState(false);
  const [captured, setCaptured] = useState<PublishFlow['captured']>(() => ({
    isScheduled: machine.getState().isScheduled,
  }));
  const completedRef = useRef(false);
  const publishRunningRef = useRef(false);

  // A schedule chosen before the editor sat idle may now be in the past.
  useEffect(() => {
    machine.resetPastScheduledAt();
    refresh();
  }, [machine]);

  const cancel = useCallback(() => {
    activeRef.current = false;
  }, []);

  // StrictMode replays this effect's cleanup before its second setup. Restore
  // activity on setup so that development mode does not leave the flow inert.
  useEffect(() => {
    activeRef.current = true;
    return cancel;
  }, [cancel]);

  const state = machine.getState();

  const fetchPostCount = useCallback(async () => {
    // No count is shown for pages or scheduled posts.
    if (post.displayName === 'page' || state.isScheduled) {
      setPostCount(null);
      return;
    }

    try {
      const data = publishedPostCountResponseSchema.parse(
        await fetchApi<unknown>(
          apiUrl('/posts/', { filter: `status:published+id:-'${post.id}'`, limit: '1' }),
          EDITOR_REQUEST_OPTIONS,
        ),
      );
      if (activeRef.current) {
        setPostCount(data.meta.pagination.total + 1);
      }
    } catch {
      if (activeRef.current) {
        setPostCount(null);
      }
    }
  }, [fetchApi, post.displayName, post.id, state.isScheduled]);

  const toConfirm = useCallback(() => {
    if (!state.canPublish) {
      return;
    }
    setCaptured({ isScheduled: state.isScheduled });
    setFailure(null);
    setConfirmStatus('idle');
    setStep('confirm');
    void fetchPostCount();
  }, [fetchPostCount, state]);

  const toOptions = useCallback(() => {
    if (publishRunningRef.current) {
      return;
    }
    setStep('options');
    setConfirmStatus('idle');
  }, []);

  const complete = useCallback(
    (isScheduled: boolean) => {
      if (!activeRef.current || completedRef.current) {
        return;
      }
      completedRef.current = true;
      if (showCompletion) {
        setConfirmStatus('success');
        setStep('complete');
        // The server stamps the publish time; this is the closest the client has.
        setCompletedAt(new Date().toISOString());
      }
      try {
        writePublishCelebration({ postId: post.id, displayName: post.displayName, isScheduled });
      } finally {
        onCompleted?.({ postId: post.id, isScheduled });
      }
    },
    [onCompleted, post.displayName, post.id, showCompletion],
  );

  const confirmPublish = useCallback(async () => {
    if (publishRunningRef.current) {
      return;
    }

    // The chosen time can pass while the flow sits open, or while the pre-save
    // cleanup waits on a sign-in, so it is checked against the clock at the click
    // and again before the publish is sent. Scheduling is not switched off here:
    // that would turn the confirmed schedule into an immediate publish.
    const schedulePassed = () => {
      const current = machine.getState();
      return (
        current.isScheduled && Date.parse(current.scheduledAt) < Date.parse(current.minScheduledAt)
      );
    };

    if (schedulePassed()) {
      setFailure({ message: SCHEDULE_PASSED });
      setConfirmStatus('failure');
      return;
    }

    publishRunningRef.current = true;
    setFailure(null);
    setConfirmStatus('running');

    const command = machine.toDispatch();

    if (!command) {
      publishRunningRef.current = false;
      setFailure({ message: DROPPED_MESSAGE });
      setConfirmStatus('failure');
      reportPublishFailure('no-command', DROPPED_MESSAGE, { postId: post.id });
      return;
    }

    const { isScheduled } = state;

    try {
      await onBeforePublish?.();
    } catch (error) {
      if (activeRef.current) {
        publishRunningRef.current = false;
        const shown = describeRejectedAction(error, UNEXPECTED_MESSAGE);
        setFailure(shown);
        setConfirmStatus('failure');
        // A save that settled as failed was reported by the session; anything else is a fault.
        if (!(error instanceof CompletionFailureError)) {
          reportPublishFailure('pre-publish-save', shown.message, { error, postId: post.id });
        }
      }
      return;
    }

    if (!activeRef.current) {
      return;
    }

    if (schedulePassed()) {
      publishRunningRef.current = false;
      setFailure({ message: SCHEDULE_PASSED });
      setConfirmStatus('failure');
      return;
    }

    let completion: SaveCompletion;

    setPublishInFlight(true);
    try {
      completion = await dispatch(command);
    } catch (error) {
      if (activeRef.current) {
        publishRunningRef.current = false;
        setPublishInFlight(false);
        const shown = describeRejectedAction(error, UNEXPECTED_MESSAGE);
        setFailure(shown);
        setConfirmStatus('failure');
        // The dispatch settles every save it runs; a rejection is a fault in getting there.
        reportPublishFailure('publish-request', shown.message, { error, postId: post.id });
      }
      return;
    }

    if (!activeRef.current) {
      return;
    }
    setPublishInFlight(false);
    const completionFailure = describeCompletionFailure(completion);

    if (completionFailure) {
      publishRunningRef.current = false;
      setFailure(completionFailure);
      setConfirmStatus('failure');
      // A re-auth interruption sends the user back to confirm and try again.
      setStep('confirm');
      return;
    }

    complete(isScheduled);
  }, [complete, dispatch, machine, onBeforePublish, post.id, state]);

  return {
    ...optionActions,
    state,
    step,
    confirmStatus,
    failure,
    postCount,
    completedAt,
    publishInFlight,
    captured,
    toConfirm,
    toOptions,
    confirmPublish,
    cancel,
  };
}
