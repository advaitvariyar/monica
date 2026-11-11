import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const heatClass = [
  "bg-heat-0",
  "bg-heat-1",
  "bg-heat-2",
  "bg-heat-3",
  "bg-heat-4",
  "bg-heat-5",
] as const;

// Illustration only: how many of 5 friends are free, 5 PM–10 PM, Fri–Thu.
const sample = [
  [2, 1, 2, 0, 1, 1, 2],
  [3, 2, 3, 1, 2, 2, 3],
  [4, 5, 4, 2, 3, 3, 3],
  [5, 5, 4, 2, 3, 4, 3],
  [5, 5, 3, 2, 3, 4, 3],
  [5, 4, 2, 2, 3, 4, 3],
  [4, 3, 1, 1, 2, 3, 2],
  [3, 2, 1, 1, 2, 2, 1],
  [2, 1, 0, 0, 1, 1, 1],
  [1, 1, 0, 0, 1, 1, 0],
];
const days = ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"];
const hours = ["5 PM", "", "6 PM", "", "7 PM", "", "8 PM", "", "9 PM", ""];

export default function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col px-4 sm:px-6">
      <header className="flex h-14 items-center justify-between">
        <span className="text-lg font-semibold tracking-tight">monica</span>
        <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
          Log in
        </Link>
      </header>

      <section className="flex flex-col items-center gap-6 py-16 text-center sm:py-24">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Find a time that works for everyone.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Share when you&apos;re free, and Monica finds when your friends overlap. Propose a few
          times, send one email, and let everyone vote.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            Get started
          </Link>
        </div>
      </section>

      <figure className="mx-auto mb-16 w-full max-w-xl rounded-xl border bg-card p-5">
        <div className="overflow-x-auto">
          <div className="grid min-w-[360px] grid-cols-[48px_repeat(7,minmax(0,1fr))] gap-1" aria-hidden>
            <span />
            {days.map((d) => (
              <span key={d} className="pb-1 text-center text-xs font-medium text-muted-foreground">
                {d}
              </span>
            ))}
            {sample.map((row, r) => (
              <div key={r} className="contents">
                <span className="font-mono text-[11px] leading-4 text-muted-foreground">{hours[r]}</span>
                {row.map((n, d) => (
                  <span
                    key={d}
                    className={cn("h-4 rounded-[3px]", heatClass[n], r >= 3 && r <= 5 && d === 1 && "ring-2 ring-foreground ring-inset")}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <figcaption className="mt-4 text-sm text-muted-foreground">
          Darker means more friends are free. Saturday 6:30–8 PM works for all five.
        </figcaption>
      </figure>
    </main>
  );
}
