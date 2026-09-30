import { ParticipantApp } from "@/components/participant/ParticipantApp";
import { normalizeCode } from "@/lib/participant";

export default async function ParticipantPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <ParticipantApp code={normalizeCode(code)} />
    </main>
  );
}
