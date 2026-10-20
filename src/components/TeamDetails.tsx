import type { Player, Team } from '../models/auctionModels';

interface Props { team: Team; players: Player[]; minimumSquadSize?: number; onClose: () => void; }

const escapeXml = (value: string) => value.replace(/[<>&'"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character] ?? character);

export default function TeamDetails({ team, players, minimumSquadSize = 7, onClose }: Props) {
  const bought = players.filter((player) => team.playerIds.includes(player.id)).sort((a, b) => Number(Boolean(b.isCaptain)) - Number(Boolean(a.isCaptain)));
  const spent = bought.reduce((sum, player) => sum + (player.soldPrice ?? 0), 0);

  const createRosterSvg = () => {
    const rows = bought.map((player, index) => `<g transform="translate(28 ${215 + index * 58})"><circle cx="18" cy="18" r="16" fill="#20313e"/><text x="18" y="23" text-anchor="middle" fill="#4cc9c0" font-size="13" font-family="Arial">${escapeXml(player.name.slice(0, 1).toUpperCase())}</text><text x="52" y="16" fill="#f1f5f7" font-size="15" font-weight="700" font-family="Arial">${escapeXml(player.name)}</text><text x="52" y="35" fill="#91a4b2" font-size="11" font-family="Arial">${escapeXml(player.category)}${player.isCaptain ? ' - CAPTAIN' : ''}</text><text x="540" y="24" text-anchor="end" fill="#f4b942" font-size="13" font-family="Arial">${player.soldPrice ?? 0} pts</text></g>`).join('');
    const height = Math.max(360, 245 + bought.length * 58);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${height}" viewBox="0 0 600 ${height}"><rect width="600" height="${height}" rx="16" fill="#182532"/><rect x="1" y="1" width="598" height="${height - 2}" rx="15" fill="none" stroke="#2b3c49"/><text x="28" y="34" fill="#f4b942" font-size="11" letter-spacing="2" font-family="Arial">${escapeXml(team.name)}</text><text x="28" y="75" fill="#f1f5f7" font-size="28" font-weight="700" font-family="Arial">SQUAD</text><rect x="28" y="95" width="168" height="62" rx="7" fill="#20313e"/><rect x="208" y="95" width="168" height="62" rx="7" fill="#20313e"/><rect x="388" y="95" width="184" height="62" rx="7" fill="#20313e"/><text x="42" y="125" fill="#f4b942" font-size="24" font-weight="700" font-family="Arial">${bought.length}</text><text x="42" y="145" fill="#91a4b2" font-size="10" font-family="Arial">PLAYERS</text><text x="222" y="125" fill="#f4b942" font-size="24" font-weight="700" font-family="Arial">${spent}</text><text x="222" y="145" fill="#91a4b2" font-size="10" font-family="Arial">SPENT</text><text x="402" y="125" fill="#f4b942" font-size="24" font-weight="700" font-family="Arial">${team.points}</text><text x="402" y="145" fill="#91a4b2" font-size="10" font-family="Arial">REMAINING</text><line x1="28" y1="185" x2="572" y2="185" stroke="#2b3c49"/>${rows}</svg>`;
  };

  const createRosterPng = async () => {
    const svgBlob = new Blob([createRosterSvg()], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    try {
      const image = new Image();
      image.src = svgUrl;
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Could not create squad image.')); });
      const canvas = document.createElement('canvas');
      canvas.width = image.width * 2;
      canvas.height = image.height * 2;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is not supported.');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not export squad image.')), 'image/png'));
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  };

  const downloadSquad = async () => {
    const blob = await createRosterPng();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${team.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-squad.png`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const shareSquad = async () => {
    const blob = await createRosterPng();
    const file = new File([blob], `${team.name}-squad.png`, { type: 'image/png' });
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) await navigator.share({ title: `${team.name} squad`, text: `${team.name} squad`, files: [file] });
    else await downloadSquad();
  };

  return <div className="modal-backdrop" onClick={onClose}><div className="modal team-roster-modal" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div><div className="eyebrow">{team.name}</div><h2>Squad</h2></div><button className="close-button" onClick={onClose}>&times;</button></div><div className="team-detail-stats"><div><strong>{bought.length}</strong><small>players</small></div><div><strong>{spent}</strong><small>total spent</small></div><div><strong>{team.points}</strong><small>remaining points</small></div><div><strong>{Math.max(0, minimumSquadSize - bought.length)}</strong><small>players needed</small></div></div><div className="bought-list">{bought.length ? bought.map((player) => <div className="bought-row" key={player.id}>{player.profilePic ? <img className="squad-player-avatar" src={player.profilePic} alt="" /> : <span className="squad-player-avatar initials">{player.name.slice(0, 1).toUpperCase()}</span>}<span><strong>{player.name}{player.isCaptain && <em className="captain-badge">CAPTAIN</em>}</strong><small>{player.category}</small></span><b>{player.soldPrice} pts</b></div>) : <p className="empty-text">No players purchased yet.</p>}</div><div className="squad-share-actions"><button className="outline-button" onClick={downloadSquad}>Download PNG image</button><button className="primary-button" onClick={shareSquad}>Share PNG</button></div></div></div>;
}




