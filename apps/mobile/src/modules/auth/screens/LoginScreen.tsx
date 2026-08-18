import { useState, type ReactNode } from 'react';
import { Button } from '../../../components/atoms/Button';
import { FormField } from '../../../components/molecules/FormField';
import { PageLayout } from '../../../components/templates/PageLayout';
import { AuthService } from '../auth.service';

export const LoginScreen = (): ReactNode => {
  const [phone, setPhone] = useState('+91 98765 43210');
  const [message, setMessage] = useState('');

  const onSubmit = async () => {
    try {
      const otp = await AuthService.requestOtp(phone);
      setMessage(`OTP generated: ${otp}`);
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
