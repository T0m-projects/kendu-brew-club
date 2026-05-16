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

  const imageUrl = `/share/${encodeURIComponent(decodedWallet)}/opengraph-image`;

  return {
    metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "KENDU Brew Club",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "KENDU Brew Club shared holder profile",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
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