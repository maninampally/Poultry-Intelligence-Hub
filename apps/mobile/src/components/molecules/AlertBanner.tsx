export interface AlertBannerProps {
  message: string;
  variant?: 'info' | 'warning' | 'danger';
}

export const AlertBanner = ({ message, variant = 'info' }: AlertBannerProps) => (
  <div data-variant={variant}>{message}</div>
);
