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
// Re-export axios as named export for convenience
export { default } from "./axios";

