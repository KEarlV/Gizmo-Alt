// Compatibility entrypoint for hosts that still start server/index.ts.
// The canonical server lives in _core/index.ts and includes OAuth, tRPC,
// storage, health checks, and production static serving in the correct order.
import "./_core/index.ts";
