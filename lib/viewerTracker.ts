// In-memory store for active viewers per project
// Structure: Map<projectId, Map<visitorId, timestamp>>
type ViewerMap = Map<string, number>;

const globalForViewers = globalThis as unknown as {
  viewerCounts?: Map<string, ViewerMap>;
};

const viewerCounts = globalForViewers.viewerCounts || new Map<string, ViewerMap>();
if (process.env.NODE_ENV !== 'production') globalForViewers.viewerCounts = viewerCounts;

const EXPIRATION_MS = 15000; // 15 seconds timeout

export function updateHeartbeat(projectId: string, visitorId: string, leave = false) {
  if (!viewerCounts.has(projectId)) {
    viewerCounts.set(projectId, new Map());
  }
  const projectMap = viewerCounts.get(projectId)!;

  if (leave) {
    projectMap.delete(visitorId);
  } else {
    projectMap.set(visitorId, Date.now());
  }

  cleanup();
}

export function getViewerCounts(): Record<string, number> {
  cleanup();
  const counts: Record<string, number> = {};
  viewerCounts.forEach((map, projectId) => {
    counts[projectId] = map.size;
  });
  return counts;
}

function cleanup() {
  const now = Date.now();
  viewerCounts.forEach((map, projectId) => {
    map.forEach((timestamp, visitorId) => {
      if (now - timestamp > EXPIRATION_MS) {
        map.delete(visitorId);
      }
    });
    if (map.size === 0) {
      viewerCounts.delete(projectId);
    }
  });
}
