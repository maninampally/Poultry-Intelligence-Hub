import type { ReactNode } from 'react';

export interface PageLayoutProps {
  title: string;
  children: ReactNode;
}

export const PageLayout = ({ title, children }: PageLayoutProps) => (
  <main>
    <h1>{title}</h1>
    {children}
  </main>
);
