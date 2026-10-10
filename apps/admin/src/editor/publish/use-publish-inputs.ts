import { useCallback, useEffect, useMemo } from 'react';
import { isSessionInvalid } from '@/editor/session/error-mapping';
import { useEditorSettings, useSiteTimezone } from '@/editor/use-editor-settings';
import { SESSION_EXPIRED_RETRY_MESSAGE } from './completion-message';
import { reportPublishFailure } from './report-publish-failure';

export interface PublishInputs {
  timezone: string;
  /** False until the site settings have loaded. */
  isReady: boolean;
  /** A query failure that the caller can render in place. */
  error: Error | null;
  /** The failure is an expired session: signing in again, then `retry()`, is the way back. */
  sessionExpired: boolean;
  retry: () => void;
}

// Several editor surfaces read the inputs; a failed read is reported once, not once per reader.
const reportedInputErrors = new WeakSet<object>();

function reportInputError(error: unknown): void {
  if (typeof error !== 'object' || error === null || reportedInputErrors.has(error)) {
    return;
  }
  reportedInputErrors.add(error);
  reportPublishFailure('publish-inputs', 'The publish settings could not be loaded.', { error });
}

function publishInputError(error: unknown): Error | null {
  if (!error) {
    return null;
  }

  // The transport's "You are not authorised…" leaves the writer nowhere to go.
  if (isSessionInvalid(error)) {
    return new Error(SESSION_EXPIRED_RETRY_MESSAGE, { cause: error });
  }

  return error instanceof Error ? error : new Error('The publish settings could not be loaded.');
}

/** The site settings the publish and update flows read, chiefly the timezone. */
export function usePublishInputs(): PublishInputs {
  const settingsQuery = useEditorSettings();
  const timezone = useSiteTimezone();
  const queryError = settingsQuery.error;
  const error = useMemo(() => publishInputError(queryError), [queryError]);

  useEffect(() => {
    reportInputError(queryError);
  }, [queryError]);

  const { refetch } = settingsQuery;
  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    timezone,
    isReady: Boolean(settingsQuery.data) && !error,
    error,
    sessionExpired: Boolean(queryError) && isSessionInvalid(queryError),
    retry,
  };
}
