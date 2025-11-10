"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  Square,
  Users,
  CheckCircle2,
  Circle
} from "lucide-react";
import { formatDuration } from "@/lib/utils";

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();

  const [room, setRoom] = useState<any>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60); // 25 minutes
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [checklist, setChecklist] = useState<any[]>([]);

  useEffect(() => {
    // Fetch room data
    const fetchRoom = async () => {
      try {
        const response = await fetch(`/api/room/${roomId}`);
        if (response.ok) {
          const data = await response.json();
          setRoom(data.room);
          setChecklist(data.room.checklist || []);

          // Calculate time remaining if session is active
          if (data.room.status === "ACTIVE" && data.room.endAt) {
            const now = new Date();
            const end = new Date(data.room.endAt);
            const remaining = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
            setSecondsRemaining(remaining);
            setIsActive(true);
          }
        }
      } catch (error) {
        console.error("Error fetching room:", error);
      }
    };

    fetchRoom();
  }, [roomId]);

  // Timer countdown
  useEffect(() => {
    if (!isActive || isPaused) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          handleEndSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused]);

  const handleStart = async () => {
    try {
      await fetch(`/api/room/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      setIsActive(true);
      setIsPaused(false);
    } catch (error) {
      console.error("Error starting session:", error);
    }
  };

  const handlePause = async () => {
    try {
      await fetch(`/api/room/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause" }),
      });
      setIsPaused(true);
    } catch (error) {
      console.error("Error pausing session:", error);
    }
  };

  const handleResume = async () => {
    try {
      await fetch(`/api/room/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume" }),
      });
      setIsPaused(false);
    } catch (error) {
      console.error("Error resuming session:", error);
    }
  };

  const handleEndSession = async () => {
    try {
      await fetch(`/api/room/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end" }),
      });
      setIsActive(false);
      router.push(`/room/${roomId}/recap`);
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  const toggleChecklistItem = (itemId: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading room...</p>
        </div>
      </div>
    );
  }

  const progress = ((25 * 60 - secondsRemaining) / (25 * 60)) * 100;
  const participants = room.matches?.map((m: any) => m.user) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">{room.topic}</h1>
            {room.description && (
              <p className="text-muted-foreground">{room.description}</p>
            )}
          </div>

          {/* Participants */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Session Partners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {participants.map((participant: any) => (
                  <div key={participant.id} className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {participant.displayName?.[0] || "?"}
                    </div>
                    <span className="font-medium">{participant.displayName || "Anonymous"}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timer */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <div className="text-7xl font-bold mb-4 tabular-nums">
                  {formatDuration(secondsRemaining)}
                </div>
                <Progress value={progress} className="h-2 mb-4" />
                <p className="text-sm text-muted-foreground">
                  {isActive ? (isPaused ? "Paused" : "In Progress") : "Ready to Start"}
                </p>
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-4">
                {!isActive && (
                  <Button size="lg" onClick={handleStart}>
                    <Play className="w-5 h-5 mr-2" />
                    Start Session
                  </Button>
                )}

                {isActive && !isPaused && (
                  <>
                    <Button size="lg" variant="outline" onClick={handlePause}>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </Button>
                    <Button size="lg" variant="destructive" onClick={handleEndSession}>
                      <Square className="w-5 h-5 mr-2" />
                      End Session
                    </Button>
                  </>
                )}

                {isActive && isPaused && (
                  <>
                    <Button size="lg" onClick={handleResume}>
                      <Play className="w-5 h-5 mr-2" />
                      Resume
                    </Button>
                    <Button size="lg" variant="destructive" onClick={handleEndSession}>
                      <Square className="w-5 h-5 mr-2" />
                      End Session
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Session Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              {checklist.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No tasks added yet. Add tasks to track your progress!
                </p>
              ) : (
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                        {item.text}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
