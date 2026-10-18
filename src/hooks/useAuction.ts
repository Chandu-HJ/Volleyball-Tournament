import { useEffect, useMemo, useState } from 'react';
import type { AuctionRules, AuctionState, PlayerCategory } from '../models/auctionModels';
import { DEFAULT_RULES, getNextBid } from '../utility/bidRules';
import { clearAuction, loadAuction, saveAuction } from '../services/auctionStorage';

const colors = ['#F4B942', '#4CC9C0', '#E884A5', '#A88BEA', '#7FB3D5', '#E68A5C'];
export const emptyAuction: AuctionState = { rules: DEFAULT_RULES, teams: [], players: [], bids: [], phase: 'setup', activeCategory: 'All', currentPlayerId: null, currentBid: 0, highestBidderId: null, auctionRound: 1 };

export function useAuction() {
  const [state, setState] = useState<AuctionState>(() => ({ ...emptyAuction, ...(loadAuction() ?? {}), rules: { ...DEFAULT_RULES, ...(loadAuction()?.rules ?? {}) } }));
  const [message, setMessage] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => saveAuction(state), [state]);
  useEffect(() => { if (!message) return; const timer = window.setTimeout(() => setMessage(''), 3000); return () => window.clearTimeout(timer); }, [message]);

  const currentPlayer = state.players.find((player) => player.id === state.currentPlayerId) ?? null;
  const nextBid = getNextBid(state.currentBid, state.rules);
  const categoryPlayers = useMemo(() => state.players.filter((player) => state.activeCategory === 'All' || player.category === state.activeCategory), [state.players, state.activeCategory]);
  const remaining = categoryPlayers.filter((player) => player.status === 'available');

  function addTeams(names: string[]) {
    setState((old) => ({ ...old, teams: [...old.teams, ...names.map((name, index) => ({ id: crypto.randomUUID(), name, logo: '', color: colors[(old.teams.length + index) % colors.length], points: old.rules.budgetPerTeam, playerIds: [] }))] }));
    setMessage(`${names.length} team${names.length === 1 ? '' : 's'} added.`);
  }

  function addPlayers(names: string[], category: PlayerCategory) {
    setState((old) => ({ ...old, players: [...old.players, ...names.map((name) => ({ id: crypto.randomUUID(), name, category, status: 'available' as const }))] }));
    setMessage(`${names.length} player${names.length === 1 ? '' : 's'} added.`);
  }

  function updateRules(changes: Partial<AuctionRules>) {
    setState((old) => ({ ...old, rules: { ...old.rules, ...changes }, teams: old.phase === 'setup' ? old.teams.map((team) => ({ ...team, points: changes.budgetPerTeam ?? old.rules.budgetPerTeam, playerIds: [] })) : old.teams }));
    setMessage('Auction rules updated.');
  }

  function importAuction(value: unknown) {
    const payload = value as { state?: Partial<AuctionState> } & Partial<AuctionState>;
    const imported = payload.state ?? payload;
    if (!Array.isArray(imported.teams) || !Array.isArray(imported.players) || !imported.rules) { setMessage('This backup file is not a valid VolleyBid backup.'); return; }
    setState({ ...emptyAuction, ...imported, rules: { ...DEFAULT_RULES, ...imported.rules }, teams: imported.teams, players: imported.players, bids: imported.bids ?? [] } as AuctionState);
    setSelectedTeamId(null);
    setMessage('Auction backup imported successfully.');
  }

  function updateTeam(teamId: string, changes: Pick<AuctionState['teams'][number], 'name' | 'logo' | 'color'>) {
    setState((old) => ({ ...old, teams: old.teams.map((team) => team.id === teamId ? { ...team, ...changes } : team) }));
    setMessage('Team details updated.');
  }

  function addCaptain(teamId: string, name: string, profilePic?: string) {
    const team = state.teams.find((item) => item.id === teamId);
    if (!team || !name.trim()) return;
    const playerId = crypto.randomUUID();
    const captain = { id: playerId, name: name.trim(), category: 'Captain' as const, status: 'sold' as const, soldTo: teamId, soldPrice: 0, auctionRound: state.auctionRound, profilePic, isCaptain: true };
    setState((old) => ({ ...old, teams: old.teams.map((item) => item.id === teamId ? { ...item, playerIds: [...item.playerIds, playerId] } : item), players: [...old.players, captain] }));
    setMessage(`${name.trim()} added as captain of ${team.name}.`);
  }

  function updatePlayer(playerId: string, changes: Pick<AuctionState['players'][number], 'name' | 'profilePic'>) {
    setState((old) => ({ ...old, players: old.players.map((player) => player.id === playerId ? { ...player, ...changes } : player) }));
    setMessage('Player details updated.');
  }

  function deletePlayer(playerId: string) {
    const player = state.players.find((item) => item.id === playerId);
    if (!player) return;
    if (state.currentPlayerId === playerId) { setMessage('Finish or remove this player from the current auction first.'); return; }
    setState((old) => ({ ...old, players: old.players.filter((item) => item.id !== playerId), teams: old.teams.map((team) => team.id === player.soldTo ? { ...team, points: team.points + (player.soldPrice ?? 0), playerIds: team.playerIds.filter((id) => id !== playerId) } : { ...team, playerIds: team.playerIds.filter((id) => id !== playerId) }), bids: old.bids.filter((bid) => bid.playerId !== playerId) }));
    setMessage(`${player.name} deleted.`);
  }

  function selectPlayerForAuction(playerId: string) {
    const player = state.players.find((item) => item.id === playerId);
    if (!player || player.status !== 'available') { setMessage('Only available players can be selected for auction.'); return; }
    setSelectedTeamId(null);
    setState((old) => ({ ...old, phase: 'auction', activeCategory: player.category === 'Captain' ? 'All' : player.category, currentPlayerId: playerId, currentBid: 0, highestBidderId: null }));
    setMessage(`${player.name} is ready for auction.`);
  }

  function reopenSoldPlayer(playerId: string, mode: 'resume' | 'fresh') {
    const player = state.players.find((item) => item.id === playerId);
    if (!player || player.status !== 'sold' || player.isCaptain || !player.soldTo) { setMessage('Only regular sold players can be reopened.'); return; }
    const originalTeamId = player.soldTo;
    const originalPrice = player.soldPrice ?? 0;
    setSelectedTeamId(mode === 'resume' ? originalTeamId : null);
    setState((old) => ({ ...old, phase: 'auction', activeCategory: player.category === 'Captain' ? 'All' : player.category, teams: old.teams.map((team) => team.id === originalTeamId ? { ...team, points: team.points + originalPrice, playerIds: team.playerIds.filter((id) => id !== playerId) } : team), players: old.players.map((item) => item.id === playerId ? { ...item, status: 'available' as const, soldTo: undefined, soldPrice: undefined } : item), currentPlayerId: playerId, currentBid: mode === 'resume' ? originalPrice : 0, highestBidderId: mode === 'resume' ? originalTeamId : null }));
    setMessage(mode === 'resume' ? `${player.name} resumed from ${originalPrice} points.` : `${player.name} returned to a fresh auction.`);
  }

  function startAuction() {
    if (!state.teams.length || !state.players.length) { setMessage('Add at least one team and one player first.'); return; }
    setSelectedTeamId(null);
    setState((old) => ({ ...old, phase: 'auction', paused: false, activeCategory: old.activeCategory === 'All' ? 'Passer / Setter' : old.activeCategory, currentPlayerId: null, currentBid: 0, highestBidderId: null }));
  }

  function pauseAuction() {
    if (state.phase !== 'auction') return;
    setSelectedTeamId(null);
    setState((old) => ({ ...old, phase: 'setup', paused: true }));
    setMessage('Auction paused. You can resume it from Setup.');
  }

  function resumeAuction() {
    if (!state.teams.length || !state.players.length) { setMessage('Add at least one team and one player first.'); return; }
    setState((old) => ({ ...old, phase: 'auction', paused: false, activeCategory: old.activeCategory === 'All' ? 'Passer / Setter' : old.activeCategory }));
    setMessage('Auction resumed.');
  }

  function selectCategory(category: PlayerCategory | 'All') {
    if (state.currentPlayerId) { setMessage('Finish the current player before switching categories.'); return; }
    setSelectedTeamId(null);
    setState((old) => ({ ...old, activeCategory: category, currentPlayerId: null, currentBid: 0, highestBidderId: null }));
  }

  function selectNextPlayer() {
    const player = remaining[0];
    if (!player) { setMessage('No available players remain in this category.'); return; }
    setSelectedTeamId(null);
    setState((old) => ({ ...old, currentPlayerId: player.id, currentBid: 0, highestBidderId: null }));
  }

  function placeBid(teamId: string) {
    if (!currentPlayer) { setMessage('Select the next player first.'); return; }
    const team = state.teams.find((item) => item.id === teamId);
    if (!team) return;
    if (team.points < nextBid) { setMessage(`${team.name} has only ${team.points} points. Next bid is ${nextBid}.`); return; }
    const bid: AuctionState['bids'][number] = { id: crypto.randomUUID(), playerId: currentPlayer.id, playerName: currentPlayer.name, teamId, teamName: team.name, amount: nextBid, category: currentPlayer.category, createdAt: new Date().toISOString() };
    setSelectedTeamId(teamId);
    setState((old) => ({ ...old, currentBid: nextBid, highestBidderId: teamId, bids: [bid, ...old.bids] }));
  }

  function completePlayer(status: 'sold' | 'unsold') {
    if (!currentPlayer) { setMessage('Select a player first.'); return; }
    if (status === 'sold' && !state.highestBidderId) { setMessage('There is no winning bid for this player.'); return; }
    const winningTeam = state.teams.find((team) => team.id === state.highestBidderId);
    if (status === 'sold' && (!winningTeam || winningTeam.points < state.currentBid)) { setMessage('The winning team cannot afford this bid.'); return; }
    setState((old) => ({
      ...old,
      teams: old.teams.map((team) => team.id === old.highestBidderId && status === 'sold' ? { ...team, points: team.points - old.currentBid, playerIds: [...team.playerIds, currentPlayer.id] } : team),
      players: old.players.map((player) => player.id === currentPlayer.id ? { ...player, status, soldTo: status === 'sold' ? old.highestBidderId ?? undefined : undefined, soldPrice: status === 'sold' ? old.currentBid : undefined, auctionRound: old.auctionRound } : player),
      currentPlayerId: null,
      currentBid: 0,
      highestBidderId: null
    }));
    setSelectedTeamId(null);
    setMessage(status === 'sold' ? `${currentPlayer.name} sold to ${winningTeam?.name}.` : `${currentPlayer.name} marked unsold.`);
  }

  function startUnsoldAuction() {
    const unsold = state.players.some((player) => player.status === 'unsold');
    if (!unsold) { setMessage('There are no unsold players.'); return; }
    setState((old) => ({ ...old, phase: 'auction', players: old.players.map((player) => player.status === 'unsold' ? { ...player, status: 'available' as const, soldTo: undefined, soldPrice: undefined } : player), activeCategory: 'All', currentPlayerId: null, currentBid: 0, highestBidderId: null, auctionRound: old.auctionRound + 1 }));
    setMessage('Unsold auction is ready.');
  }

  function makePlayerAvailable(playerId: string) {
    setState((old) => ({ ...old, players: old.players.map((player) => player.id === playerId && player.status === 'unsold' ? { ...player, status: 'available' as const, soldTo: undefined, soldPrice: undefined } : player) }));
    setMessage('Player is available for auction again.');
  }

  function makeAllUnsoldAvailable() {
    const count = state.players.filter((player) => player.status === 'unsold').length;
    if (!count) { setMessage('There are no unsold players.'); return; }
    setState((old) => ({ ...old, players: old.players.map((player) => player.status === 'unsold' ? { ...player, status: 'available' as const, soldTo: undefined, soldPrice: undefined } : player) }));
    setMessage(`${count} unsold player${count === 1 ? '' : 's'} returned to the available list.`);
  }

  function allocatePlayer(playerId: string, teamId: string) {
    const player = state.players.find((item) => item.id === playerId);
    const team = state.teams.find((item) => item.id === teamId);
    if (!player || player.status !== 'available' || !team) return;
    if (team.points < state.rules.basePrice) { setMessage(`${team.name} needs at least ${state.rules.basePrice} points to allocate this player.`); return; }
    const bid: AuctionState['bids'][number] = { id: crypto.randomUUID(), playerId, playerName: player.name, teamId, teamName: team.name, amount: state.rules.basePrice, category: player.category, createdAt: new Date().toISOString() };
    setState((old) => ({ ...old, teams: old.teams.map((item) => item.id === teamId ? { ...item, points: item.points - old.rules.basePrice, playerIds: [...item.playerIds, playerId] } : item), players: old.players.map((item) => item.id === playerId ? { ...item, status: 'sold' as const, soldTo: teamId, soldPrice: old.rules.basePrice, auctionRound: old.auctionRound } : item), bids: [bid, ...old.bids] }));
    setMessage(`${player.name} allocated to ${team.name} for ${state.rules.basePrice} points.`);
  }

  function resetAuction() {
    clearAuction(); setState(emptyAuction); setSelectedTeamId(null); setMessage('Auction reset.');
  }

  return { state, setState, message, currentPlayer, nextBid, categoryPlayers, remaining, selectedTeamId, addTeams, addPlayers, updateRules, importAuction, updateTeam, addCaptain, updatePlayer, deletePlayer, selectPlayerForAuction, reopenSoldPlayer, startAuction, pauseAuction, resumeAuction, selectCategory, selectNextPlayer, placeBid, completePlayer, startUnsoldAuction, makePlayerAvailable, makeAllUnsoldAvailable, allocatePlayer, resetAuction, basePrice: state.rules.basePrice };
}
