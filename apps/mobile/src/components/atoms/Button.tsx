export interface ButtonProps {
  label: string;
  onPress?: () => void;
}

export const Button = ({ label, onPress }: ButtonProps) => (
  <button type="button" onClick={onPress}>
    {label}
  </button>
);
