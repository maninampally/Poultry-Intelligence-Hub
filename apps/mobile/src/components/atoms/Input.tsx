export interface InputProps {
  value?: string;
  placeholder?: string;
}

export const Input = ({ value = '', placeholder = '' }: InputProps) => (
  <input value={value} placeholder={placeholder} readOnly />
);
