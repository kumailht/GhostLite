import React, { useState } from 'react';
import UniversalImportModal from './universal-import-modal';
import { Button } from '@tryghost/shade/components';
import { LucideIcon } from '@tryghost/shade/utils';
import { DialogPortal } from '@/settings/providers/dialog-portal';
import { type ChecklistItem, MigrationChecklist } from './migration-checklist';

const IMPORT_CHECKLIST: ChecklistItem[] = [
  {
    status: 'included',
    label: 'Posts and pages, with their tags and authors',
    note: 'from a GhostLite or Ghost export (.json or .zip)',
  },
  {
    status: 'included',
    label: 'Images, video, audio and files in the zip',
    note: 'links in posts are updated to match',
  },
  {
    status: 'included',
    label: 'Site settings',
    note: 'title, navigation, design and code injection',
  },
  {
    status: 'optional',
    label: 'Themes, routes and redirects',
    note: 'restored when the zip contains them; Casper and Source are left as they are',
  },
  {
    status: 'optional',
    label: 'Staff accounts',
    note: 'imported locked; each person resets their password (needs email set up)',
  },
  {
    status: 'excluded',
    label: 'Private-site access code and visibility',
    note: 'keep this site’s own setting',
  },
  {
    status: 'excluded',
    label: 'Members, newsletters, comments and tiers',
    note: 'dropped; members-only posts become public',
  },
];

const MigrationToolsImport: React.FC = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 lg:grid-cols-3">
        <Button
          className="h-9 font-semibold"
          type="button"
          variant="secondary"
          onClick={() => setIsImportModalOpen(true)}
        >
          <LucideIcon.Import className="size-4" />
          Import content
        </Button>
      </div>
      <MigrationChecklist items={IMPORT_CHECKLIST} title="What an import brings in" />
      {isImportModalOpen && (
        <DialogPortal>
          <UniversalImportModal onClose={() => setIsImportModalOpen(false)} />
        </DialogPortal>
      )}
    </>
  );
};

export default MigrationToolsImport;
