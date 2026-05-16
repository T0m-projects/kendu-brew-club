import { NextRequest, NextResponse } from "next/server";
import { formatUnits, isAddress, type Address } from "viem";
import { KENDU_CONTRACTS } from "../../../lib/contracts";

type ExplorerTokenTransfer = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
};

type ExplorerResponse = {
  status: string;
  message: string;
  result: ExplorerTokenTransfer[] | string;
};

type KenduActivityEvent = {
  chain: string;
  type: "inflow" | "outflow";
  amount: string;
  raw: string;
  txHash: string;
  blockNumber: string;
  date: string;
  timestamp: number;
  explorerUrl: string;
};

const ETHERSCAN_API_URL = "https://api.etherscan.io/v2/api";
const BASE_BLOCKSCOUT_API_URL = "https://base.blockscout.com/api";

const CHAINS = [
  {
    chain: "Ethereum",
    source: "etherscan",
    chainId: "1",
    tokenAddress: KENDU_CONTRACTS.ethereum.address,
    explorerTxBaseUrl: "https://etherscan.io/tx/",
  },
  {
    chain: "Base",
    source: "blockscout",
    tokenAddress: KENDU_CONTRACTS.base.address,
    explorerTxBaseUrl: "https://basescan.org/tx/",
  },
] as const;

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");

  if (!wallet || !isAddress(wallet)) {
    return NextResponse.json(
      { error: "Invalid EVM wallet address." },
      { status: 400 }
    );
  }

  const apiKey = process.env.ETHERSCAN_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing ETHERSCAN_API_KEY environment variable." },
      { status: 500 }
    );
  }

  const walletAddress = wallet as Address;

  const chainResults = await Promise.allSettled(
    CHAINS.map((chain) => {
      if (chain.source === "etherscan") {
        return getEtherscanTokenTransfers({
          chainName: chain.chain,
          chainId: chain.chainId,
          tokenAddress: chain.tokenAddress,
          walletAddress,
          explorerTxBaseUrl: chain.explorerTxBaseUrl,
          apiKey,
        });
      }

      return getBlockscoutTokenTransfers({
        chainName: chain.chain,
        tokenAddress: chain.tokenAddress,
        walletAddress,
        explorerTxBaseUrl: chain.explorerTxBaseUrl,
      });
    })
  );

  const chains = chainResults.map((result, index) => {
    const chainName = CHAINS[index].chain;

    if (result.status === "fulfilled") {
      const events = result.value.events;

      const possibleDcaDays = new Set(
        events
          .filter((event) => event.type === "inflow")
          .map((event) => event.date)
      ).size;

      const outflowDays = new Set(
        events
          .filter((event) => event.type === "outflow")
          .map((event) => event.date)
      ).size;

      return {
        chain: chainName,
        status: "success",
        inflowCount: events.filter((event) => event.type === "inflow").length,
        outflowCount: events.filter((event) => event.type === "outflow").length,
        possibleDcaDays,
        outflowDays,
        events,
      };
    }

    return {
      chain: chainName,
      status: "failed",
      error: getErrorMessage(result.reason),
      inflowCount: 0,
      outflowCount: 0,
      possibleDcaDays: 0,
      outflowDays: 0,
      events: [] as KenduActivityEvent[],
    };
  });

  const allEvents = chains
    .flatMap((chain) => chain.events)
    .sort((a, b) => b.timestamp - a.timestamp);

  const possibleDcaDays = new Set(
    allEvents
      .filter((event) => event.type === "inflow")
      .map((event) => event.date)
  ).size;

  const outflowDays = new Set(
    allEvents
      .filter((event) => event.type === "outflow")
      .map((event) => event.date)
  ).size;

  return NextResponse.json({
    wallet,
    note:
      "This uses token transfer history. It detects KENDU inflows and outflows, but does not yet fully verify whether each inflow was a DEX buy.",
    summary: {
      possibleDcaDays,
      outflowDays,
      recentEvents: allEvents.length,
    },
    chains,
    events: allEvents.slice(0, 50),
  });
}

async function getEtherscanTokenTransfers({
  chainName,
  chainId,
  tokenAddress,
  walletAddress,
  explorerTxBaseUrl,
  apiKey,
}: {
  chainName: string;
  chainId: string;
  tokenAddress: Address;
  walletAddress: Address;
  explorerTxBaseUrl: string;
  apiKey: string;
}) {
  const url = new URL(ETHERSCAN_API_URL);

  url.searchParams.set("chainid", chainId);
  url.searchParams.set("module", "account");
  url.searchParams.set("action", "tokentx");
  url.searchParams.set("contractaddress", tokenAddress);
  url.searchParams.set("address", walletAddress);
  url.searchParams.set("page", "1");
  url.searchParams.set("offset", "100");
  url.searchParams.set("sort", "desc");
  url.searchParams.set("apikey", apiKey);

  const data = await fetchExplorerData(url, chainName);

  return {
    chain: chainName,
    events: normalizeTokenTransfers({
      chainName,
      walletAddress,
      explorerTxBaseUrl,
      transfers: data,
    }),
  };
}

async function getBlockscoutTokenTransfers({
  chainName,
  tokenAddress,
  walletAddress,
  explorerTxBaseUrl,
}: {
  chainName: string;
  tokenAddress: Address;
  walletAddress: Address;
  explorerTxBaseUrl: string;
}) {
  const url = new URL(BASE_BLOCKSCOUT_API_URL);

  url.searchParams.set("module", "account");
  url.searchParams.set("action", "tokentx");
  url.searchParams.set("contractaddress", tokenAddress);
  url.searchParams.set("address", walletAddress);
  url.searchParams.set("page", "1");
  url.searchParams.set("offset", "100");
  url.searchParams.set("sort", "desc");

  const data = await fetchExplorerData(url, chainName);

  return {
    chain: chainName,
    events: normalizeTokenTransfers({
      chainName,
      walletAddress,
      explorerTxBaseUrl,
      transfers: data,
    }),
  };
}

async function fetchExplorerData(url: URL, chainName: string) {
  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`${chainName} API request failed with ${response.status}.`);
  }

  const data = (await response.json()) as ExplorerResponse;

  if (data.status === "0") {
    const message =
      typeof data.result === "string" ? data.result : data.message;

    if (
      message.toLowerCase().includes("no transactions") ||
      data.message.toLowerCase().includes("no transactions")
    ) {
      return [] as ExplorerTokenTransfer[];
    }

    throw new Error(`${chainName}: ${message}`);
  }

  if (!Array.isArray(data.result)) {
    throw new Error(`${chainName}: Unexpected API response.`);
  }

  return data.result;
}

function normalizeTokenTransfers({
  chainName,
  walletAddress,
  explorerTxBaseUrl,
  transfers,
}: {
  chainName: string;
  walletAddress: Address;
  explorerTxBaseUrl: string;
  transfers: ExplorerTokenTransfer[];
}) {
  const walletLower = walletAddress.toLowerCase();

  return transfers.map((tx) => {
    const from = tx.from.toLowerCase();
    const to = tx.to.toLowerCase();

    const type: "inflow" | "outflow" =
      to === walletLower && from !== walletLower ? "inflow" : "outflow";

    const timestamp = Number(tx.timeStamp);
    const decimals = Number(tx.tokenDecimal || "18");
    const raw = BigInt(tx.value || "0");

    return {
      chain: chainName,
      type,
      amount: formatKenduAmount(raw, decimals),
      raw: raw.toString(),
      txHash: tx.hash,
      blockNumber: tx.blockNumber,
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      timestamp,
      explorerUrl: `${explorerTxBaseUrl}${tx.hash}`,
    };
  });
}

function formatKenduAmount(raw: bigint, decimals: number) {
  const amount = Number(formatUnits(raw, decimals));

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