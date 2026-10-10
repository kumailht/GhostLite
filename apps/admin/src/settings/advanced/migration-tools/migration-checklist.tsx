import React from 'react';
import { Inline, Stack, Text } from '@tryghost/shade/primitives';
import { LucideIcon, cn } from '@tryghost/shade/utils';

export type ChecklistStatus = 'included' | 'optional' | 'excluded';

export interface ChecklistItem {
  status: ChecklistStatus;
  label: string;
}

const STATUS_ICON: Record<ChecklistStatus, { Icon: typeof LucideIcon.Check; className: string; label: string }> = {
  included: { Icon: LucideIcon.Check, className: 'text-state-success', label: 'Included' },
  optional: { Icon: LucideIcon.CircleDashed, className: 'text-muted-foreground', label: 'Optional' },
  excluded: { Icon: LucideIcon.X, className: 'text-muted-foreground', label: 'Not included' },
};

/** What an import or export covers, one line per kind of data. */
export const MigrationChecklist: React.FC<{ title: string; items: ChecklistItem[] }> = ({
  title,
  items,
}) => (
  <Stack className="pt-5" gap="sm">
    <Text size="sm" weight="semibold">
      {title}
    </Text>
    <Stack gap="xs" role="list">
      {items.map(({ status, label }) => {
        const { Icon, className, label: statusLabel } = STATUS_ICON[status];
        return (
          <Inline key={label} align="start" gap="sm" role="listitem">
            <Icon aria-label={statusLabel} className={cn('mt-0.5 size-4 shrink-0', className)} />
            <Text size="sm" tone={status === 'excluded' ? 'secondary' : undefined}>
              {label}
            </Text>
          </Inline>
        );
      })}
    </Stack>
  </Stack>
);
