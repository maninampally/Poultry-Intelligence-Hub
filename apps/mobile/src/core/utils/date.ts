export const formatDateForDisplay = (value: string | Date): string => {
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toISOString().slice(0, 10);
};
