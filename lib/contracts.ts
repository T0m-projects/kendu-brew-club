import type { Address } from "viem";

export const KENDU_CONTRACTS = {
  ethereum: {
    name: "Ethereum",
    address: "0xaa95f26e30001251fb905d264Aa7b00eE9dF6C18" as Address,
  },
  base: {
    name: "Base",
    address: "0xef73611f98da6e57e0776317957af61b59e09ed7" as Address,
  },
} as const;