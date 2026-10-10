import ExportAllModal from './export-all-modal';
import React from 'react';
import { Button } from '@tryghost/shade/components';
import { LucideIcon } from '@tryghost/shade/utils';
import { type ChecklistItem, MigrationChecklist } from './migration-checklist';

const EXPORT_CHECKLIST: ChecklistItem[] = [
  {
    status: 'included',
    label: 'Posts and pages, with their tags and authors',
  },
  {
    status: 'included',
    label: 'Images, video, audio and files you uploaded',
  },
  {
    status: 'included',
    label: 'Site settings and staff accounts',
    note: 'without passwords',
  },
  {
    status: 'optional',
    label: 'Themes, routes and redirects',
  },
  {
    status: 'optional',
    label: 'Posts list as a spreadsheet (CSV)',
  },
  {
    status: 'excluded',
    label: 'Post revision history, integrations and API keys',
  },
  {
    status: 'excluded',
    label: 'Private-site access code',
  },
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
