export const QUERY_KEYS = {
  runByUserId: (userId?: string | null) => ['runs', 'by-user', userId] as const,
  runById: (runId?: string | null) => ['runs', 'by-id', runId] as const,
  waitlistByRun: (runId?: string | null) => ['runs', 'waitlist', runId] as const,
  isCheckedIn: (runId?: string | null) => ['runs', 'checked-in', runId] as const,
  nextRuns: ['runs', 'next'] as const,
  runs: ['runs'] as const,
  runsWithPagination: ['runs', 'paginated'] as const,
};
