// Zone (team area) color lookup with a neutral fallback.

import type { Team, TeamId } from '@/types';

export function zoneColorFor(teamId: TeamId, teams: Team[]): string {
  return teams.find((team) => team.id === teamId)?.color ?? '#cccccc';
}
