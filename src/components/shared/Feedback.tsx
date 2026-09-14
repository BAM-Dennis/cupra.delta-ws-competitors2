import { MAX_POINTS_PER_FEATURE } from "@/engine/config";
import { Glyph, PointsBadge } from "./bits";

/** Platzhalter-Gestaltung für das Feedback-Element (Briefing US-4: kommt vom Grafiker). */
export function FeedbackBubble({ children, points, max = MAX_POINTS_PER_FEATURE, label = "Coach" }: { children: React.ReactNode; points?: number; max?: number; label?: string }) {
  return (
    <div className="flex max-w-[92%] items-start gap-2.5 self-start">
      <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full border border-teal/40 bg-teal-tint">
        <Glyph name="spark" className="size-3.5 text-teal" />
      </span>
      <div className="flex min-w-0 flex-col gap-1.5 rounded-[12px] rounded-tl-[4px] border border-teal/30 bg-teal/10 px-4 py-3 backdrop-blur-[10px]">
        {points !== undefined && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-medium uppercase tracking-[1px] text-teal">{label}</span>
            <PointsBadge points={points} max={max} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Criterion({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.5px] ${ok ? "border-correct/50 bg-correct/15 text-white" : "border-white/15 text-white/40"}`}>
      <Glyph name={ok ? "check" : "x"} className="size-3" />
      {label}
    </span>
  );
}
