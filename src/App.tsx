import { useEffect, useState } from 'react';
import type { PlayerCategory } from './models/auctionModels';
import { useAuction } from './hooks/useAuction';
import { exportCsvReport, exportJsonBackup } from './utility/auctionBackup';
import SetupPage from './pages/SetupPage';
import TeamsPage from './pages/TeamsPage';
import PlayersPage from './pages/PlayersPage';
import MatchesPage from './pages/MatchesPage';
import GamePage from './pages/GamePage';
import StandingsPage from './pages/StandingsPage';
import AuctionPage from './components/AuctionPage';
import TeamDetails from './components/TeamDetails';
import ProfileMenu from './components/ProfileMenu';
import './styles.css';
type View = 'setup' | 'auction' | 'players' | 'teams' | 'matches' | 'game' | 'standings';
export default function App() {
  const auction = useAuction();
  useEffect(() => { const handleStartFinal = () => auction.startFinal(); window.addEventListener('volleybid:start-final', handleStartFinal); return () => window.removeEventListener('volleybid:start-final', handleStartFinal); }, [auction.startFinal]);
  const [view, setView] = useState<View>(auction.state.phase === 'setup' ? 'setup' : 'auction');
  const [setupTab, setSetupTab] = useState<'teams' | 'players' | 'rules'>('teams');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(auction.state.currentMatchId);
  const [teamMatchFilterId, setTeamMatchFilterId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const selectedTeam = auction.state.teams.find((team) => team.id === selectedTeamId);
  const selectedMatch = auction.state.matches.find((match) => match.id === selectedMatchId) ?? auction.state.matches.find((match) => match.status === 'live');
  const goAuction = () => { if (auction.state.paused) auction.resumeAuction(); else auction.startAuction(); if (auction.state.teams.length && auction.state.players.length) setView('auction'); };
  const goSetup = () => { if (auction.state.phase === 'auction') return; setView('setup'); };
  const resetAll = () => { auction.resetAuction(); setView('setup'); setSetupTab('teams'); setSelectedMatchId(null); };
  const addPlayers = (names: string[], category: PlayerCategory) => auction.addPlayers(names, category);
  const openMatch = (matchId: string) => { setSelectedMatchId(matchId); setView('game'); };
  const finishAuction = () => { auction.finishAuction(); setView('matches'); };
  return <div className="app"><header className="topbar"><div className="brand"><div className="brand-mark">&#9670;</div><div><div className="brand-name">VOLLEY<span>BID</span></div><small>AUCTION MANAGER</small></div></div><div className="topbar-right"><span className="saved-badge">&#8226; Saved locally</span><button className="avatar avatar-button" onClick={() => setProfileOpen(true)}>BM</button></div></header><div className="layout"><aside className="sidebar"><div className="season">LOCAL TOURNAMENT <span>2026</span></div><button className={`nav-button ${view === 'setup' ? 'active' : ''}`} onClick={goSetup} disabled={auction.state.phase === 'auction'}>Setup <b>{auction.state.teams.length + auction.state.players.length}</b></button><button className={`nav-button ${view === 'auction' ? 'active' : ''}`} onClick={() => setView('auction')}>Live auction</button><button className={`nav-button ${view === 'teams' ? 'active' : ''}`} onClick={() => setView('teams')}>Teams <b>{auction.state.teams.length}</b></button><button className={`nav-button ${view === 'players' ? 'active' : ''}`} onClick={() => setView('players')}>Players <b>{auction.state.players.length}</b></button><button className={`nav-button ${view === 'matches' || view === 'game' ? 'active' : ''}`} onClick={() => setView('matches')}>Matches <b>{auction.state.matches.length}</b></button><button className={`nav-button ${view === 'standings' ? 'active' : ''}`} onClick={() => setView('standings')}>Points table</button><div className="sidebar-bottom"><div className="sidebar-note">Tip<small>Match points and schedules are saved locally.</small></div></div></aside><main className="content">{view === 'setup' ? <SetupPage state={auction.state} setupTab={setupTab} setSetupTab={setSetupTab} onAddTeams={auction.addTeams} onAddPlayers={addPlayers} onUpdateRules={auction.updateRules} onStart={goAuction} /> : view === 'teams' ? <TeamsPage state={auction.state} onUpdateTeam={auction.updateTeam} onAddCaptain={auction.addCaptain} onViewMatches={(teamId) => { setTeamMatchFilterId(teamId); setView('matches'); }} /> : view === 'players' ? <PlayersPage state={auction.state} onMakeAvailable={auction.makePlayerAvailable} onMakeAllAvailable={auction.makeAllUnsoldAvailable} onAllocate={auction.allocatePlayer} onUpdatePlayer={auction.updatePlayer} onDeletePlayer={auction.deletePlayer} onSelectAuction={(playerId) => { auction.selectPlayerForAuction(playerId); setView('auction'); }} onResumeSold={(playerId, mode) => { auction.reopenSoldPlayer(playerId, mode); setView('auction'); }} onViewTeam={setSelectedTeamId} /> : view === 'matches' ? <MatchesPage state={auction.state} onPlayNow={auction.playMatchNow} onEditSchedule={auction.updateMatchSchedule} onReorder={auction.reorderMatch} onCancel={auction.cancelMatch} onOpenGame={openMatch} onSchedule={auction.scheduleMatches} onRematch={auction.rematch} teamFilterId={teamMatchFilterId} /> : view === 'game' ? <GamePage state={auction.state} match={selectedMatch} onStart={auction.startMatch} onEndFirstHalf={auction.endFirstHalf} onScore={auction.scoreMatch} onUndo={auction.undoMatchPoint} onBack={() => setView('matches')} /> : view === 'standings' ? <StandingsPage state={auction.state} /> : <AuctionPage auction={auction} onViewTeam={setSelectedTeamId} onFinish={finishAuction} />}</main></div><nav className="mobile-nav"><button className={view === 'auction' ? 'active' : ''} onClick={() => setView('auction')}><span>&#9670;</span><small>Auction</small></button><button className={view === 'teams' ? 'active' : ''} onClick={() => setView('teams')}><span>&#9635;</span><small>Teams</small></button><button className={view === 'players' ? 'active' : ''} onClick={() => setView('players')}><span>&#9813;</span><small>Players</small></button><button className={view === 'matches' || view === 'game' ? 'active' : ''} onClick={() => setView('matches')}><span>&#9776;</span><small>Matches</small></button><button className={view === 'standings' ? 'active' : ''} onClick={() => setView('standings')}><span>#</span><small>Table</small></button><button className={view === 'setup' ? 'active' : ''} onClick={goSetup} disabled={auction.state.phase === 'auction'}><span>&#9881;</span><small>Setup</small></button></nav>{selectedTeam && <TeamDetails team={selectedTeam} players={auction.state.players} onClose={() => setSelectedTeamId(null)} />}{profileOpen && <ProfileMenu onClose={() => setProfileOpen(false)} onReset={resetAll} onExportJson={() => exportJsonBackup(auction.state)} onExportCsv={() => exportCsvReport(auction.state)} onImportJson={auction.importAuction} />}{auction.message && <div className="toast">{auction.message}</div>}</div>;
}


