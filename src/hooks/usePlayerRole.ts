function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

export function usePlayerRole(roomId: string) {
  const spyToken = getCookie("spy_token");
  const spyAuthorId = getCookie("spy_author_id");
  const spyRoomId = getCookie("spy_room_id");

  const isSpy = !!(spyToken && spyAuthorId && spyRoomId === roomId);

  return {
    isSpy,
    spyToken,
    spyAuthorId: isSpy ? spyAuthorId : null,
  };
}
