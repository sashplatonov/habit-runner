import React, { useMemo, useState } from 'react';
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
    allHabits.forEach((h) => h.tags.forEach((t) => tags.add(t)));
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
      if (selectedTags.length > 0 && !selectedTags.some((t) => h.tags.includes(t))) {
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
    />
  );
}
