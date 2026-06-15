import { Card } from './Card';
import { cn } from '../../utils/cn';

export const StatCard = ({ title, value, icon: Icon, trend, className }) => {
  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
        {Icon && (
          <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg text-brand-600 dark:text-brand-400">
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-900 dark:text-white">{value}</span>
        {trend && (
          <span className={cn(
            "text-sm font-medium",
            trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}>
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </Card>
  );
};
