import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePlayerRole } from "../../hooks/usePlayerRole";

describe("usePlayerRole", () => {
  beforeEach(() => {
    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      const name = c.trim().split("=")[0];
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
  });

  it("Cookie がない場合、探偵として判定される", () => {
    const { result } = renderHook(() => usePlayerRole("room1"));
    expect(result.current.isSpy).toBe(false);
    expect(result.current.spyToken).toBeNull();
    expect(result.current.spyAuthorId).toBeNull();
  });

  it("正しい roomId の Cookie がある場合、スパイとして判定される", () => {
    document.cookie = "spy_token=token123;path=/";
    document.cookie = "spy_author_id=author456;path=/";
    document.cookie = "spy_room_id=room1;path=/";

    const { result } = renderHook(() => usePlayerRole("room1"));
    expect(result.current.isSpy).toBe(true);
    expect(result.current.spyToken).toBe("token123");
    expect(result.current.spyAuthorId).toBe("author456");
  });

  it("異なる roomId の Cookie がある場合、スパイではない", () => {
    document.cookie = "spy_token=token123;path=/";
    document.cookie = "spy_author_id=author456;path=/";
    document.cookie = "spy_room_id=other_room;path=/";

    const { result } = renderHook(() => usePlayerRole("room1"));
    expect(result.current.isSpy).toBe(false);
    expect(result.current.spyAuthorId).toBeNull();
  });

  it("Cookie が部分的にしかない場合、スパイではない", () => {
    document.cookie = "spy_token=token123;path=/";
    // spy_author_id と spy_room_id がない

    const { result } = renderHook(() => usePlayerRole("room1"));
    expect(result.current.isSpy).toBe(false);
  });
});
