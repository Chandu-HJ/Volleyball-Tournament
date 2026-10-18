import { useState } from 'react';
import type { PlayerCategory } from '../models/auctionModels';
import { CATEGORIES } from '../models/auctionModels';
import { parseNames } from '../utility/nameParser';

interface Props { type: 'team' | 'player'; onAddTeams: (names: string[]) => void; onAddPlayers: (names: string[], category: PlayerCategory) => void; }

export default function RegistrationPage({ type, onAddTeams, onAddPlayers }: Props) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<PlayerCategory>(CATEGORIES[0]);
  const names = parseNames(text);
  const add = () => { if (!names.length) return; type === 'team' ? onAddTeams(names) : onAddPlayers(names, category); setText(''); };
  return <section className="registration-page"><div className="eyebrow">TOURNAMENT SETUP</div><h1>{type === 'team' ? 'Register teams.' : 'Register players.'}</h1><p className="page-subtitle">{type === 'team' ? 'Paste team names one per line or separated by commas.' : 'Choose a category, then paste one or more player names.'}</p><div className="card registration-card">{type === 'player' && <label className="field-label">PLAYER CATEGORY<select value={category} onChange={(event) => setCategory(event.target.value as PlayerCategory)}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>}<label className="field-label">{type === 'team' ? 'TEAM NAMES' : 'PLAYER NAMES'}<textarea value={text} onChange={(event) => setText(event.target.value)} placeholder={type === 'team' ? 'Smashers\nBlock Party, Net Ninjas' : 'Arjun Sharma\nRohan Patil, Vikram Singh'} rows={8} /></label><div className="form-footer"><span>{names.length ? `${names.length} name${names.length === 1 ? '' : 's'} ready to add` : 'Comma and new-line separated names are supported'}</span><button className="primary-button" onClick={add} disabled={!names.length}>Add {type === 'team' ? 'teams' : 'players'}</button></div></div></section>;
}
