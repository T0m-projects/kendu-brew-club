"use client";

import { useState } from "react";

export default function Home() {
  const [wallet, setWallet] = useState("");

  const hasWallet = wallet.trim().length > 0;

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
            MVP Demo
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
              Kendu Brew Club turns daily KENDU buying and holding into a
              community challenge with streaks, ranks, no-sell status and
              shareable holder cards.
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
          <h3 className="text-2xl font-bold">Wallet checker</h3>
          <p className="mt-2 text-white/60">
            First version will be read-only. Users can paste a public wallet
            address without connecting their wallet.
          </p>

          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            <input
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="Paste ETH / Base / Solana wallet address"
              className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-orange-300"
            />

            <button className="rounded-xl bg-orange-300 px-6 py-3 font-bold text-black transition hover:bg-orange-200">
              Check status
            </button>
          </div>

          {hasWallet && (
            <div className="mt-6 rounded-2xl border border-orange-300/20 bg-orange-300/10 p-5">
              <p className="text-sm text-white/50">Wallet</p>
              <p className="break-all font-mono text-sm text-orange-100">
                {wallet}
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <Stat label="DCA streak" value="Demo" />
                <Stat label="No-sell streak" value="Demo" />
                <Stat label="Rank" value="Pending" />
                <Stat label="Share card" value="Soon" />
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
            text="The app detects KENDU buys, holding time and no-sell behavior."
          />
          <InfoCard
            title="3. Build status"
            text="Holders earn ranks, badges and shareable cards for the community."
          />
        </section>
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
      <p className="mt-2 text-xl font-bold">{value}</p>
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