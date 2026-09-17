export type VoiceCharacterId = 'laras' | 'amoy' | 'slamet';

export interface VoiceCharacter {
  id: VoiceCharacterId;
  name: string;
  tagline: string;
  avatar: string;
  pitch: number;
  rate: number;
  description: string;
  samplePhrase: string;
}

export interface Transaction {
  id: number;
  transaction_id: string; // e.g. TX-2026-9841
  merchant_id: number;
  amount: number;
  payment_method: 'QRIS' | 'GOPAY' | 'OVO' | 'DANA' | 'SHOPEEPAY' | 'BCA';
  customer_name?: string;
  created_at: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  deduplicated?: boolean; // true if duplicate prevented
}

export interface Merchant {
  id: number;
  merchant_name: string;
  wallet_username: string;
  is_scraper_active: boolean;
  wallet_type: 'GoBiz / GoPay Merchant' | 'ShopeePay Merchant' | 'DANA Bisnis' | 'BCA Merchant';
  session_status: 'CONNECTED' | 'EXPIRED' | 'PENDING_OTP';
  last_scraped_at?: string;
}

export interface ScraperStepLog {
  id: string;
  timestamp: string;
  step: 'LAUNCH' | 'NAVIGATE' | 'AUTH_CHECK' | 'EXTRACT' | 'DB_QUERY' | 'WS_EMIT' | 'DEDUP_SKIP' | 'ERROR';
  message: string;
  details?: string;
  status: 'info' | 'success' | 'warning' | 'error';
}
