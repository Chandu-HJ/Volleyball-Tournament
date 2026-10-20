export const CATEGORIES = ['Passer / Setter', 'Smasher', 'Defense'] as const;
export type PlayerCategory = (typeof CATEGORIES)[number] | 'Captain';
export type PlayerStatus = 'available' | 'sold' | 'unsold';

export interface AuctionRules {
  basePrice: number;
  bidIncrease: number;
  bidIncreaseAfterThreshold: number;
  bidThreshold: number;
  budgetPerTeam: number;
  minimumSquadSize: number;
}

export interface Team {
  id: string;
  name: string;
  logo?: string;
  color: string;
  points: number;
  playerIds: string[];
}

export interface Player {
  id: string;
  name: string;
  category: PlayerCategory;
  status: PlayerStatus;
  soldTo?: string;
  soldPrice?: number;
  auctionRound?: number;
  profilePic?: string;
  isCaptain?: boolean;
}

export interface BidRecord {
  id: string;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  amount: number;
  category: PlayerCategory;
  createdAt: string;
}

export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

export interface Match {
  id: string;
  order: number;
  isFinal?: boolean;
  teamAId: string;
  teamBId: string;
  scheduledDate?: string;
  scheduledTime?: string;
  status: MatchStatus;
  targetPoints?: number;
  scoreA: number;
  scoreB: number;
  firstHalfScoreA?: number;
  firstHalfScoreB?: number;
  secondHalfScoreA?: number;
  secondHalfScoreB?: number;
  currentHalf?: 1 | 2;
  scoreHistory?: Array<{ teamId: string; half: 1 | 2; delta?: 1 | -1 }>;
  winnerId?: string;
  completedAt?: string;
}

export interface AuctionState {
  rules: AuctionRules;
  teams: Team[];
  players: Player[];
  bids: BidRecord[];
  phase: 'setup' | 'auction' | 'complete';
  paused?: boolean;
  activeCategory: PlayerCategory | 'All';
  currentPlayerId: string | null;
  currentBid: number;
  highestBidderId: string | null;
  auctionRound: number;
  matches: Match[];
  currentMatchId: string | null;
}
