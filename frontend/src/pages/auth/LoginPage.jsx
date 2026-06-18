import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Activity, Lock, Mail } from 'lucide-react';

import { useLogin } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const { mutate: login, isPending } = useLogin();
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => {
    setErrorMsg('');
    login(data, {
      onSuccess: (res) => {
        const rolePaths = {
          EMPLOYEE: '/dashboard/employee',
          MANAGER: '/dashboard/manager',
          HR: '/dashboard/hr',
          ADMIN: '/dashboard/admin',
        };
        navigate(rolePaths[res.user.role] || '/dashboard/employee');
      },
      onError: (err) => {
        setErrorMsg(err.response?.data?.detail || 'Invalid email or password.');
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-brand dark:bg-gradient-dark">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-4 shadow-glow">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-white/70 mt-2">Sign in to your GhostShift account</p>
        </div>

        <Card className="!p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {errorMsg && (
              <div className="p-3 text-sm rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <Input
                label="Email address"
                type="email"
                placeholder="you@company.com"
                {...register('email')}
                error={errors.email?.message}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link to="/forgot-password" className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-500">
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                error={errors.password?.message}
              />
            </div>

            <Button type="submit" className="w-full" isLoading={isPending}>
              Sign in to dashboard
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-brand-600 dark:text-brand-400 hover:text-brand-500">
              Sign up
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
