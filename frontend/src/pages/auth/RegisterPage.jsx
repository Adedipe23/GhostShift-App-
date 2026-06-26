import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Activity } from 'lucide-react';

import { useRegister } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

const schema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const { mutate: registerUser, isPending } = useRegister();
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => {
    setErrorMsg('');
    registerUser(data, {
      onSuccess: () => {
        navigate('/login', { state: { message: 'Registration successful. Please log in.' } });
      },
      onError: (err) => {
        // Handle DRF validation errors
        const errData = err.response?.data;
        if (typeof errData === 'object' && errData !== null) {
          const firstKey = Object.keys(errData)[0];
          setErrorMsg(errData[firstKey]?.[0] || 'Registration failed.');
        } else {
          setErrorMsg('An error occurred during registration.');
        }
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-brand dark:bg-gradient-dark py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-4 shadow-glow">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Create an account</h1>
          <p className="text-white/70 mt-2">Join GhostShift to manage your work</p>
        </div>

        <Card className="!p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {errorMsg && (
              <div className="p-3 text-sm rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                placeholder="Jane"
                {...register('first_name')}
                error={errors.first_name?.message}
              />
              <Input
                label="Last name"
                placeholder="Doe"
                {...register('last_name')}
                error={errors.last_name?.message}
              />
            </div>

            <Input
              label="Email address"
              type="email"
              placeholder="you@company.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              {...register('confirm_password')}
              error={errors.confirm_password?.message}
            />

            <Button type="submit" className="w-full" isLoading={isPending}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-600 dark:text-brand-400 hover:text-brand-500">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
