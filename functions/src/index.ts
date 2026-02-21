import { initializeApp } from "firebase-admin/app";

initializeApp();

export { createRoom } from "./createRoom";
export { verifyHost } from "./verifyHost";
export { startRound } from "./startRound";
export { joinAsDetective } from "./joinAsDetective";
export { verifySpyToken } from "./verifySpyToken";
export { submitPost } from "./submitPost";
export { reportId } from "./reportId";
export { revealResults } from "./revealResults";
export { aiPostScheduler } from "./aiScheduler";
export { tickAiPosts } from "./tickAiPosts";
