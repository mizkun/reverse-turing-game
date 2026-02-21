import type { Post as PostType } from "../types";
import type { ReactNode } from "react";

interface Props {
  post: PostType;
  isSystem?: boolean;
  headerAction?: ReactNode;
}

export function Post({ post, isSystem, headerAction }: Props) {
  const time = post.createdAt?.toDate
    ? post.createdAt.toDate().toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "";

  return (
    <div className={`post ${isSystem ? "post-system" : ""}`}>
      <div className="post-header">
        <span className="post-number">{post.postNumber}</span>{" "}
        <span className="post-name">
          {isSystem ? "\uD83E\uDD16 管理AI" : post.authorName}
        </span>{" "}
        <span className="post-id">
          ID:{isSystem ? "SYSTEM" : post.authorId}
        </span>{" "}
        <span className="post-time">{time}</span>
        {headerAction}
      </div>
      <div className="post-content">{post.content}</div>
    </div>
  );
}
