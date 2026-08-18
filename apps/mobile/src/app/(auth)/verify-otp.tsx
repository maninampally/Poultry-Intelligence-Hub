import { useState, type ReactNode } from 'react';
import { Button } from '../../components/atoms/Button';
import { FormField } from '../../components/molecules/FormField';
import { PageLayout } from '../../components/templates/PageLayout';
import { AuthService } from '../../modules/auth/auth.service';

export default function VerifyOtpRoute(): ReactNode {
  const [otp, setOtp] = useState('123456');
  const [message, setMessage] = useState('');

  const onSubmit = async () => {
    try {
      const session = await AuthService.verifyOtp({ phone: '+91 98765 43210', otp });
      setMessage(`Signed in as ${session.user.name}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Verification failed');
    }
  };

  return (
    <PageLayout title="Verify OTP">
      <FormField label="OTP">
        <input value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="123456" />
      </FormField>
      <Button label="Verify" onPress={onSubmit} />
      {message ? <p>{message}</p> : null}
    </PageLayout>
  );
}
