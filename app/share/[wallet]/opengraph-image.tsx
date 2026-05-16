import { ImageResponse } from "next/og";

export const alt = "Kendu Brew Club shared holder profile";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ wallet: string }>;
}) {
  const { wallet } = await params;
  const decodedWallet = decodeURIComponent(wallet);
  const shortWallet = shortenWallet(decodedWallet);

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
          padding: "72px",
          fontFamily: "Arial",
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
              fontSize: "26px",
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
              flexDirection: "column",
              marginTop: "36px",
              fontSize: "72px",
              lineHeight: 1,
              fontWeight: 900,
            }}
          >
            <div>Shared KENDU</div>
            <div>holder profile</div>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: "34px",
              fontSize: "32px",
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
            justifyContent: "space-between",
            alignItems: "flex-end",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "18px",
              fontSize: "26px",
              color: "#d1d5db",
            }}
          >
            <div>Read-only</div>
            <div>No approvals</div>
            <div>No transactions</div>
          </div>

          <div
            style={{
              display: "flex",
              height: "110px",
              width: "110px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "999px",
              border: "2px solid rgba(253, 186, 116, 0.45)",
              backgroundColor: "rgba(253, 186, 116, 0.12)",
              fontSize: "54px",
              fontWeight: 900,
              color: "#fdba74",
            }}
          >
            K
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

function shortenWallet(wallet: string) {
  if (wallet.length <= 14) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-6)}`;
}