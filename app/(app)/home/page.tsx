import { CalendarDays, Users, Vote } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Home" };

// Placeholder sections; real data arrives in roadmap phases 4–6.
export default function HomePage() {
  return (
    <>
      <PageHeader title="Home" description="What's coming up with your friends." />
      <div className="grid gap-8">
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Needs your vote</h2>
          <EmptyState icon={Vote} message="No open polls. When a friend proposes times, they show up here." />
        </section>
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Upcoming</h2>
          <EmptyState icon={CalendarDays} message="Nothing scheduled yet." />
        </section>
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Your groups</h2>
          <EmptyState icon={Users} message="Create a group and invite friends to start planning." />
        </section>
      </div>
    </>
  );
}
