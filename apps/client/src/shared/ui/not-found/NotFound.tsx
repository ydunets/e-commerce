import { Button } from '@/shared/ui/button';
import { ERROR_SCREEN_LAYOUT, ErrorScreen } from '@/shared/ui/error-screen';

export const NotFound = () => (
  <div className={ERROR_SCREEN_LAYOUT}>
    <ErrorScreen
      title="Page not found"
      description="The page you asked for does not exist, or it has been moved."
      action={
        <Button variant="primary" href="/">
          Back to the store
        </Button>
      }
    />
  </div>
);
