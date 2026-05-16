import { ImageResponse } from "next/og";

export const alt = "Kendu Brew Club shared holder profile";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

type BalanceApiResponse = {
  symbol: string;
  total: {
    raw: string;
    formatted: string;
  };
  balances: {
    chain: string;
    raw: string;
  }[];
};

type ActivityApiResponse = {
  summary: {
    possibleDcaDays: number;
    outflowDays: number;
    recentEvents: number;
  };
};

export default async function Image({
  params,
}: {
  params: Promise<{ wallet: string }>;
}) {
  const { wallet } = await params;
  const decodedWallet = decodeURIComponent(wallet);
  const shortWallet = shortenWallet(decodedWallet);

  const profile = await loadProfileData(decodedWallet);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#070707",
          backgroundImage:
            "linear-gradient(135deg, #070707 0%, #1f1306 55%, #000000 100%)",
          color: "white",
          padding: "64px",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "24px",
                letterSpacing: "8px",
                textTransform: "uppercase",
                color: "#fdba74",
                fontWeight: 700,
              }}
            >
              KENDU BREW CLUB
            </div>

            <div
              style={{
                display: "flex",
                marginTop: "28px",
                fontSize: "64px",
                lineHeight: 1,
                fontWeight: 900,
              }}
            >
              {profile.badge}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: "18px",
                fontSize: "28px",
                color: "#fed7aa",
                fontWeight: 700,
              }}
            >
              {shortWallet}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              height: "100px",
              width: "100px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "999px",
              border: "2px solid rgba(253, 186, 116, 0.45)",
              backgroundColor: "rgba(253, 186, 116, 0.12)",
              fontSize: "52px",
              fontWeight: 900,
              color: "#fdba74",
            }}
          >
            K
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "18px",
            width: "100%",
          }}
        >
          <StatBox label="KENDU held" value={profile.balance} large />
          <StatBox label="Possible DCA days" value={profile.possibleDcaDays} />
          <StatBox label="Outflow days" value={profile.outflowDays} />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "30px",
                fontWeight: 800,
                color: "#fed7aa",
              }}
            >
              {profile.status}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: "22px",
                color: "#d1d5db",
              }}
            >
              Chains: {profile.chains}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
              fontSize: "22px",
              color: "#d1d5db",
            }}
          >
            <div>Read-only</div>
            <div>No approvals</div>
            <div>No transactions</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

function StatBox({
  label,
  value,
  large = false,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: large ? 1.5 : 1,
        border: "1px solid rgba(255, 255, 255, 0.12)",
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        borderRadius: "24px",
        padding: "28px",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: "18px",
          letterSpacing: "4px",
          textTransform: "uppercase",
          color: "#9ca3af",
          fontWeight: 700,
        }}
      >
        {label}
      </div>

      <div
        style={{
          display: "flex",
          marginTop: "16px",
          fontSize: large ? "42px" : "48px",
          lineHeight: 1,
          color: "#ffedd5",
          fontWeight: 900,
        }}
      >
        {value}
      </div>
    </div>
  );
}

async function loadProfileData(wallet: string) {
  const siteUrl = getSiteUrl();
  const encodedWallet = encodeURIComponent(wallet);

  try {
    const [balanceResponse, activityResponse] = await Promise.all([
      fetch(`${siteUrl}/api/balance?wallet=${encodedWallet}`, {
        cache: "no-store",
      }),
      fetch(`${siteUrl}/api/activity?wallet=${encodedWallet}`, {
        cache: "no-store",
      }),
    ]);

    if (!balanceResponse.ok || !activityResponse.ok) {
      throw new Error("Profile API failed.");
    }

    const balanceData = (await balanceResponse.json()) as BalanceApiResponse;
    const activityData =
      (await activityResponse.json()) as ActivityApiResponse;

    const possibleDcaDays = activityData.summary.possibleDcaDays;
    const outflowDays = activityData.summary.outflowDays;

    const chains =
      balanceData.balances
        .filter((balance) => balance.raw !== "0")
        .map((balance) => balance.chain)
        .join(" / ") || "No KENDU detected";

    return {
      balance: `${compactNumber(balanceData.total.formatted)} ${
        balanceData.symbol
      }`,
      possibleDcaDays: String(possibleDcaDays),
      outflowDays: String(outflowDays),
      status: getHolderStatus(outflowDays),
      badge: getHolderBadge(possibleDcaDays, outflowDays),
      chains,
    };
  } catch {
    return {
      balance: "KENDU profile",
      possibleDcaDays: "—",
      outflowDays: "—",
      status: "Read-only holder profile",
      badge: "KENDU Holder",
      chains: "Ethereum / Base",
    };
  }
}

function getSiteUrl() {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

function compactNumber(value: string) {
  const numericValue = Number(value.replaceAll(",", ""));

  if (!Number.isFinite(numericValue)) {
    return value;
  }

  if (numericValue >= 1_000_000_000) {
    return `${trimNumber(numericValue / 1_000_000_000)}B`;
  }

  if (numericValue >= 1_000_000) {
    return `${trimNumber(numericValue / 1_000_000)}M`;
  }

  if (numericValue >= 1_000) {
    return `${trimNumber(numericValue / 1_000)}K`;
  }

  return value;
}

function trimNumber(value: number) {
  return value.toFixed(2).replace(/\.?0+$/, "");
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