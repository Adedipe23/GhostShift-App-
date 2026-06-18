import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

export const DataTable = ({ columns, data, isLoading, error, onRowClick }) => {
  if (isLoading) return <div className="py-12"><LoadingSpinner /></div>;
  if (error) return <ErrorState message="Failed to load data" />;
  if (!data || data.length === 0) return <EmptyState title="No data found" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b dark:border-dark-border text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-dark-surface/50">
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-3 font-medium">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-dark-border">
          {data.map((row, i) => (
            <tr 
              key={row.id || i} 
              onClick={() => onRowClick?.(row)}
              className={`group transition-colors ${onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-dark-surface/50' : ''}`}
            >
              {columns.map((col, j) => (
                <td key={j} className="px-4 py-3 text-sm text-slate-900 dark:text-slate-300">
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
