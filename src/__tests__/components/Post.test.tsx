import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Post } from "../../components/Post";
import type { Post as PostType } from "../../types";
import { Timestamp } from "firebase/firestore";

function makePost(overrides: Partial<PostType> = {}): PostType {
  return {
    threadId: "thread0",
    postNumber: 2,
    authorId: "abc12345",
    authorName: "名無しさん",
    content: "テスト投稿です",
    createdAt: Timestamp.fromDate(new Date("2026-02-21T12:00:00")),
    ...overrides,
  };
}

describe("Post", () => {
  it("投稿番号、著者名、ID、内容を表示する", () => {
    render(<Post post={makePost()} />);
    expect(screen.getByText(/>>2/)).toBeInTheDocument();
    expect(screen.getByText("名無しさん")).toBeInTheDocument();
    expect(screen.getByText(/ID:abc12345/)).toBeInTheDocument();
    expect(screen.getByText("テスト投稿です")).toBeInTheDocument();
  });

  it("システム投稿の場合は管理AIと表示する", () => {
    render(<Post post={makePost()} isSystem={true} />);
    expect(screen.getByText(/管理AI/)).toBeInTheDocument();
    expect(screen.getByText(/ID:SYSTEM/)).toBeInTheDocument();
  });

  it("通常投稿の場合は authorId を表示する", () => {
    render(<Post post={makePost({ authorId: "xyz99999" })} />);
    expect(screen.getByText(/ID:xyz99999/)).toBeInTheDocument();
  });
});
