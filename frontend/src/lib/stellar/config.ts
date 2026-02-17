/**
 * Configuration loaded from environment variables
 * These are set by the setup script after deployment
 */

import {
  DEV_PLAYER1_ADDRESS,
  DEV_PLAYER2_ADDRESS,
  ZERO_TRUST_CONTRACT_ID,
  NETWORK_PASSPHRASE,
  RPC_URL,
} from "@/lib/stellar/constants_stellar";

export const config = {
  rpcUrl: RPC_URL,
  networkPassphrase: NETWORK_PASSPHRASE,

  zeroTrust: ZERO_TRUST_CONTRACT_ID,

  devPlayer1Address: DEV_PLAYER1_ADDRESS,
  devPlayer2Address: DEV_PLAYER2_ADDRESS,
};
