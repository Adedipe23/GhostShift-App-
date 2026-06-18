import { useState } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { useShifts } from '../../hooks/useShifts';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const statusVariant = {
  SCHEDULED: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
  IN_PROGRESS: 'warning',
};

const MySchedulePage = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const { data: shiftsData, isLoading } = useShifts();

  const shifts = shiftsData?.results || shiftsData || [];

  const weekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getShiftsForDay = (day) =>
    shifts.filter((s) => isSameDay(new Date(s.start_time), day));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Schedule</h1>
          <p className="text-slate-500 dark:text-slate-400">Your week at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((o) => o - 1)}>
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[160px] text-center">
            {format(weekStart, 'MMM d')} – {format(days[6], 'MMM d, yyyy')}
          </span>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((o) => o + 1)}>
            <ChevronRight size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>
            Today
          </Button>
        </div>
      </div>

      {/* Weekly Grid */}
      <Card className="!p-0 overflow-x-auto">
        <div className="grid grid-cols-7 border-b dark:border-dark-border min-w-[700px]">
          {days.map((day) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={`p-3 text-center border-r last:border-r-0 dark:border-dark-border ${
                  isToday ? 'bg-brand-50 dark:bg-brand-900/20' : ''
                }`}
              >
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {format(day, 'EEE')}
                </p>
                <p
                  className={`text-lg font-bold mt-0.5 ${
                    isToday
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {format(day, 'd')}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-7 min-w-[700px]">
          {days.map((day) => {
            const dayShifts = getShiftsForDay(day);
            return (
              <div
                key={day.toISOString()}
                className="border-r last:border-r-0 dark:border-dark-border min-h-[200px] p-2 space-y-2"
              >
                {dayShifts.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-600 text-center mt-4">
                    No shifts
                  </p>
                ) : (
                  dayShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 p-2 cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
                    >
                      <p className="text-xs font-semibold text-brand-700 dark:text-brand-300 truncate">
                        {shift.title}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock size={10} className="text-brand-500" />
                        <p className="text-xs text-brand-600 dark:text-brand-400">
                          {format(new Date(shift.start_time), 'h:mm a')}
                        </p>
                      </div>
                      <Badge variant={statusVariant[shift.status] || 'neutral'} className="mt-1.5 text-[10px]">
                        {shift.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* List View */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-brand-500" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">This Week's Shifts</h2>
        </div>
        {shifts.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm">No shifts scheduled for this week.</p>
        ) : (
          <div className="space-y-3">
            {shifts.map((shift) => (
              <div
                key={shift.id}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-dark-surface border dark:border-dark-border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{shift.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {format(new Date(shift.start_time), 'EEEE, MMM d · h:mm a')} –{' '}
                    {format(new Date(shift.end_time), 'h:mm a')}
                  </p>
                  {shift.location && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">📍 {shift.location}</p>
                  )}
                </div>
                <Badge variant={statusVariant[shift.status] || 'neutral'}>{shift.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default MySchedulePage;
