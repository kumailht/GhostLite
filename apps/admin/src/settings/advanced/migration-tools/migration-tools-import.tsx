import React, { useState } from 'react';
import UniversalImportModal from './universal-import-modal';
import { Button } from '@tryghost/shade/components';
import { LucideIcon } from '@tryghost/shade/utils';
import { DialogPortal } from '@/settings/providers/dialog-portal';

const MigrationToolsImport: React.FC = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleImportContent = () => {
    setIsImportModalOpen(true);
  };

  const importers = [
    {
      icon: <LucideIcon.Import className="size-4" />,
      title: 'Universal import',
      onClick: handleImportContent,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 lg:grid-cols-3">
      {importers.map((importer) => (
        <Button
          key={importer.title}
          className="h-9 font-semibold"
          type="button"
          variant="secondary"
          onClick={importer.onClick}
        >
          {importer.icon}
          {importer.title}
        </Button>
      ))}
      {isImportModalOpen && (
        <DialogPortal>
          <UniversalImportModal onClose={() => setIsImportModalOpen(false)} />
        </DialogPortal>
      )}
    </div>
  );
};

export default MigrationToolsImport;
