import { useState } from 'react';
import { User, Mail, Shield, Building2, Edit2, Save, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUpdateProfile } from '../hooks/useUsers';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

const roleVariant = {
  EMPLOYEE: 'primary',
  MANAGER: 'warning',
  HR: 'success',
  ADMIN: 'error',
};

const ProfilePage = () => {
  const { user } = useAuthStore();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    updateProfile(form, {
      onSuccess: () => setIsEditing(false),
      onError: (err) => setError(err?.response?.data?.detail || 'Failed to update profile.'),
    });
  };

  const handleCancel = () => {
    setForm({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
    });
    setIsEditing(false);
    setError('');
  };

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your personal information and account settings.</p>
      </div>

      {/* Avatar & Identity */}
      <Card>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
              {user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.email}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={roleVariant[user?.role] || 'neutral'}>{user?.role}</Badge>
              {user?.department_name && (
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Building2 size={12} /> {user.department_name}
                </span>
              )}
            </div>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="flex items-center gap-2">
              <Edit2 size={14} /> Edit
            </Button>
          )}
        </div>
      </Card>

      {/* Edit Form / Details */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Personal Information</h3>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                placeholder="John"
              />
              <Input
                label="Last Name"
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                placeholder="Doe"
              />
            </div>
            <Input
              label="Email Address"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={handleCancel} className="flex items-center gap-2">
                <X size={14} /> Cancel
              </Button>
              <Button type="submit" isLoading={isPending} className="flex items-center gap-2">
                <Save size={14} /> Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {[
              { icon: User, label: 'Full Name', value: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : '—' },
              { icon: Mail, label: 'Email', value: user?.email || '—' },
              { icon: Shield, label: 'Role', value: user?.role || '—' },
              { icon: Building2, label: 'Department', value: user?.department_name || '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-dark-surface border dark:border-dark-border">
                <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Account Info */}
      <Card>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Account</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-dark-surface border dark:border-dark-border">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Change Password</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Contact your admin to reset your password.</p>
            </div>
            <Shield size={16} className="text-slate-400" />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
