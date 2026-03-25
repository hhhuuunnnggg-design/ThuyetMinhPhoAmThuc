// api/index.ts - Export all APIs from one place
export * from "./auth.api";
export { default as axios } from "./axios";
export * from "./chatbot.api";
export * from "./comment.api";
export * from "./permission.api";
export * from "./post.api";
export * from "./role.api";
export * from "./tts.api";
export * from "./user.api";
export * from "./adminPoi.api";
export * from "./app.api";
export * from "./narrationLog.api";
// Re-export axios as named export for convenience
export { default } from "./axios";

