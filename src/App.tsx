import { useState } from 'react';
import type { PlayerCategory } from './models/auctionModels';
import { useAuction } from './hooks/useAuction';
import { exportCsvReport, exportJsonBackup } from './utility/auctionBackup';
import SetupPage from './pages/SetupPage';
import TeamsPage from './pages/TeamsPage';
import AuctionPage from './components/AuctionPage';
import TeamDetails from './components/TeamDetails';
import PlayersPage from './pages/PlayersPage';
import ProfileMenu from './components/ProfileMenu';
import './styles.css';

type View = 'setup' | 'auction' | 'players' | 'teams';
export default function App() {
  const auction = useAuction();
  const [view, setView] = useState<View>(auction.state.phase === 'setup' ? 'setup' : 'auction');
  const [setupTab, setSetupTab] = useState<'teams' | 'players' | 'rules'>('teams');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const selectedTeam = auction.state.teams.find((team) => team.id === selectedTeamId);
  const goAuction = () => { if (auction.state.paused) auction.resumeAuction(); else auction.startAuction(); if (auction.state.teams.length && auction.state.players.length) setView('auction'); };
  const goSetup = () => { if (auction.state.phase === 'auction') return; setView('setup'); };
  const resetAll = () => { auction.resetAuction(); setView('setup'); setSetupTab('teams'); };
  const addPlayers = (names: string[], category: PlayerCategory) => auction.addPlayers(names, category);
 return <div className="app"><header className="topbar"><div className="brand"><div className="brand-mark">&#9670;</div><div><div className="brand-name">VOLLEY<span>BID</span></div><small>AUCTION MANAGER</small></div></div><div className="topbar-right"><span className="saved-badge">&#8226; Saved locally</span><button className="avatar avatar-button" onClick={() => setProfileOpen(true)}>BM</button></div></header><div className="layout"><aside className="sidebar"><div className="season">LOCAL TOURNAMENT <span>2026</span></div><button className={`nav-button ${view === 'setup' ? 'active' : ''}`} onClick={goSetup} disabled={auction.state.phase === 'auction'}> Setup <b>{auction.state.teams.length + auction.state.players.length}</b></button><button className={`nav-button ${view === 'auction' ? 'active' : ''}`} onClick={() => setView('auction')}> Live auction</button><button className={`nav-button ${view === 'teams' ? 'active' : ''}`} onClick={() => setView('teams')}> Teams <b>{auction.state.teams.length}</b></button><button className={`nav-button ${view === 'players' ? 'active' : ''}`} onClick={() => setView('players')}> Players <b>{auction.state.players.length}</b></button><div className="sidebar-bottom"><div className="sidebar-note">Tip<small>Team points are deducted only after a sale is confirmed.</small></div></div></aside><main className="content">{view === 'setup' ? <SetupPage state={auction.state} setupTab={setupTab} setSetupTab={setSetupTab} onAddTeams={auction.addTeams} onAddPlayers={addPlayers} onUpdateRules={auction.updateRules} onStart={goAuction} /> : view === 'teams' ? <TeamsPage state={auction.state} onUpdateTeam={auction.updateTeam} onAddCaptain={auction.addCaptain} /> : view === 'players' ? <PlayersPage state={auction.state} onMakeAvailable={auction.makePlayerAvailable} onMakeAllAvailable={auction.makeAllUnsoldAvailable} onAllocate={auction.allocatePlayer} onUpdatePlayer={auction.updatePlayer} onDeletePlayer={auction.deletePlayer} onSelectAuction={(playerId) => { auction.selectPlayerForAuction(playerId); setView('auction'); }} onResumeSold={(playerId, mode) => { auction.reopenSoldPlayer(playerId, mode); setView('auction'); }} onViewTeam={setSelectedTeamId} /> : <AuctionPage auction={auction} onViewTeam={setSelectedTeamId} />}</main></div><nav className="mobile-nav"><button className={view === 'auction' ? 'active' : ''} onClick={() => setView('auction')}><span></span><small>Auction</small></button><button className={view === 'teams' ? 'active' : ''} onClick={() => setView('teams')}><span></span><small>Teams</small></button><button className={view === 'players' ? 'active' : ''} onClick={() => setView('players')}><span></span><small>Players</small></button><button className={view === 'setup' ? 'active' : ''} onClick={goSetup} disabled={auction.state.phase === 'auction'}><span></span><small>Setup</small></button></nav>{selectedTeam && <TeamDetails team={selectedTeam} players={auction.state.players} onClose={() => setSelectedTeamId(null)} />}{profileOpen && <ProfileMenu onClose={() => setProfileOpen(false)} onReset={resetAll} onExportJson={() => exportJsonBackup(auction.state)} onExportCsv={() => exportCsvReport(auction.state)} onImportJson={auction.importAuction} />}{auction.message && <div className="toast">{auction.message}</div>}</div>;
}








