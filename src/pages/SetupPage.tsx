import type { AuctionRules, AuctionState, PlayerCategory } from '../models/auctionModels';
import RegistrationPage from '../components/RegistrationPage';
import AuctionRulesPage from './AuctionRulesPage';

interface Props { state: AuctionState; setupTab: 'teams' | 'players' | 'rules'; setSetupTab: (tab: 'teams' | 'players' | 'rules') => void; onAddTeams: (names: string[]) => void; onAddPlayers: (names: string[], category: PlayerCategory) => void; onUpdateRules: (changes: Partial<AuctionRules>) => void; onStart: () => void; }

export default function SetupPage({ state, setupTab, setSetupTab, onAddTeams, onAddPlayers, onUpdateRules, onStart }: Props) {
  return <section><div className="setup-tabs"><button className={setupTab === 'teams' ? 'active' : ''} onClick={() => setSetupTab('teams')}>1. Teams <b>{state.teams.length}</b></button><button className={setupTab === 'players' ? 'active' : ''} onClick={() => setSetupTab('players')}>2. Players <b>{state.players.length}</b></button><button className={setupTab === 'rules' ? 'active' : ''} onClick={() => setSetupTab('rules')}>3. Auction rules</button></div>{setupTab === 'rules' ? <AuctionRulesPage rules={state.rules} onSave={onUpdateRules} /> : <RegistrationPage type={setupTab === 'teams' ? 'team' : 'player'} onAddTeams={onAddTeams} onAddPlayers={onAddPlayers} />}<div className="setup-review card"><div><div className="eyebrow">READY CHECK</div><strong>{state.teams.length} teams &middot; {state.players.length} players</strong><p>{state.rules.budgetPerTeam} points per team &middot; Base price {state.rules.basePrice} &middot; Minimum squad size {state.rules.minimumSquadSize}</p></div><button className="primary-button" onClick={onStart}>{state.paused ? 'Start auction again' : 'Start auction'}</button></div></section>;
}






