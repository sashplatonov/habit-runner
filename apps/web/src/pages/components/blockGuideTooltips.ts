export const OVERVIEW_SIGNALS_TOOLTIP = {
  title: 'Overview signals',
  summary: 'These cards summarize the current period at a glance, so you can judge consistency, streak quality, and total output before diving into charts.',
  focusPoints: [
    'Avg rate: overall reliability in the selected window.',
    'Best streak and active count: whether momentum is concentrated or broad.',
    'Total completions: raw execution volume for the same period.'
  ],
  variant: 'columns' as const
};

export const YOUR_INVESTMENT_TOOLTIP = {
  title: 'Your investment',
  summary: 'This block shows how much of the selected period contains meaningful activity, so you can judge whether your effort is spread across the calendar or bunched into a few bursts.',
  focusPoints: [
    'Percent: share of active days in the current window.',
    'Best and worst days: recurring timing patterns worth using or fixing.',
    'Active days count: whether repetition is building enough surface area.'
  ],
  variant: 'bars' as const
};

export const INSIGHTS_TOOLTIP = {
  title: 'Insights',
  summary: 'These cards turn the current stats window into short interpretations, so you can spot the main story without reading every chart manually.',
  focusPoints: [
    'Use them as cues, not absolutes: they summarize the strongest pattern in view.',
    'Compare the message with charts below to confirm what changed.',
    'If one insight repeats across periods, it is probably a real behavior shift.'
  ],
  variant: 'columns' as const
};

export const TARGET_STREAK_TOOLTIP = {
  title: 'Target streak',
  summary: 'This block compares your live streak against the goal you set for this habit, so you can see how close you are to the next milestone.',
  focusPoints: [
    'Progress bar: distance between current rhythm and target.',
    'Current versus target days: simple milestone tracking.',
    'Use this block to decide whether the goal is realistic or needs adjusting.'
  ],
  variant: 'line' as const
};
