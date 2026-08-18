import type { ReactNode } from 'react';

export interface ModalSheetProps {
  title: string;
  children: ReactNode;
  open?: boolean;
}

export const ModalSheet = ({ title, children, open = false }: ModalSheetProps) => (
  <div style={{ display: open ? 'block' : 'none' }}>
    <h2>{title}</h2>
    {children}
  </div>
);
