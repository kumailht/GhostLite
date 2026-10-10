import React, { useState } from 'react';
import UniversalImportModal from './universal-import-modal';
import { Button } from '@tryghost/shade/components';
import { LucideIcon } from '@tryghost/shade/utils';
import { DialogPortal } from '@/settings/providers/dialog-portal';
import { type ChecklistItem, MigrationChecklist } from './migration-checklist';

const IMPORT_CHECKLIST: ChecklistItem[] = [
  { status: 'included', label: 'Posts and pages' },
  { status: 'included', label: 'Images and files' },
  { status: 'included', label: 'Site settings' },
  { status: 'optional', label: 'Themes and routes' },
  { status: 'optional', label: 'Staff (locked)' },
  { status: 'excluded', label: 'Private-site code' },
  { status: 'excluded', label: 'Members and newsletters' },
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
