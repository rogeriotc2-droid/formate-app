import { useEffect, useState, useCallback, useRef } from "react";
import { getQueue, drainQueue } from "@/lib/offline-queue";
import { useToast } from "@/hooks/use-toast";

export function useOfflineSync() {
  const [queueCount, setQueueCount] = useState(() => getQueue().length);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isDraining, setIsDraining] = useState(false);
  const { toast } = useToast();
  const drainingRef = useRef(false);

  const refreshCount = useCallback(() => {
    setQueueCount(getQueue().length);
  }, []);

  const drain = useCallback(async () => {
    if (drainingRef.current) return;
    if (getQueue().length === 0) return;
    drainingRef.current = true;
    setIsDraining(true);
    try {
      const sent = await drainQueue();
      setQueueCount(getQueue().length);
      if (sent > 0) {
        toast({
          title: `${sent} form${sent !== 1 ? "s" : ""} submitted`,
          description: "Your saved forms have been sent successfully.",
        });
      }
    } finally {
      drainingRef.current = false;
      setIsDraining(false);
    }
  }, [toast]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      drain();
    };
    const handleOffline = () => setIsOnline(false);
    const handleQueueChanged = () => refreshCount();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("formate:queue-changed", handleQueueChanged);

    if (navigator.onLine && getQueue().length > 0) {
      drain();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("formate:queue-changed", handleQueueChanged);
    };
  }, [drain, refreshCount]);

  return { queueCount, isOnline, isDraining, drain };
}
