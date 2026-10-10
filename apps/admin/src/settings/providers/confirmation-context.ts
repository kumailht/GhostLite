import { type ConfirmationModalProps } from '@/settings/components/confirmation-modal';
import { createContext, useContext } from 'react';

export type ConfirmationHandle = { remove: () => void };

export type ConfirmationContextType = {
  confirm: (props: ConfirmationModalProps) => ConfirmationHandle;
};

export const ConfirmationContext = createContext<ConfirmationContextType | null>(null);

export function useConfirmation(): ConfirmationContextType {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used inside ConfirmationProvider');
  }
  return context;
}
