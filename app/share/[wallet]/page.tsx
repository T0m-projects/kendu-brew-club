import type { Metadata } from "next";
import { validateWalletAddress } from "../../../lib/wallet";
import { ShareProfileClient } from "./ShareProfileClient";

type SharePageProps = {
  params: Promise<{ wallet: string }>;
};

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { wallet } = await params;
  const decodedWallet = decodeURIComponent(wallet);
  const validation = validateWalletAddress(decodedWallet);
  const shortWallet = shortenWallet(decodedWallet);

  const title =
    validation.isValid && validation.type === "evm"
      ? `${shortWallet} · KENDU Brew Club`
      : "KENDU Brew Club";

  const description =
    validation.isValid && validation.type === "evm"
      ? "Shared read-only KENDU holder profile with Ethereum/Base balance and transfer-based activity data. No wallet connection. No approvals. No transactions."
      : "A read-only community tool for KENDU holders. No wallet connection. No approvals. No transactions.";

  const siteUrl = process.env.SITE_URL || "http://localhost:3000";
  const encodedWallet = encodeURIComponent(decodedWallet);

  const pageUrl = `${siteUrl}/share/${encodedWallet}`;
  const imageUrl = `${siteUrl}/share/${encodedWallet}/opengraph-image?og=3`;

return {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: {
    canonical: pageUrl,
  },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Kendu Brew Club",
      url: pageUrl,
      images: [
      {
        url: imageUrl,
        secureUrl: imageUrl,
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Kendu Brew Club shared holder profile",
      },
    ],
},
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [
    {
        url: imageUrl,
        secureUrl: imageUrl,
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Kendu Brew Club shared holder profile",
    },
    ],
  },
};
}

export default async function SharePage({ params }: SharePageProps) {
  const { wallet } = await params;

  return <ShareProfileClient wallet={decodeURIComponent(wallet)} />;
}

function shortenWallet(wallet: string) {
  if (wallet.length <= 14) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-6)}`;
}