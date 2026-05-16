"use client";

import { useEffect, useMemo, useState } from "react";
import { validateWalletAddress } from "../../../lib/wallet";

type BalanceApiResponse = {
  wallet: string;
  symbol: string;
  balances: {
    chain: string;
    raw: string;
    formatted: string;
    symbol: string;
    status: string;
    error?: string;
  }[];
  total: {
    raw: string;
    formatted: string;
  };
};

type ActivityApiResponse = {
  wallet: string;
  note: string;
  summary: {
    possibleDcaDays: number;
    outflowDays: number;
    recentEvents: number;
  };
  chains: {
    chain: string;
    status: string;
    inflowCount?: number;
    outflowCount?: number;
    possibleDcaDays?: number;
    outflowDays?: number;
    error?: string;
    events: {
      chain: string;
      type: "inflow" | "outflow";
      amount: string;
      raw: string;
      txHash: string;
      blockNumber: string;
      date: string;
      timestamp: number;
      explorerUrl: string;
    }[];
  }[];
  events: {
    chain: string;
    type: "inflow" | "outflow";
    amount: string;
    raw: string;
    txHash: string;
    blockNumber: string;
    date: string;
    timestamp: number;
    explorerUrl: string;
  }[];
};

export function ShareProfileClient({ wallet }: { wallet: string }) {
  const [balanceData, setBalanceData] = useState<BalanceApiResponse | null>(
    null
  );
  const [activityData, setActivityData] = useState<ActivityApiResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const validation = useMemo(() => validateWalletAddress(wallet), [wallet]);
  const isEvmWallet = validation.isValid && validation.type === "evm";

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  useEffect(() => {
    async function loadShareProfile() {
      if (!isEvmWallet) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const [balanceResponse, activityResponse] = await Promise.all([
          fetch(`/api/balance?wallet=${encodeURIComponent(wallet)}`),
          fetch(`/api/activity?wallet=${encodeURIComponent(wallet)}`),
        ]);

        const balanceJson = await balanceResponse.json();
        const activityJson = await activityResponse.json();

        if (!balanceResponse.ok) {
          throw new Error(balanceJson.error || "Failed to load balance.");
        }

        if (!activityResponse.ok) {
          throw new Error(activityJson.error || "Failed to load activity.");
        }

        setBalanceData(balanceJson);
        setActivityData(activityJson);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Failed to load share profile.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadShareProfile();
  }, [wallet, isEvmWallet]);

  const activeChains =
    balanceData?.balances
      .filter((balance) => balance.raw !== "0")
      .map((balance) => balance.chain)
      .join(" / ") || "No KENDU detected";

  const possibleDcaDays = activityData?.summary.possibleDcaDays ?? 0;
  const outflowDays = activityData?.summary.outflowDays ?? 0;
  const holderStatus = activityData
    ? getHolderStatus(outflowDays)
    : "Loading activity";
  const holderBadge = activityData
    ? getHolderBadge(possibleDcaDays, outflowDays)
    : balanceData && balanceData.total.raw !== "0"
      ? "KENDU Holder"
      : "Loading profile";

  const tweetText = `☕ My KENDU Brew Club profile

${balanceData?.total.formatted ?? "0"} KENDU held
Possible DCA days: ${possibleDcaDays}
Status: ${holderStatus}
Badge: ${holderBadge}

${shareUrl}`;

  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    tweetText
  )}`;

  const telegramShareUrl = `tg://msg_url?url=${encodeURIComponent(
    shareUrl
  )}&text=${encodeURIComponent("☕ Check my KENDU Brew Club profile")}`;

  async function copyShareLink() {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyStatus("Copied!");

      window.setTimeout(() => {
        setCopyStatus("");
      }, 2000);
    } catch {
      setCopyStatus("Copy failed");

      window.setTimeout(() => {
        setCopyStatus("");
      }, 2000);
    }
  }

  return (
    <main className="min-h-screen bg-[#070707] px-6 py-10 text-white">
      <section className="mx-auto max-w-5xl">
        <header className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-orange-300">
              KENDU Brew Club
            </p>
            <h1 className="mt-3 text-3xl font-bold md:text-5xl">
              Shared KENDU holder profile
            </h1>
          </div>

          <a
            href="/"
            className="rounded-xl border border-white/15 px-5 py-3 text-center font-bold transition hover:bg-white/10"
          >
            Check another wallet
          </a>
        </header>

        {!validation.isValid && (
          <div className="mt-10 rounded-3xl border border-red-400/20 bg-red-400/10 p-6">
            <h2 className="text-2xl font-bold text-red-200">
              Invalid wallet address
            </h2>
            <p className="mt-2 text-white/60">{validation.message}</p>
          </div>
        )}

        {validation.type === "solana" && (
          <div className="mt-10 rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-6">
            <h2 className="text-2xl font-bold text-yellow-200">
              Solana support coming soon
            </h2>
            <p className="mt-2 text-white/60">
              This share profile currently supports Ethereum and Base EVM
              wallets.
            </p>
          </div>
        )}

        {isLoading && isEvmWallet && (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-lg font-bold text-orange-200">
              Loading KENDU profile...
            </p>
            <p className="mt-2 text-white/60">
              Reading public Ethereum and Base data.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-10 rounded-3xl border border-red-400/20 bg-red-400/10 p-6">
            <h2 className="text-2xl font-bold text-red-200">
              Profile loading failed
            </h2>
            <p className="mt-2 text-white/60">{error}</p>
          </div>
        )}

        {balanceData && activityData && (
          <>
            <section className="mt-10 rounded-3xl border border-orange-300/20 bg-gradient-to-br from-orange-300/15 via-white/[0.03] to-black p-6 shadow-2xl md:p-8">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-orange-300">
                    Shared profile
                  </p>
                  <h2 className="mt-3 text-4xl font-extrabold">
                    {holderBadge}
                  </h2>
                  <p className="mt-3 font-mono text-sm text-white/50">
                    {shortenWallet(wallet)}
                  </p>
                </div>

                <div className="text-6xl">☕</div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <ShareStat
                  label="KENDU held"
                  value={`${balanceData.total.formatted} ${balanceData.symbol}`}
                />
                <ShareStat label="Chains" value={activeChains} />
                <ShareStat
                  label="Possible DCA days"
                  value={String(possibleDcaDays)}
                />
                <ShareStat label="Outflow days" value={String(outflowDays)} />
                <ShareStat label="Status" value={holderStatus} />
                <ShareStat
                  label="Recent events"
                  value={String(activityData.summary.recentEvents)}
                />
              </div>

              <div className="mt-8 rounded-2xl border border-green-400/20 bg-green-400/10 p-5">
                <p className="font-bold text-green-200">Read-only profile</p>
                <p className="mt-1 text-sm text-white/60">
                  No wallet connection. No approvals. No transactions. Public
                  wallet data only.
                </p>
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h3 className="text-2xl font-bold">Share this profile</h3>
                  <p className="mt-2 text-sm text-white/60">
                    Copy the profile link or share it directly to X or Telegram.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={copyShareLink}
                    className="rounded-xl bg-orange-300 px-5 py-3 font-bold text-black transition hover:bg-orange-200"
                  >
                    {copyStatus || "Copy link"}
                  </button>

                  <a
                    href={xShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-white/15 px-5 py-3 text-center font-bold transition hover:bg-white/10"
                  >
                    Share on X
                  </a>

                  <a
                    href={telegramShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-white/15 px-5 py-3 text-center font-bold transition hover:bg-white/10"
                  >
                    Share on Telegram
                  </a>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="break-all font-mono text-sm text-white/60">
                  {shareUrl}
                </p>
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-xl font-bold">Latest KENDU activity</h3>

              {activityData.events.length === 0 ? (
                <p className="mt-3 text-white/60">
                  No recent KENDU transfer activity found.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {activityData.events.slice(0, 8).map((event, index) => (
                    <a
                      key={`${event.txHash}-${event.blockNumber}-${event.type}-${index}`}
                      href={event.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-white/10 bg-black/40 p-4 transition hover:border-orange-300/40"
                    >
                      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                        <div>
                          <p
                            className={`font-bold ${
                              event.type === "inflow"
                                ? "text-green-200"
                                : "text-red-200"
                            }`}
                          >
                            {event.type === "inflow" ? "Inflow" : "Outflow"} ·{" "}
                            {event.chain}
                          </p>
                          <p className="mt-1 text-sm text-white/50">
                            {event.date}
                          </p>
                        </div>

                        <p className="text-lg font-bold text-orange-100">
                          {event.amount} KENDU
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              <p className="mt-5 text-xs text-white/40">
                {activityData.note}
              </p>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function ShareStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-white/40">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-orange-100">{value}</p>
    </div>
  );
}

function shortenWallet(wallet: string) {
  if (wallet.length <= 14) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-6)}`;
}

function getHolderStatus(outflowDays: number) {
  if (outflowDays === 0) return "No outflows detected";
  if (outflowDays <= 2) return "Mostly holding";
  return "Outflows detected";
}

function getHolderBadge(possibleDcaDays: number, outflowDays: number) {
  if (possibleDcaDays >= 30 && outflowDays === 0) return "Diamond Brewer";
  if (possibleDcaDays >= 14 && outflowDays <= 2) return "Cappuccino Chad";
  if (possibleDcaDays >= 7) return "Double Shot Holder";
  if (possibleDcaDays >= 1) return "KENDU Stacker";
  return "KENDU Holder";
}