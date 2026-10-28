"use client";

// Placeholders shaped like the real rows, shown until the first answer arrives.
// motion-safe: the pulse is skipped for people who turn off animations.

export function Bone({ className = "" }) {
  return <span aria-hidden="true" className={`block bg-[#DCE5F3] motion-safe:animate-pulse ${className}`} />;
}

// Widths vary per row so the list reads as content, not a striped block
const TOPIC_ROWS = [
  ["w-[62%]", "w-[85%]"],
  ["w-[48%]", "w-[70%]"],
  ["w-[70%]", "w-[60%]"],
  ["w-[55%]", "w-[80%]"],
  ["w-[40%]", "w-[66%]"],
  ["w-[64%]", "w-[74%]"],
];

export function TopicListSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading topics" className="space-y-1">
      {TOPIC_ROWS.map(([title, preview], i) => (
        <div key={i} className="flex gap-3 px-4 py-3.5">
          <Bone className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 min-w-0 space-y-2 pt-0.5">
            <div className="flex items-center justify-between gap-3">
              <Bone className={`h-4 rounded-md ${title}`} />
              <Bone className="h-3 w-10 rounded-md shrink-0" />
            </div>
            <Bone className={`h-3.5 rounded-md ${preview}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Alternating bubbles: others on the left with an avatar, yours on the right
const BUBBLES = [
  { mine: false, lines: ["w-[340px]", "w-[220px]"] },
  { mine: false, lines: ["w-[260px]"], card: true },
  { mine: true, lines: ["w-[300px]", "w-[180px]"] },
  { mine: false, lines: ["w-[200px]"] },
  { mine: true, lines: ["w-[240px]"] },
];

export function MessagesSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading messages" className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-[#DCE5F3]" />
        <Bone className="h-3.5 w-14 rounded-md" />
        <div className="flex-1 h-px bg-[#DCE5F3]" />
      </div>
      {BUBBLES.map((b, i) =>
        b.mine ? (
          <div key={i} className="flex flex-col items-end gap-1.5">
            <div className="rounded-2xl bg-[#DCE7FB] border border-[#C9DAF8] px-4 py-3.5 space-y-2 max-w-[60%]">
              {b.lines.map((w, j) => (
                <Bone key={j} className={`h-3.5 rounded-md max-w-full bg-[#C9DAF8] ${w}`} />
              ))}
            </div>
            <Bone className="h-3 w-12 rounded-md" />
          </div>
        ) : (
          <div key={i} className="flex gap-3">
            <Bone className="w-9 h-9 rounded-full shrink-0" />
            <div className="min-w-0 max-w-[60%] space-y-2">
              <Bone className="h-3.5 w-32 rounded-md" />
              <div className="rounded-2xl bg-white border border-[#E2E8F0] px-4 py-3.5 space-y-2">
                {b.lines.map((w, j) => (
                  <Bone key={j} className={`h-3.5 rounded-md max-w-full ${w}`} />
                ))}
                {b.card && (
                  <div className="flex items-center gap-3 pt-1">
                    <Bone className="w-11 h-11 rounded-lg shrink-0" />
                    <div className="space-y-1.5">
                      <Bone className="h-3.5 w-40 rounded-md" />
                      <Bone className="h-3 w-24 rounded-md" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

// Whole right panel while no topic is open yet: header, messages, composer
export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between gap-4 px-7 py-5 border-b border-[#DCE5F3] shrink-0">
        <div className="space-y-2.5 min-w-0 flex-1">
          <Bone className="h-6 w-[45%] rounded-lg" />
          <Bone className="h-3.5 w-[30%] rounded-md" />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex -space-x-2">
            {[0, 1, 2].map((i) => (
              <Bone key={i} className="w-9 h-9 rounded-full ring-2 ring-[#F2F7FF]" />
            ))}
          </div>
          <Bone className="h-10 w-[132px] rounded-full" />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden px-7 py-5">
        <MessagesSkeleton />
      </div>
      <div className="px-7 pb-6 pt-6 shrink-0">
        <div className="h-[118px] rounded-2xl bg-white border border-[#E2E8F0] px-5 py-4 flex flex-col justify-between">
          <Bone className="h-4 w-[38%] rounded-md bg-[#EEF2F7]" />
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <Bone className="w-9 h-9 rounded-full bg-[#EEF2F7]" />
              <Bone className="w-[140px] h-9 rounded-full bg-[#EEF2F7]" />
            </div>
            <Bone className="w-[104px] h-11 rounded-full bg-[#EEF2F7]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RepliesSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading replies" className="space-y-4">
      {[
        ["w-[80%]", "w-[55%]"],
        ["w-[65%]"],
        ["w-[75%]", "w-[40%]"],
      ].map((lines, i) => (
        <div key={i} className="flex gap-2.5">
          <Bone className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2 pt-0.5">
            <Bone className="h-3.5 w-28 rounded-md" />
            {lines.map((w, j) => (
              <Bone key={j} className={`h-3.5 rounded-md ${w}`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PeopleSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading people" className="py-2">
      {["w-36", "w-28", "w-40", "w-32", "w-24"].map((w, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-2.5">
          <Bone className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Bone className={`h-3.5 rounded-md ${w}`} />
            <Bone className="h-3 w-24 rounded-md" />
          </div>
          <Bone className="w-[18px] h-[18px] rounded" />
        </div>
      ))}
    </div>
  );
}