import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-dark-bg text-center">
      <h1 className="text-6xl font-bold text-brand-600 dark:text-brand-500 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">Page Not Found</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/">
        <Button>Return to Dashboard</Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
