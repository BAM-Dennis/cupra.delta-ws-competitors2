import { TrainerApp } from "@/components/trainer/TrainerApp";
import { normalizeCode } from "@/lib/participant";

export default async function TrainerPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <TrainerApp code={normalizeCode(code)} />;
}
