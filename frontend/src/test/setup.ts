// Unit tests default to offline-safe behavior even when a developer's local
// .env opts the application into strict integration mode. Individual tests
// still set VITE_API_STRICT=1 when they need to assert strict behavior.
import { env as apiEnv } from "@/lib/api/config";
import { env as messagingEnv } from "@/lib/messaging/config";

delete apiEnv.VITE_API_STRICT;
apiEnv.VITE_API_FALLBACK = "1";

delete messagingEnv.VITE_API_STRICT;
messagingEnv.VITE_API_FALLBACK = "1";

if (typeof process !== "undefined" && process.env) {
  delete process.env.VITE_API_STRICT;
  process.env.VITE_API_FALLBACK = "1";
}

