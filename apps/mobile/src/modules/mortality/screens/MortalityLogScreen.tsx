import { useState, type ReactNode } from 'react';
import { Button } from '../../../components/atoms/Button';
import { FormField } from '../../../components/molecules/FormField';
import { PageLayout } from '../../../components/templates/PageLayout';
import { MortalityService } from '../mortality.service';

const defaultDraft = {
  batchId: 'batch-1',
  shedId: 'shed-1',
  count: 3,
  cause: 'unknown',
};

export const MortalityLogScreen = (): ReactNode => {
  const [draft, setDraft] = useState(defaultDraft);
  const [message, setMessage] = useState('');

  const onSubmit = () => {
    const saved = MortalityService.create({
      batchId: draft.batchId,
      shedId: draft.shedId,
      count: draft.count,
      cause: draft.cause as 'unknown',
    });

    setMessage(`Saved mortality record ${saved.id.slice(0, 8)}`);
    setDraft(defaultDraft);
  };

  return (
    <PageLayout title="Mortality log">
      <FormField label="Batch ID">
        <input
          value={draft.batchId}
          onChange={(event) => setDraft((current) => ({ ...current, batchId: event.target.value }))}
          placeholder="Batch"
        />
      </FormField>
      <FormField label="Shed ID">
        <input
          value={draft.shedId}
          onChange={(event) => setDraft((current) => ({ ...current, shedId: event.target.value }))}
          placeholder="Shed"
        />
      </FormField>
      <FormField label="Count">
        <input
          type="number"
          value={draft.count}
          onChange={(event) => setDraft((current) => ({ ...current, count: Number(event.target.value) }))}
        />
      </FormField>
      <FormField label="Cause">
        <select
          value={draft.cause}
          onChange={(event) => setDraft((current) => ({ ...current, cause: event.target.value }))}
        >
          <option value="unknown">Unknown</option>
          <option value="respiratory">Respiratory</option>
          <option value="heat">Heat stress</option>
          <option value="ascites">Ascites</option>
        </select>
      </FormField>
      <Button label="Save mortality entry" onPress={onSubmit} />
      {message ? <p>{message}</p> : null}
    </PageLayout>
  );
};
