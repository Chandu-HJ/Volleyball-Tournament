import type { Match } from '../models/auctionModels';

export type MatchStage = 'normal' | 'notice' | 'oball' | 'gameball' | 'won';

export function getMatchStage(match: Match, teamId: string): MatchStage {
  const own = match.teamAId === teamId ? match.scoreA : match.scoreB;
  const target = match.targetPoints ?? 15;
  if (match.status === 'completed' && match.winnerId === teamId) return 'won';
  if (own >= target - 1) return 'gameball';
  if (own === target - 2) return 'oball';
  if (own === target - 3) return 'notice';
  return 'normal';
}

export function canWinMatch(match: Match, teamId: string): boolean {
  const own = match.teamAId === teamId ? match.scoreA : match.scoreB;
  const other = match.teamAId === teamId ? match.scoreB : match.scoreA;
  return own >= (match.targetPoints ?? 15) && own - other >= 2;
}

export function stageLabel(stage: MatchStage): string {
  return stage === 'notice' ? 'Notice ball' : stage === 'oball' ? 'O-ball' : stage === 'gameball' ? 'Game ball' : stage === 'won' ? 'Won' : '';
}
