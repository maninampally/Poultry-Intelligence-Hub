import type { ReactNode } from 'react';

export interface FormFieldProps {
  label: string;
  children: ReactNode;
}

export const FormField = ({ label, children }: FormFieldProps) => (
  <label>
    <span>{label}</span>
    {children}
  </label>
);
