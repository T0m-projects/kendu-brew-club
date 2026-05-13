export type WalletType = "evm" | "solana" | "invalid";

export type WalletValidationResult = {
  type: WalletType;
  isValid: boolean;
  label: string;
  message: string;
};

const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;

// Basic Solana public address format check.
// This checks common Base58 format and length, not ownership.
const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function validateWalletAddress(value: string): WalletValidationResult {
  const wallet = value.trim();

  if (!wallet) {
    return {
      type: "invalid",
      isValid: false,
      label: "No wallet entered",
      message: "Paste an Ethereum, Base or Solana wallet address.",
    };
  }

  if (evmAddressRegex.test(wallet)) {
    return {
      type: "evm",
      isValid: true,
      label: "EVM wallet detected",
      message: "This looks like a valid Ethereum/Base wallet address.",
    };
  }

  if (solanaAddressRegex.test(wallet)) {
    return {
      type: "solana",
      isValid: true,
      label: "Solana wallet detected",
      message: "This looks like a valid Solana wallet address.",
    };
  }

  return {
    type: "invalid",
    isValid: false,
    label: "Invalid wallet address",
    message: "This does not look like a valid Ethereum, Base or Solana wallet.",
  };
}