"use client";

import { useEffect } from "react";

export default function ViewerTracker({ projectId }: { projectId: number }) {
  useEffect(() => {
    // Get or generate unique visitor ID for this browser tab/session
    let visitorId = sessionStorage.getItem(`viewer_id_${projectId}`);
    if (!visitorId) {
      visitorId = `v_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      sessionStorage.setItem(`viewer_id_${projectId}`, visitorId);
    }

    const sendHeartbeat = (leave = false) => {
      const payload = JSON.stringify({ projectId, visitorId, leave });
      if (leave && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/viewers/heartbeat', blob);
      } else {
        fetch('/api/viewers/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: leave
        }).catch(() => {});
      }
    };

    // Send initial heartbeat
    sendHeartbeat(false);

    // Send heartbeat every 5 seconds
    const interval = setInterval(() => {
      sendHeartbeat(false);
    }, 5000);

    const handleBeforeUnload = () => {
      sendHeartbeat(true);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      sendHeartbeat(true);
    };
  }, [projectId]);

  return null;
}
