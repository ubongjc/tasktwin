"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

export function useWebSocket(userId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Initialize socket connection
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000", {
      auth: {
        userId,
        token: "clerk-token", // Will be replaced with actual Clerk token
      },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    });

    newSocket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [userId]);

  return { socket, isConnected };
}

// Matching hooks
export function useMatchQueue(socket: Socket | null) {
  const [status, setStatus] = useState<"idle" | "waiting" | "matched">("idle");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("match:joined", () => {
      setStatus("waiting");
    });

    socket.on("match:left", () => {
      setStatus("idle");
    });

    socket.on("match:found", (data) => {
      setStatus("matched");
      setRoomId(data.roomId);
      setPartnerId(data.partnerId);
    });

    return () => {
      socket.off("match:joined");
      socket.off("match:left");
      socket.off("match:found");
    };
  }, [socket]);

  const joinQueue = (topic: string, intent: string[], preferences?: Record<string, any>) => {
    if (!socket) return;
    socket.emit("match:join", { topic, intent, preferences });
  };

  const leaveQueue = () => {
    if (!socket) return;
    socket.emit("match:leave");
    setStatus("idle");
  };

  return {
    status,
    roomId,
    partnerId,
    joinQueue,
    leaveQueue,
  };
}

// Room hooks
export function useRoom(socket: Socket | null, roomId: string) {
  const [room, setRoom] = useState<any>(null);
  const [participants, setParticipants] = useState<string[]>([]);

  useEffect(() => {
    if (!socket || !roomId) return;

    // Join room
    socket.emit("room:join", { roomId });

    socket.on("room:updated", (data) => {
      setRoom(data.room);
    });

    socket.on("room:participant:joined", (data) => {
      setParticipants((prev) => [...prev, data.userId]);
    });

    return () => {
      socket.off("room:updated");
      socket.off("room:participant:joined");
    };
  }, [socket, roomId]);

  const performAction = (action: "start" | "pause" | "resume" | "end") => {
    if (!socket) return;
    socket.emit("room:action", { roomId, action });
  };

  return {
    room,
    participants,
    performAction,
  };
}

// Checklist hooks
export function useChecklist(socket: Socket | null, roomId: string) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!socket || !roomId) return;

    socket.on("checklist:item:updated", (data) => {
      setItems((prev) =>
        prev.map((item) => (item.id === data.item.id ? data.item : item))
      );
    });

    return () => {
      socket.off("checklist:item:updated");
    };
  }, [socket, roomId]);

  const toggleItem = (itemId: string, completed: boolean) => {
    if (!socket) return;
    socket.emit("checklist:update", { roomId, itemId, completed });
  };

  return {
    items,
    setItems,
    toggleItem,
  };
}
