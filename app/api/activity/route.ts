import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  formatUnits,
  http,
  isAddress,
  parseAbiItem,
  type Address,
} from "viem";
import { mainnet, base } from "viem/chains";
import { KENDU_CONTRACTS } from "../../../lib/contracts";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

const ethereumClient = createPublicClient({
  chain: mainnet,
  transport: http("https://ethereum-rpc.publicnode.com"),
});

const baseClient = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org"),
});

type TokenClient = typeof ethereumClient | typeof baseClient;

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

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");

  if (!wallet || !isAddress(wallet)) {
    return NextResponse.json(
      { error: "Invalid EVM wallet address." },
      { status: 400 }
    );
  }

  const walletAddress = wallet as Address;

  const ethereumActivity = await getChainActivitySafe({
    chainName: KENDU_CONTRACTS.ethereum.name,
    tokenAddress: KENDU_CONTRACTS.ethereum.address,
    walletAddress,
    client: ethereumClient,
    lookbackBlocks: BigInt(20000),
    chunkSize: BigInt(2000),
    explorerTxBaseUrl: "https://etherscan.io/tx/",
  });

  const baseActivity = await getChainActivitySafe({
    chainName: KENDU_CONTRACTS.base.name,
    tokenAddress: KENDU_CONTRACTS.base.address,
    walletAddress,
    client: baseClient,
    lookbackBlocks: BigInt(3000),
    chunkSize: BigInt(500),
    explorerTxBaseUrl: "https://basescan.org/tx/",
    });

  const chains = [ethereumActivity, baseActivity];

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
    note: "This is recent transfer-based activity detection. It detects KENDU inflows and outflows, not final verified DEX buys yet.",
    summary: {
      possibleDcaDays,
      outflowDays,
      recentEvents: allEvents.length,
    },
    chains,
    events: allEvents.slice(0, 30),
  });
}

async function getChainActivitySafe(params: {
  chainName: string;
  tokenAddress: Address;
  walletAddress: Address;
  client: TokenClient;
  lookbackBlocks: bigint;
  chunkSize: bigint;
  explorerTxBaseUrl: string;
}) {
  try {
    return await getChainActivity(params);
  } catch (error) {
    return {
      chain: params.chainName,
      status: "failed",
      error: getErrorMessage(error),
      events: [] as KenduActivityEvent[],
    };
  }
}

async function getChainActivity({
  chainName,
  tokenAddress,
  walletAddress,
  client,
  lookbackBlocks,
  chunkSize,
  explorerTxBaseUrl,
}: {
  chainName: string;
  tokenAddress: Address;
  walletAddress: Address;
  client: TokenClient;
  lookbackBlocks: bigint;
  chunkSize: bigint;
  explorerTxBaseUrl: string;
}) {
  const latestBlockRaw = await client.getBlockNumber();

  // Small safety buffer so the RPC node is not asked for blocks it has not indexed yet.
  const latestBlock =
    latestBlockRaw > BigInt(20) ? latestBlockRaw - BigInt(20) : latestBlockRaw;

  const fromBlock =
    latestBlock > lookbackBlocks ? latestBlock - lookbackBlocks : BigInt(0);

  const inflowLogs = await getTransferLogs({
    client,
    tokenAddress,
    walletAddress,
    fromBlock,
    toBlock: latestBlock,
    chunkSize,
    direction: "inflow",
  });

  await sleep(300);

  const outflowLogs = await getTransferLogs({
    client,
    tokenAddress,
    walletAddress,
    fromBlock,
    toBlock: latestBlock,
    chunkSize,
    direction: "outflow",
  });

  const dedupedLogs = new Map<string, (typeof inflowLogs)[number]>();

  for (const log of [...inflowLogs, ...outflowLogs]) {
    dedupedLogs.set(`${log.transactionHash}-${log.logIndex}`, log);
  }

  const logs = Array.from(dedupedLogs.values())
    .sort((a, b) => Number(b.blockNumber - a.blockNumber))
    .slice(0, 30);

  const blockTimestamps = await getBlockTimestamps(client, logs);

  const normalizedEvents: KenduActivityEvent[] = logs.map((log) => {
    const from = log.args.from?.toLowerCase() || "";
    const to = log.args.to?.toLowerCase() || "";
    const amountRaw = log.args.value || BigInt(0);
    const walletLower = walletAddress.toLowerCase();

    const type: "inflow" | "outflow" =
      to === walletLower && from !== walletLower ? "inflow" : "outflow";

    const timestamp = blockTimestamps.get(log.blockNumber.toString()) || 0;
    const date =
      timestamp > 0
        ? new Date(timestamp * 1000).toISOString().slice(0, 10)
        : "unknown";

    return {
      chain: chainName,
      type,
      amount: formatKenduAmount(amountRaw),
      raw: amountRaw.toString(),
      txHash: log.transactionHash,
      blockNumber: log.blockNumber.toString(),
      date,
      timestamp,
      explorerUrl: `${explorerTxBaseUrl}${log.transactionHash}`,
    };
  });

  const inflowCount = normalizedEvents.filter(
    (event) => event.type === "inflow"
  ).length;

  const outflowCount = normalizedEvents.filter(
    (event) => event.type === "outflow"
  ).length;

  const possibleDcaDays = new Set(
    normalizedEvents
      .filter((event) => event.type === "inflow")
      .map((event) => event.date)
  ).size;

  return {
    chain: chainName,
    status: "success",
    latestBlock: latestBlock.toString(),
    scannedFromBlock: fromBlock.toString(),
    scannedToBlock: latestBlock.toString(),
    inflowCount,
    outflowCount,
    possibleDcaDays,
    events: normalizedEvents,
  };
}

async function getTransferLogs({
  client,
  tokenAddress,
  walletAddress,
  fromBlock,
  toBlock,
  chunkSize,
  direction,
}: {
  client: TokenClient;
  tokenAddress: Address;
  walletAddress: Address;
  fromBlock: bigint;
  toBlock: bigint;
  chunkSize: bigint;
  direction: "inflow" | "outflow";
}) {
  const chunks = buildBlockChunks(fromBlock, toBlock, chunkSize);
  const allLogs = [];

  for (const chunk of chunks) {
    const args =
      direction === "inflow"
        ? { to: walletAddress }
        : { from: walletAddress };

    const logs = await client.getLogs({
      address: tokenAddress,
      event: transferEvent,
      args,
      fromBlock: chunk.fromBlock,
      toBlock: chunk.toBlock,
    });

    allLogs.push(...logs);

    // Public RPC endpoints rate-limit if we call too fast.
    await sleep(800);
  }

  return allLogs;
}

function buildBlockChunks(fromBlock: bigint, toBlock: bigint, chunkSize: bigint) {
  const chunks: { fromBlock: bigint; toBlock: bigint }[] = [];

  let currentFromBlock = fromBlock;

  while (currentFromBlock <= toBlock) {
    const currentToBlock =
      currentFromBlock + chunkSize - BigInt(1) > toBlock
        ? toBlock
        : currentFromBlock + chunkSize - BigInt(1);

    chunks.push({
      fromBlock: currentFromBlock,
      toBlock: currentToBlock,
    });

    currentFromBlock = currentToBlock + BigInt(1);
  }

  return chunks;
}

async function getBlockTimestamps(
  client: TokenClient,
  logs: Awaited<ReturnType<typeof getTransferLogs>>
) {
  const uniqueBlockNumbers = Array.from(
    new Set(logs.map((log) => log.blockNumber.toString()))
  );

  const timestampMap = new Map<string, number>();

  for (const blockNumber of uniqueBlockNumbers) {
    const block = await client.getBlock({
      blockNumber: BigInt(blockNumber),
    });

    timestampMap.set(blockNumber, Number(block.timestamp));
    await sleep(100);
  }

  return timestampMap;
}

function formatKenduAmount(raw: bigint) {
  const amount = Number(formatUnits(raw, 18));

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(amount);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}