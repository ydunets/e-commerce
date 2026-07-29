import { useFormStatus } from 'react-dom';
import { Button } from '@/shared/ui/button';

// Must render as a descendant of the <form>, not the component that owns
// it: useFormStatus only reports the status of the nearest parent form.
export const SubscribeButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      Subscribe
    </Button>
  );
};
