import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  formatUnits,
  http,
  isAddress,
  type Address,
} from "viem";
import { mainnet, base } from "viem/chains";
import { KENDU_CONTRACTS } from "../../../lib/contracts";

const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const ethereumClient = createPublicClient({
  chain: mainnet,
  transport: http("https://ethereum-rpc.publicnode.com"),
});

const baseClient = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org"),
});

type TokenClient = typeof ethereumClient | typeof baseClient;

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");

  if (!wallet || !isAddress(wallet)) {
    return NextResponse.json(
      {
        error: "Invalid EVM wallet address.",
      },
      { status: 400 }
    );
  }

  const results = await Promise.allSettled([
    getTokenBalance({
      chainName: KENDU_CONTRACTS.ethereum.name,
      tokenAddress: KENDU_CONTRACTS.ethereum.address,
      walletAddress: wallet as Address,
      client: ethereumClient,
    }),
    getTokenBalance({
      chainName: KENDU_CONTRACTS.base.name,
      tokenAddress: KENDU_CONTRACTS.base.address,
      walletAddress: wallet as Address,
      client: baseClient,
    }),
  ]);

  const balances = results.map((result, index) => {
    const chainName = index === 0 ? "Ethereum" : "Base";

    if (result.status === "fulfilled") {
      return {
        chain: result.value.chainName,
        raw: result.value.raw.toString(),
        formatted: formatKenduAmount(result.value.raw),
        symbol: "KENDU",
        status: "success",
      };
    }

    console.error(`${chainName} balance failed:`, result.reason);

    return {
      chain: chainName,
      raw: "0",
      formatted: "0",
      symbol: "KENDU",
      status: "failed",
      error: getErrorMessage(result.reason),
};
  });

  const totalRaw = balances.reduce((total, balance) => {
    return total + BigInt(balance.raw);
}, BigInt(0));

  return NextResponse.json({
    wallet,
    symbol: "KENDU",
    balances,
    total: {
      raw: totalRaw.toString(),
      formatted: formatKenduAmount(totalRaw),
    },
  });
}

async function getTokenBalance({
  chainName,
  tokenAddress,
  walletAddress,
  client,
}: {
  chainName: string;
  tokenAddress: Address;
  walletAddress: Address;
  client: TokenClient;
}) {
  const raw = await client.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [walletAddress],
  });

  return {
    chainName,
    raw,
  };
}

function formatKenduAmount(raw: bigint) {
  const amount = Number(formatUnits(raw, 18));

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(amount);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}