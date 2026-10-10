import ExportAllModal from './export-all-modal';
import React from 'react';
import { Button } from '@tryghost/shade/components';
import { LucideIcon } from '@tryghost/shade/utils';
import { type ChecklistItem, MigrationChecklist } from './migration-checklist';

const EXPORT_CHECKLIST: ChecklistItem[] = [
  { status: 'included', label: 'Posts and pages' },
  { status: 'included', label: 'Images and files' },
  { status: 'included', label: 'Settings and staff' },
  { status: 'optional', label: 'Themes and routes' },
  { status: 'optional', label: 'Posts spreadsheet' },
  { status: 'excluded', label: 'Passwords and access code' },
  { status: 'excluded', label: 'Revision history' },
];

const MigrationToolsExport: React.FC = () => {
  const [exportAllOpen, setExportAllOpen] = React.useState(false);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 lg:grid-cols-3">
        <Button
          className="h-9 font-semibold"
          data-testid="export-all-button"
          type="button"
          variant="secondary"
          onClick={() => setExportAllOpen(true)}
        >
          <LucideIcon.PackageOpen />
          Export site
        </Button>
      </div>
      <MigrationChecklist items={EXPORT_CHECKLIST} title="What an export contains" />
      <ExportAllModal open={exportAllOpen} onOpenChange={setExportAllOpen} />
    </>
  );
};

export default MigrationToolsExport;
