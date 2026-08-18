export interface StatusCardProps {
  title: string;
  value: string;
}

export const StatusCard = ({ title, value }: StatusCardProps) => (
  <section>
    <h3>{title}</h3>
    <strong>{value}</strong>
  </section>
);
