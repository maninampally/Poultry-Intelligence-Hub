export interface BadgeProps {
  label: string;
}

export const Badge = ({ label }: BadgeProps) => <span>{label}</span>;
