import type { Post as PostType } from "../types";

interface Props {
  post: PostType;
  isSystem?: boolean;
}

export function Post({ post, isSystem }: Props) {
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
        <span className="post-number">&gt;&gt;{post.postNumber}</span>{" "}
        <span className="post-name">
          {isSystem ? "\uD83E\uDD16 管理AI" : post.authorName}
        </span>{" "}
        <span className="post-id">
          ID:{isSystem ? "SYSTEM" : post.authorId}
        </span>{" "}
        <span className="post-time">{time}</span>
      </div>
      <div className="post-content">{post.content}</div>
    </div>
  );
}
