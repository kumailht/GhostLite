import moment from 'moment-timezone';

export type PostDisplayName = 'post' | 'page';

// Ember's `buttonTextMap`, less its success copy: the flow replaces the confirm
// step with the complete step, so a success state on this button never renders.
export interface ConfirmButtonInputs {
  isScheduled: boolean;
  scheduledAt: string;
  displayName: PostDisplayName;
  timezone: string;
}

/** `publish-flow/confirm.js` :72-89. */
export function confirmButtonText({
  isScheduled,
  scheduledAt,
  displayName,
  timezone,
}: ConfirmButtonInputs): string {
  let text = `Publish ${displayName}`;

  if (isScheduled) {
    text += `, on ${moment.tz(scheduledAt, timezone).format('MMMM Do')}`;
  } else {
    text += ', right now';
  }

  return text;
}

export function confirmRunningText(isScheduled: boolean): string {
  return isScheduled ? 'Scheduling' : 'Publishing';
}

/**
 * The site-timezone calendar day, carried in a Date's LOCAL fields. Date pickers
 * read a Date through its local getters, so handing them the instant itself
 * lands on the wrong day whenever the site and browser zones disagree.
 */
export function siteCalendarDay(iso: string, timezone: string): Date {
  const time = moment.tz(iso, timezone);
  return new Date(time.year(), time.month(), time.date());
}

/** `gh-format-post-time` with `relative=true`: plain `moment().from(now)`. */
export function relativeTime(iso: string, now?: Date): string {
  return moment(iso).from(now ? moment(now) : moment.utc());
}

export function formatSiteDateTime(iso: string, timezone: string): string {
  return moment.tz(iso, timezone).format('D MMM YYYY [at] HH:mm');
}

/** The complete step's "today"/"on <date>" variant. */
export function formatScheduledCompletion(iso: string, timezone: string): string {
  const scheduled = moment.tz(iso, timezone);
  const day = scheduled.isSame(moment.tz(timezone), 'day')
    ? 'today'
    : `on ${scheduled.format('MMMM Do')}`;

  return `${day} at ${scheduled.format('HH:mm')}`;
}
