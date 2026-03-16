import { useMemo, useState } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { formatAppDate } from '@/lib/i18n';
import { useNavigate } from '@/lib/router';
import { StatsView } from './components/StatsView';

export function Stats() {
  const navigate = useNavigate();
  const { allHabits, getHabitStats } = useHabits();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allHabits.forEach((h) => (h.tags || []).forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [allHabits]);

  const filteredHabits = useMemo(() => {
    return allHabits.filter((h) => {
      if (statusFilter === 'active' && h.archived) {return false;}
      if (statusFilter === 'archived' && !h.archived) {return false;}
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!h.name.toLowerCase().includes(query) && !h.description.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (selectedTags.length > 0 && !(h.tags || []).some((t) => selectedTags.includes(t))) {
        return false;
      }
      return true;
    });
  }, [allHabits, statusFilter, searchQuery, selectedTags]);

  const allStats = useMemo(
    () => filteredHabits.map((h) => ({ habit: h, stats: getHabitStats(h.id) })),
    [filteredHabits, getHabitStats]
  );

  const dailyData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const key = date.toISOString().split('T')[0];
      const completed = filteredHabits.filter((h) => (h.completions[key] ?? 0) >= Math.max(1, h.dailyTarget ?? 1)).length;
      return {
        day: formatAppDate(date, { month: 'short', day: 'numeric' }),
        completed,
        total: filteredHabits.length,
        rate: filteredHabits.length > 0 ? Math.round((completed / filteredHabits.length) * 100) : 0
      };
    });
  }, [filteredHabits]);

  const habitMonthlyData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    return Array.from({ length: 6 }, (_, m) => {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - (5 - m), 1);
      const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
      const entry: Record<string, string | number> = { month: monthNames[monthDate.getMonth()] };

      filteredHabits.forEach((h) => {
        let completed = 0;
        for (let d = 1; d <= daysInMonth; d++) {
          const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
          if (date > today) {break;}
          const key = date.toISOString().split('T')[0];
          if ((h.completions[key] ?? 0) >= Math.max(1, h.dailyTarget ?? 1)) {completed++;}
        }
        const daysElapsed = monthDate.getMonth() === today.getMonth() ? today.getDate() : daysInMonth;
        entry[h.name] = Math.round((completed / Math.max(1, daysElapsed)) * 100);
      });

      return entry;
    });
  }, [filteredHabits]);

  const sorted = [...allStats].sort((a, b) => b.stats.completionRate - a.stats.completionRate);
  const totalCompletions = allStats.reduce((sum, { stats }) => sum + stats.completedDays, 0);
  const avgRate =
    allStats.length > 0
      ? Math.round(allStats.reduce((sum, { stats }) => sum + stats.completionRate, 0) / allStats.length)
      : 0;
  const bestStreak = Math.max(...allStats.map(({ stats }) => stats.longestStreak), 0);
  const currentStreaks = allStats.reduce((sum, { stats }) => sum + (stats.currentStreak > 0 ? 1 : 0), 0);

  // Best/Worst Weekday & Investment
  const weekdayStats = useMemo(() => {
    const counts = Array(7).fill(0);
    const allUniqueActiveDays = new Set<string>();

    allHabits.forEach(h => {
      Object.keys(h.completions).forEach(dateStr => {
        if ((h.completions[dateStr] ?? 0) >= Math.max(1, h.dailyTarget ?? 1)) {
          const d = new Date(dateStr);
          const day = d.getDay(); // 0 = Sun
          counts[day]++;
          allUniqueActiveDays.add(dateStr);
        }
      });
    });

    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let best = 1;
    let worst = 1;
    for (let i = 0; i < 7; i++) {
        if (counts[i] > counts[best]) {best = i;}
        if (counts[i] < counts[worst] && counts[i] > 0) {worst = i;}
    }

    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const daysSinceYearStart = Math.ceil((new Date().getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
    const investmentPercent = Math.round((allUniqueActiveDays.size / Math.max(1, daysSinceYearStart)) * 100);

    return {
      bestWeekday: counts[best] > 0 ? weekdayNames[best] : 'N/A',
      worstWeekday: counts[worst] > 0 ? weekdayNames[worst] : 'N/A',
      investmentPercent,
      totalActiveDays: allUniqueActiveDays.size
    };
  }, [allHabits]);

  const globalActivityData = useMemo(() => {
    const data: Array<{ date: string; intensity: number }> = [];
    const now = new Date();
    // 12 weeks back (84 days)
    for (let i = 83; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const intensity = allHabits.filter(h => (h.completions[key] ?? 0) >= Math.max(1, h.dailyTarget ?? 1)).length;
      data.push({ date: key, intensity });
    }
    return data;
  }, [allHabits]);

  const frozenDates = useMemo(() => {
    const frozen = new Set<string>();
    allHabits.forEach(h => {
      (h.freezeDays ?? []).forEach(dateStr => {
        frozen.add(dateStr);
      });
    });
    return frozen;
  }, [allHabits]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  return (
    <StatsView
      navigate={navigate}
      avgRate={avgRate}
      bestStreak={bestStreak}
      totalCompletions={totalCompletions}
      currentStreaks={currentStreaks}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      allTags={allTags}
      selectedTags={selectedTags}
      toggleTag={toggleTag}
      dailyData={dailyData}
      habitMonthlyData={habitMonthlyData}
      filteredHabits={filteredHabits}
      sorted={sorted}
      allStats={allStats}
      bestWeekday={weekdayStats.bestWeekday}
      worstWeekday={weekdayStats.worstWeekday}
      investmentPercent={weekdayStats.investmentPercent}
      totalActiveDays={weekdayStats.totalActiveDays}
      globalActivityData={globalActivityData}
      frozenDates={frozenDates}
    />
  );
}
