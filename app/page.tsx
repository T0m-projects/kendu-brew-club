"use client";

import { useMemo, useState } from "react";
import { validateWalletAddress } from "../lib/wallet";

const rankRules = [
  {
    name: "Instant Coffee",
    days: "0–2 DCA days",
    description: "You started your first brew.",
  },
  {
    name: "Espresso Holder",
    days: "3–6 DCA days",
    description: "Small cup. Strong hands.",
  },
  {
    name: "Double Shot Chad",
    days: "7–13 DCA days",
    description: "A full week of stacking.",
  },
  {
    name: "Cappuccino Chad",
    days: "14–29 DCA days",
    description: "Your streak is becoming serious.",
  },
  {
    name: "Diamond Brewer",
    days: "30–59 DCA days",
    description: "One month of disciplined stacking.",
  },
  {
    name: "Legendary Roast",
    days: "60+ DCA days",
    description: "Elite KENDU DCA status.",
  },
];

const roadmap = [
  "Read-only wallet checker",
  "DCA streak detection",
  "No-sell streak tracking",
  "Shareable profile cards",
  "Multi-chain support: Ethereum, Base, Solana",
  "Community leaderboard",
];

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

export default function Home() {
  const [wallet, setWallet] = useState("");

  const [balanceData, setBalanceData] = useState<BalanceApiResponse | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState("");

  const hasWallet = wallet.trim().length > 0;
  const validation = useMemo(() => validateWalletAddress(wallet), [wallet]);
  const canLoadRealBalance = validation.isValid && validation.type === "evm";

  const realBalanceText = balanceData
    ? `${balanceData.total.formatted} ${balanceData.symbol}`
    : null;

  const activeChainsText = balanceData
    ? balanceData.balances
      .filter((balance) => balance.raw !== "0")
      .map((balance) => balance.chain)
      .join(" / ") || "No KENDU detected"
    : null;

  const hasRealBalance = balanceData && balanceData.total.raw !== "0";

  const profile = useMemo(() => {
    if (!hasWallet || !validation.isValid) return null;

    const score = wallet
      .trim()
      .split("")
      .reduce((total, char) => total + char.charCodeAt(0), 0);

    const dcaDays = 3 + (score % 47);
    const noSellDays = 7 + (score % 93);
    const balanceOptions = ["18.4M", "57.2M", "128M", "237M", "512M"];
    const chains = ["ETH", "Base", "SOL", "ETH / Base", "Base / SOL"];

    return {
      shortWallet: shortenWallet(wallet.trim()),
      dcaDays,
      noSellDays,
      balance: balanceOptions[score % balanceOptions.length],
      chains: chains[score % chains.length],
      rank: getRank(dcaDays),
      noSellBadge: getNoSellBadge(noSellDays),
    };
  }, [wallet, hasWallet, validation.isValid]);

  async function loadRealBalance() {
    if (!canLoadRealBalance) return;

    setIsLoadingBalance(true);
    setBalanceError("");
    setBalanceData(null);

    try {
      const response = await fetch(
        `/api/balance?wallet=${encodeURIComponent(wallet.trim())}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load balance.");
      }

      setBalanceData(data);
    } catch (error) {
      if (error instanceof Error) {
        setBalanceError(error.message);
      } else {
        setBalanceError("Failed to load balance.");
      }
    } finally {
      setIsLoadingBalance(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-orange-300">
              KENDU Brew Club
            </p>
            <h1 className="mt-3 text-3xl font-bold md:text-5xl">
              Track your KENDU DCA streak.
            </h1>
          </div>

          <div className="rounded-full border border-orange-300/40 px-4 py-2 text-sm text-orange-200">
            Read-only MVP
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-14 md:grid-cols-2">
          <div>
            <h2 className="text-4xl font-extrabold leading-tight md:text-6xl">
              Skip the coffee.
              <br />
              Stack the dog.
            </h2>

            <p className="mt-6 max-w-xl text-lg text-white/70">
              Kendu Brew Club turns regular KENDU buying and holding into a
              community challenge with DCA streaks, no-sell status, ranks,
              badges and shareable holder cards.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#wallet-checker"
                className="rounded-xl bg-orange-300 px-6 py-3 text-center font-bold text-black transition hover:bg-orange-200"
              >
                Check my wallet
              </a>

              <a
                href="#how-it-works"
                className="rounded-xl border border-white/15 px-6 py-3 text-center font-bold text-white transition hover:bg-white/10"
              >
                How it works
              </a>
            </div>

            <div className="mt-8 rounded-2xl border border-green-400/20 bg-green-400/10 p-5">
              <p className="font-bold text-green-200">Safe by design</p>
              <p className="mt-2 text-sm text-white/65">
                No wallet connection required. No seed phrase. No token
                approvals. No transactions. The first version only uses public
                wallet addresses.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl">
            <p className="text-sm uppercase tracking-[0.25em] text-white/40">
              Example profile
            </p>

            <div className="mt-6 rounded-2xl bg-black/40 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Rank</p>
                  <p className="text-2xl font-bold text-orange-200">
                    Cappuccino Chad
                  </p>
                </div>

                <div className="text-4xl">☕</div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <Stat label="DCA days" value="14" />
                <Stat label="No-sell streak" value="32d" />
                <Stat label="KENDU held" value="237M" />
                <Stat label="Chains" value="ETH / Base" />
              </div>
            </div>
          </div>
        </section>

        <section
          id="wallet-checker"
          className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8"
        >
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h3 className="text-2xl font-bold">Wallet checker</h3>
              <p className="mt-2 text-white/60">
                Paste a public EVM wallet address to load real KENDU balances from Ethereum and Base. 
                Solana, DCA streaks and no-sell tracking are coming next.
              </p>
            </div>

            <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/50">
              Live balance MVP
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            <input
              value={wallet}
              onChange={(e) => {
                setWallet(e.target.value);
                setBalanceData(null);
                setBalanceError("");
              }}
              placeholder="Paste ETH / Base / Solana wallet address"
              className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-orange-300"
            />

            <button
              onClick={loadRealBalance}
              disabled={!canLoadRealBalance || isLoadingBalance}
              className="rounded-xl bg-orange-300 px-6 py-3 font-bold text-black transition hover:bg-orange-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoadingBalance ? "Loading..." : "Load real balance"}
            </button>
          </div>

          {hasWallet && validation.type === "solana" && (
            <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
              <p className="font-bold text-yellow-200">Solana support coming soon</p>
              <p className="mt-1 text-sm text-white/60">
                Solana wallet format is detected, but real KENDU balance loading is not
                connected yet.
              </p>
            </div>
          )}

          {balanceError && (
            <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
              <p className="font-bold text-red-200">Balance loading failed</p>
              <p className="mt-1 text-sm text-white/60">{balanceError}</p>
            </div>
          )}

          {balanceData && (
            <div className="mt-6 rounded-2xl border border-orange-300/20 bg-black/30 p-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-white/40">
                    Real on-chain balance
                  </p>
                  <p className="mt-2 text-3xl font-bold text-orange-200">
                    {balanceData.total.formatted} {balanceData.symbol}
                  </p>
                </div>

                <div className="rounded-full border border-green-400/20 bg-green-400/10 px-4 py-2 text-sm text-green-200">
                  Live data
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {balanceData.balances.map((balance) => (
                  <div
                    key={balance.chain}
                    className="rounded-xl border border-white/10 bg-black/40 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold">{balance.chain}</p>
                      <p
                        className={`text-sm ${
                          balance.status === "success"
                            ? "text-green-200"
                            : "text-red-200"
                        }`}
                      >
                        {balance.status}
                      </p>
                    </div>

                    <p className="mt-3 text-2xl font-bold text-orange-100">
                      {balance.formatted} {balance.symbol}
                    </p>

                    {balance.error && (
                      <p className="mt-2 text-sm text-red-200">{balance.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile && (
            <div className="mt-6 rounded-2xl border border-orange-300/20 bg-orange-300/10 p-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <p className="text-sm text-white/50">Wallet</p>
                  <p className="font-mono text-sm text-orange-100">
                    {profile.shortWallet}
                  </p>
                </div>

                <div className="rounded-full bg-black/30 px-4 py-2 text-sm text-orange-100">
                  Live balance + preview streaks
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-5">
                <Stat label="DCA streak" value="Coming next" />
                <Stat label="No-sell streak" value="Coming next" />
                <Stat label="KENDU held" value={realBalanceText || profile.balance} />
                <Stat label="Chains" value={activeChainsText || profile.chains} />
                <Stat
                  label="Rank"
                  value={hasRealBalance ? "Holder detected" : profile.rank}
                />
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-white/40">
                  Holder badge
                </p>
                <p className="mt-2 text-2xl font-bold text-orange-200">
                  {hasRealBalance ? "KENDU Holder" : "Preview holder"}
                </p>
                <p className="mt-2 text-sm text-white/60">
                  Balance loading is live for Ethereum and Base. DCA streaks, no-sell badges
                  and shareable cards are coming next.
                </p>
              </div>
            </div>
          )}
        </section>

        <section id="how-it-works" className="grid gap-4 py-12 md:grid-cols-3">
          <InfoCard
            title="1. Paste wallet"
            text="Users can check a public wallet address without signing anything."
          />
          <InfoCard
            title="2. Track streaks"
            text="The app will detect KENDU buys, holding time and no-sell behavior."
          />
          <InfoCard
            title="3. Build status"
            text="Holders earn ranks, badges and shareable cards for the community."
          />
        </section>

        <section className="grid gap-6 pb-12 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <p className="text-sm uppercase tracking-[0.25em] text-orange-300">
              Rank system
            </p>
            <h3 className="mt-3 text-2xl font-bold">
              Make DCA feel like progress.
            </h3>

            <div className="mt-6 space-y-3">
              {rankRules.map((rank) => (
                <div
                  key={rank.name}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                    <p className="font-bold text-orange-200">{rank.name}</p>
                    <p className="text-sm text-white/40">{rank.days}</p>
                  </div>
                  <p className="mt-2 text-sm text-white/60">
                    {rank.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <p className="text-sm uppercase tracking-[0.25em] text-orange-300">
              Roadmap
            </p>
            <h3 className="mt-3 text-2xl font-bold">
              From prototype to community tool.
            </h3>

            <div className="mt-6 space-y-3">
              {roadmap.map((item, index) => (
                <div
                  key={item}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-300 font-bold text-black">
                    {index + 1}
                  </div>
                  <p className="text-white/70">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 py-8 text-center text-sm text-white/40">
          Kendu Brew Club is an unofficial community MVP. Built for read-only
          KENDU holder tracking, DCA culture and community status.
        </footer>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>
      <p className="mt-2 text-lg font-bold md:text-xl">{value}</p>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h4 className="text-lg font-bold text-orange-200">{title}</h4>
      <p className="mt-3 text-white/60">{text}</p>
    </div>
  );
}

function shortenWallet(wallet: string) {
  if (wallet.length <= 14) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-6)}`;
}

function getRank(days: number) {
  if (days >= 60) return "Legendary Roast";
  if (days >= 30) return "Diamond Brewer";
  if (days >= 14) return "Cappuccino Chad";
  if (days >= 7) return "Double Shot Chad";
  if (days >= 3) return "Espresso Holder";
  return "Instant Coffee";
}

function getNoSellBadge(days: number) {
  if (days >= 90) return "Diamond Hands";
  if (days >= 30) return "Iron Paws";
  if (days >= 7) return "Steady Holder";
  return "Paper Hands";
}