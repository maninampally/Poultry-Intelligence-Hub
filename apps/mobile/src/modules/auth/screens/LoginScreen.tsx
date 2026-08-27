import { useState, type ReactNode } from 'react';
import { Button } from '../../../components/atoms/Button';
import { FormField } from '../../../components/molecules/FormField';
import { PageLayout } from '../../../components/templates/PageLayout';
import { AuthService } from '../auth.service';

export const LoginScreen = (): ReactNode => {
  const [phone, setPhone] = useState('+919876543210');
  const [message, setMessage] = useState('');

  const onSubmit = async () => {
    try {
      await AuthService.requestOtp(phone);
      setMessage('OTP sent. Check your phone.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send OTP');
    }
  };

  return (
    <PageLayout title="Login">
      <FormField label="Phone number">
        <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" />
      </FormField>
      <Button label="Send OTP" onPress={onSubmit} />
      {message ? <p>{message}</p> : null}
    </PageLayout>
  );
};
