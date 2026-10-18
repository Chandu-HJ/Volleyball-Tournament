import type { AuctionRules } from '../models/auctionModels';

export const DEFAULT_RULES: AuctionRules = { basePrice: 10, bidIncrease: 10, bidIncreaseAfterThreshold: 20, bidThreshold: 200, budgetPerTeam: 1000, minimumSquadSize: 0 };
export const STARTING_POINTS = DEFAULT_RULES.budgetPerTeam;
export const BASE_PRICE = DEFAULT_RULES.basePrice;

export function getNextBid(currentBid: number, rules: AuctionRules = DEFAULT_RULES): number {
  return currentBid === 0 ? rules.basePrice : currentBid < rules.bidThreshold ? currentBid + rules.bidIncrease : currentBid + rules.bidIncreaseAfterThreshold;
}
