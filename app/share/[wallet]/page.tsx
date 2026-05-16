import { ShareProfileClient } from "./ShareProfileClient";

export default async function SharePage({
  params,
}: {
  params: Promise<{ wallet: string }>;
}) {
  const { wallet } = await params;

  return <ShareProfileClient wallet={decodeURIComponent(wallet)} />;
}