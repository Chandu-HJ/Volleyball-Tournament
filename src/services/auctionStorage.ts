import type { AuctionState } from '../models/auctionModels';

const STORAGE_KEY = 'volleybid-auction-state-v1';

export function loadAuction(): AuctionState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as AuctionState) : null;
  } catch {
    return null;
  }
}

export function saveAuction(state: AuctionState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearAuction(): void {
  localStorage.removeItem(STORAGE_KEY);
}
