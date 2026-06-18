import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';

const ForgotPasswordPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-brand dark:bg-gradient-dark">
      <div className="w-full max-w-md">
        <Card className="text-center !p-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Forgot Password</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Please contact your HR administrator to reset your password.
          </p>
          <Link to="/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
            Return to login
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
