import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBar } from "../../components/StatusBar";
import type { Room } from "../../types";
import { Timestamp } from "firebase/firestore";

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    status: "playing",
    settings: { spySlots: 2, roundMinutes: 7 },
    detectiveCount: 3,
    activeIds: ["id1", "id2", "id3"],
    eliminatedIds: ["id4"],
    createdAt: Timestamp.now(),
    roundStartedAt: Timestamp.now(),
    roundEndsAt: Timestamp.fromDate(
      new Date(Date.now() + 5 * 60 * 1000)
    ),
    ...overrides,
  };
}

describe("StatusBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("生存ID数と排除済み数を表示する", () => {
    const room = makeRoom();
    render(<StatusBar room={room} hasReported={false} />);
    expect(screen.getByText(/生存ID: 3\/4/)).toBeInTheDocument();
    expect(screen.getByText(/排除済み: 1/)).toBeInTheDocument();
  });

  it("未通報時は残り弾1を表示する", () => {
    const room = makeRoom();
    render(<StatusBar room={room} hasReported={false} />);
    expect(screen.getByText(/残り弾: 1/)).toBeInTheDocument();
  });

  it("通報済みの場合は通報済みを表示する", () => {
    const room = makeRoom();
    render(<StatusBar room={room} hasReported={true} />);
    expect(screen.getByText(/通報済み/)).toBeInTheDocument();
  });
});
