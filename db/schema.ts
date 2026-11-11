import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

// Column names are converted to snake_case by the `casing` option
// (see db/index.ts and drizzle.config.ts).

const id = () => text().primaryKey().$defaultFn(() => crypto.randomUUID());
const ts = () => timestamp({ withTimezone: true });
const createdAt = () => ts().notNull().defaultNow();
const updatedAt = () =>
  ts()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/* ------------------------------------------------------------------ */
/* Better Auth tables (field names must match Better Auth's model)     */
/* ------------------------------------------------------------------ */

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  /** IANA timezone, e.g. "America/Los_Angeles". */
  timezone: text().notNull().default("UTC"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = pgTable(
  "session",
  {
    id: text().primaryKey(),
    expiresAt: ts().notNull(),
    token: text().notNull().unique(),
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: ts(),
    refreshTokenExpiresAt: ts(),
    scope: text(),
    password: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: ts().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.identifier)],
);

/* ------------------------------------------------------------------ */
/* Availability                                                        */
/* ------------------------------------------------------------------ */

/** Weekly recurring free time, stored as wall-clock minutes in `timezone`. */
export const availabilityRule = pgTable(
  "availability_rule",
  {
    id: id(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** 0 = Sunday … 6 = Saturday (matches Date#getDay). */
    dayOfWeek: smallint().notNull(),
    /** Minutes since local midnight, [startMinute, endMinute). */
    startMinute: smallint().notNull(),
    endMinute: smallint().notNull(),
    timezone: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index().on(t.userId),
    check("day_of_week_range", sql`${t.dayOfWeek} between 0 and 6`),
    check(
      "minute_range",
      sql`${t.startMinute} >= 0 and ${t.endMinute} <= 1440 and ${t.startMinute} < ${t.endMinute}`,
    ),
  ],
);

export const overrideKind = pgEnum("override_kind", ["available", "busy"]);

/** One-time block that adds free time or blocks it out. Instants in UTC. */
export const availabilityOverride = pgTable(
  "availability_override",
  {
    id: id(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    startsAt: ts().notNull(),
    endsAt: ts().notNull(),
    kind: overrideKind().notNull(),
    note: text(),
    createdAt: createdAt(),
  },
  (t) => [
    index().on(t.userId, t.startsAt),
    check("override_order", sql`${t.endsAt} > ${t.startsAt}`),
  ],
);

/* ------------------------------------------------------------------ */
/* Groups                                                              */
/* ------------------------------------------------------------------ */

export const group = pgTable("group", {
  id: id(),
  name: text().notNull(),
  emoji: text(),
  ownerId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const memberRole = pgEnum("member_role", ["owner", "member"]);

export const groupMember = pgTable(
  "group_member",
  {
    groupId: text()
      .notNull()
      .references(() => group.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: memberRole().notNull().default("member"),
    joinedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.userId] }), index().on(t.userId)],
);

export const groupInvite = pgTable(
  "group_invite",
  {
    id: id(),
    groupId: text()
      .notNull()
      .references(() => group.id, { onDelete: "cascade" }),
    email: text().notNull(),
    /** SHA-256 of the token in the invite link; the raw token is never stored. */
    tokenHash: text().notNull().unique(),
    invitedBy: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    expiresAt: ts().notNull(),
    acceptedAt: ts(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.groupId), index().on(t.email)],
);

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

export const eventStatus = pgEnum("event_status", ["polling", "scheduled", "cancelled"]);

export const event = pgTable(
  "event",
  {
    id: id(),
    groupId: text()
      .notNull()
      .references(() => group.id, { onDelete: "cascade" }),
    creatorId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text().notNull(),
    description: text(),
    location: text(),
    durationMinutes: integer().notNull(),
    /** Date range the creator wants to search for times in. */
    windowStart: ts().notNull(),
    windowEnd: ts().notNull(),
    status: eventStatus().notNull().default("polling"),
    finalSlotId: text().references((): AnyPgColumn => eventSlot.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index().on(t.groupId),
    check("duration_positive", sql`${t.durationMinutes} > 0`),
    check("window_order", sql`${t.windowEnd} > ${t.windowStart}`),
  ],
);

export const eventSlot = pgTable(
  "event_slot",
  {
    id: id(),
    eventId: text()
      .notNull()
      .references((): AnyPgColumn => event.id, { onDelete: "cascade" }),
    startsAt: ts().notNull(),
    endsAt: ts().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.eventId), check("slot_order", sql`${t.endsAt} > ${t.startsAt}`)],
);

export const rsvpStatus = pgEnum("rsvp_status", ["going", "maybe", "no"]);

/** Everyone invited to an event. Guests have no userId and use their link token. */
export const eventInvitee = pgTable(
  "event_invitee",
  {
    id: id(),
    eventId: text()
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    email: text().notNull(),
    name: text(),
    userId: text().references(() => user.id, { onDelete: "set null" }),
    tokenHash: text().notNull().unique(),
    rsvp: rsvpStatus(),
    respondedAt: ts(),
    createdAt: createdAt(),
  },
  (t) => [unique().on(t.eventId, t.email), index().on(t.userId)],
);

export const voteResponse = pgEnum("vote_response", ["yes", "maybe", "no"]);

export const slotVote = pgTable(
  "slot_vote",
  {
    slotId: text()
      .notNull()
      .references(() => eventSlot.id, { onDelete: "cascade" }),
    inviteeId: text()
      .notNull()
      .references(() => eventInvitee.id, { onDelete: "cascade" }),
    response: voteResponse().notNull(),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.slotId, t.inviteeId] }), index().on(t.inviteeId)],
);

/* ------------------------------------------------------------------ */
/* Email log                                                           */
/* ------------------------------------------------------------------ */

export const emailKind = pgEnum("email_kind", [
  "group_invite",
  "event_invite",
  "event_confirmed",
  "event_reminder",
]);

export const emailLog = pgTable(
  "email_log",
  {
    id: id(),
    kind: emailKind().notNull(),
    groupId: text().references(() => group.id, { onDelete: "cascade" }),
    eventId: text().references(() => event.id, { onDelete: "cascade" }),
    sentBy: text().references(() => user.id, { onDelete: "set null" }),
    recipientCount: integer().notNull(),
    providerBatchId: text(),
    sentAt: createdAt(),
  },
  (t) => [index().on(t.eventId), index().on(t.groupId)],
);
