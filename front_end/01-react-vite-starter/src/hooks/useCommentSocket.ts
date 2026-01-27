import { Client } from "@stomp/stompjs";
import { useEffect, useRef } from "react";
import SockJS from "sockjs-client";

export function useCommentSocket(
  postId: number | null,
  onNewComment: (data: any) => void
) {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!postId) return;

    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      console.log("🟢 Connected to WebSocket on postId:", postId);
      client.subscribe(`/topic/comments/${postId}`, (message) => {
        try {
          const data = JSON.parse(message.body);
          onNewComment(data);
        } catch (e) {
          // fallback nếu không phải JSON
          console.log("🟢 đây chính là error: ", e);
        }
      });
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
    // eslint-disable-next-line
  }, [postId]);
}
