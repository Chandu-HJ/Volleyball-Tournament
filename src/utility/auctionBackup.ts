import type { AuctionState } from '../models/auctionModels';

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportJsonBackup(state: AuctionState) {
  download(JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), state }, null, 2), `volleybid-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
}

function csvCell(value: unknown) { return `"${String(value ?? '').replace(/"/g, '""')}"`; }

export function exportCsvReport(state: AuctionState) {
  const rows: unknown[][] = [['Type', 'Name', 'Category', 'Status', 'Team', 'Price', 'Team Points Remaining']];
  state.players.forEach((player) => rows.push(['Player', player.name, player.category, player.status, state.teams.find((team) => team.id === player.soldTo)?.name ?? '', player.soldPrice ?? '', state.teams.find((team) => team.id === player.soldTo)?.points ?? '']));
  state.teams.forEach((team) => rows.push(['Team', team.name, '', `${team.playerIds.length} players`, team.name, state.players.filter((player) => player.soldTo === team.id).reduce((sum, player) => sum + (player.soldPrice ?? 0), 0), team.points]));
  state.matches.forEach((match) => rows.push(['Match', `Match ${match.order}`, match.status, `${match.scoreA}-${match.scoreB}`, `${state.teams.find((team) => team.id === match.teamAId)?.name ?? ''} vs ${state.teams.find((team) => team.id === match.teamBId)?.name ?? ''}`, match.winnerId ? state.teams.find((team) => team.id === match.winnerId)?.name ?? '' : '', match.targetPoints ?? '']));
  download(rows.map((row) => row.map(csvCell).join(',')).join('\n'), `volleybid-report-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
}
