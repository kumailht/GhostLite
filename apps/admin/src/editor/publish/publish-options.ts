import type { PostStatus } from '@tryghost/admin-x-framework/api/posts';
import type {
  PublishOptions as PublishCommandOptions,
  ScheduleOptions as ScheduleCommandOptions,
  SaveCompletion,
} from '@/editor/engine/save-engine';

/** The server rejects a schedule in the past; the picker floor sits just ahead of now. */
export const MIN_SCHEDULE_LEAD_MS = 5 * 1000;
export const DEFAULT_SCHEDULE_LEAD_MS = 10 * 60 * 1000;

export interface PublishPostInput {
  status: PostStatus;
}

export interface PublishOptionsState {
  readonly isScheduled: boolean;
  /** ISO 8601, milliseconds zeroed. */
  readonly scheduledAt: string;
  /** The earliest time the picker may offer, recomputed on every read. */
  readonly minScheduledAt: string;
  /** Only drafts can be published. */
  readonly canPublish: boolean;
  readonly isDirty: boolean;
}

export type PublishDispatcher = (dispatch: PublishDispatch) => Promise<SaveCompletion>;

export type PublishDispatch =
  | { kind: 'publish'; options: PublishCommandOptions }
  | { kind: 'schedule'; options: ScheduleCommandOptions }
  | { kind: 'revert' };

export interface PublishOptionsMachine {
  getState(): PublishOptionsState;
  setIsScheduled(shouldSchedule?: boolean): void;
  setScheduledAt(date: string | Date): void;
  resetPastScheduledAt(): void;
  reset(): void;
  /** Null when no safe status transition is on offer. */
  toDispatch(): PublishDispatch | null;
  toRevertDispatch(): PublishDispatch;
}

export interface PublishOptionsInputs {
  post: PublishPostInput;
  now?: () => Date;
}

function zeroMilliseconds(time: number): string {
  return new Date(time - (time % 1000)).toISOString();
}

function isBefore(iso: string, other: string): boolean {
  return Date.parse(iso) < Date.parse(other);
}

export function createPublishOptions({
  post,
  now = () => new Date(),
}: PublishOptionsInputs): PublishOptionsMachine {
  const isDraft = post.status === 'draft';

  const minScheduledAt = () => zeroMilliseconds(now().getTime() + MIN_SCHEDULE_LEAD_MS);
  const defaultScheduledAt = () => zeroMilliseconds(now().getTime() + DEFAULT_SCHEDULE_LEAD_MS);

  let isScheduled = false;
  let scheduledAt = minScheduledAt();
  // A time only counts as a change once it is chosen, so unscheduling cannot leave the state dirty.
  let scheduledAtTouched = false;
  const initialScheduledAt = scheduledAt;

  const isDirty = (): boolean =>
    isScheduled || (scheduledAtTouched && scheduledAt !== initialScheduledAt);

  const setScheduledAt = (date: string | Date): void => {
    const time = date instanceof Date ? date.getTime() : Date.parse(date);

    if (Number.isNaN(time)) {
      return;
    }

    const candidate = zeroMilliseconds(time);
    const floor = minScheduledAt();

    scheduledAt = isBefore(candidate, floor) ? floor : candidate;
    scheduledAtTouched = true;
  };

  return {
    getState: () => ({
      isScheduled,
      scheduledAt,
      minScheduledAt: minScheduledAt(),
      canPublish: isDraft,
      isDirty: isDirty(),
    }),

    setIsScheduled(shouldSchedule) {
      isScheduled = shouldSchedule === undefined ? !isScheduled : shouldSchedule;

      if (isScheduled && isBefore(scheduledAt, defaultScheduledAt())) {
        scheduledAt = defaultScheduledAt();
      }
    },

    setScheduledAt,

    resetPastScheduledAt() {
      if (isBefore(scheduledAt, minScheduledAt())) {
        isScheduled = false;
      }
    },

    reset() {
      isScheduled = false;
      // The construction-time floor may itself be in the past by now.
      scheduledAt = minScheduledAt();
      scheduledAtTouched = false;
    },

    toDispatch() {
      if (!isDraft) {
        return null;
      }

      if (isScheduled) {
        return { kind: 'schedule', options: { publishedAt: scheduledAt } };
      }

      return { kind: 'publish', options: {} };
    },

    toRevertDispatch() {
      return { kind: 'revert' };
    },
  };
}
