export type WalletSource = "kit" | "ephemeral";

export interface ConnectedWallet {
  publicKey: string;
  source: WalletSource;
  /** Only present for ephemeral wallets — never exposed for kit wallets */
  secretKey?: string;
}

export interface WalletState {
  wallet: ConnectedWallet | null;
  isConnected: boolean;
  isConnecting: boolean;
  isGenerating: boolean;
  balance: string | null;
  error: string | null;
}
