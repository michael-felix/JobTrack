import { describe, expect, it } from "vitest";
import { daysSince, isFollowUpOverdue, isStale, suggestsRejection, STALE_DAYS, SUGGEST_REJECT_DAYS } from "@/lib/staleness";

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

describe("isStale", () => {
  it("is false for a recently updated application", () => {
    expect(isStale({ stage: "APPLIED", updatedAt: daysAgo(1) })).toBe(false);
  });

  it("is true once updatedAt crosses STALE_DAYS", () => {
    expect(isStale({ stage: "APPLIED", updatedAt: daysAgo(STALE_DAYS) })).toBe(true);
  });

  it("is false for terminal stages no matter how old", () => {
    expect(isStale({ stage: "REJECTED", updatedAt: daysAgo(200) })).toBe(false);
    expect(isStale({ stage: "OFFER", updatedAt: daysAgo(200) })).toBe(false);
  });
});

describe("suggestsRejection", () => {
  it("is false before SUGGEST_REJECT_DAYS", () => {
    expect(suggestsRejection({ stage: "INTERVIEW", updatedAt: daysAgo(STALE_DAYS) })).toBe(false);
  });

  it("is true once updatedAt crosses SUGGEST_REJECT_DAYS", () => {
    expect(suggestsRejection({ stage: "INTERVIEW", updatedAt: daysAgo(SUGGEST_REJECT_DAYS) })).toBe(true);
  });

  it("is false for terminal stages", () => {
    expect(suggestsRejection({ stage: "REJECTED", updatedAt: daysAgo(200) })).toBe(false);
  });
});

describe("isFollowUpOverdue", () => {
  it("is false with no follow-up date", () => {
    expect(isFollowUpOverdue({ stage: "APPLIED", followUpDate: null })).toBe(false);
  });

  it("is true once the date is in the past", () => {
    expect(isFollowUpOverdue({ stage: "APPLIED", followUpDate: daysAgo(1) })).toBe(true);
  });

  it("is false for a future date", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(isFollowUpOverdue({ stage: "APPLIED", followUpDate: future })).toBe(false);
  });

  it("is false once the application is terminal, even if overdue", () => {
    expect(isFollowUpOverdue({ stage: "REJECTED", followUpDate: daysAgo(5) })).toBe(false);
  });
});

describe("daysSince", () => {
  it("rounds down to whole days", () => {
    const twoAndHalfDaysAgo = new Date(Date.now() - 2.5 * 86_400_000).toISOString();
    expect(daysSince(twoAndHalfDaysAgo)).toBe(2);
  });
});
