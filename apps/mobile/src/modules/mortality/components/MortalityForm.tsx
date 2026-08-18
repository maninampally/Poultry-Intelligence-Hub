import type { ReactNode } from 'react';
import { Button } from '../../../components/atoms/Button';
import { FormField } from '../../../components/molecules/FormField';

export interface MortalityFormProps {
  batchId: string;
  onBatchIdChange: (value: string) => void;
  count: number;
  onCountChange: (value: number) => void;
  onSubmit: () => void;
}

export const MortalityForm = ({
  batchId,
  onBatchIdChange,
  count,
  onCountChange,
  onSubmit,
}: MortalityFormProps): ReactNode => (
  <section>
    <FormField label="Batch ID">
      <input value={batchId} onChange={(event) => onBatchIdChange(event.target.value)} />
    </FormField>
    <FormField label="Count">
      <input
        type="number"
        value={count}
        onChange={(event) => onCountChange(Number(event.target.value))}
      />
    </FormField>
    <Button label="Submit" onPress={onSubmit} />
  </section>
);
