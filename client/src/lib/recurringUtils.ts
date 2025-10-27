export type RecurrencePattern = 'none' | 'weekly' | 'monthly' | 'quarterly' | 'semi-annual' | 'yearly';

export function calculateNextDate(
  baseDate: Date,
  pattern: RecurrencePattern,
  interval: number = 1
): Date | null {
  if (pattern === 'none') return null;
  
  const nextDate = new Date(baseDate);
  
  switch (pattern) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + (7 * interval));
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + (3 * interval));
      break;
    case 'semi-annual':
      nextDate.setMonth(nextDate.getMonth() + (6 * interval));
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + interval);
      break;
  }
  
  return nextDate;
}

export function generateUpcomingDates(
  startDate: Date,
  pattern: RecurrencePattern,
  interval: number = 1,
  count: number = 5
): Date[] {
  if (pattern === 'none') return [];
  
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  
  for (let i = 0; i < count; i++) {
    const nextDate = calculateNextDate(currentDate, pattern, interval);
    if (!nextDate) break;
    dates.push(nextDate);
    currentDate = nextDate;
  }
  
  return dates;
}

export function getRecurrencePatternLabel(pattern: RecurrencePattern, interval: number = 1): string {
  const intervalText = interval > 1 ? `${interval} ` : '';
  
  switch (pattern) {
    case 'weekly':
      return `Every ${intervalText}${interval > 1 ? 'weeks' : 'week'}`;
    case 'monthly':
      return `Every ${intervalText}${interval > 1 ? 'months' : 'month'}`;
    case 'quarterly':
      return `Every ${intervalText}${interval > 1 ? 'quarters' : 'quarter'}`;
    case 'semi-annual':
      return `Every ${intervalText}6 months`;
    case 'yearly':
      return `Every ${intervalText}${interval > 1 ? 'years' : 'year'}`;
    default:
      return 'One-time';
  }
}
