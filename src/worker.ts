export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    const url = new URL(request.url);
    const headers = { "Content-Type": "application/json" };

    // Simple health endpoints (existing Umbrella Kernel endpoints)
    if (url.pathname.startsWith("/sim")) {
      return new Response(JSON.stringify({ sim: "SIM Core Online" }), { headers });
    }

    if (url.pathname.startsWith("/tec")) {
      return new Response(JSON.stringify({ tec: "TEC Orchestration Online" }), { headers });
    }

    if (url.pathname.startsWith("/identity")) {
      return new Response(JSON.stringify({ identity: "Identity Physics Online" }), { headers });
    }

    if (url.pathname.startsWith("/substrate")) {
      return new Response(JSON.stringify({ substrate: "Substrate Online" }), { headers });
    }

    // --- Umbrella API routes (new) ---
    // /api -> overview
    if (url.pathname === "/api" || url.pathname === "/api/") {
      return new Response(
        JSON.stringify({
          service: "Portal-OS Umbrella API",
          routes: ["/api/status", "/api/sim", "/api/tec", "/api/identity", "/api/substrate"]
        }),
        { headers }
      );
    }

    // /api/status -> general status with components
    if (url.pathname === "/api/status" || url.pathname === "/api/status/") {
      return new Response(
        JSON.stringify({
          status: "ok",
          uptime: "unknown",
          components: {
            sim: "online",
            tec: "online",
            identity: "online",
            substrate: "online"
          }
        }),
        { headers }
      );
    }

    // /api/sim/:id? -> example param handling
    if (url.pathname.startsWith("/api/sim")) {
      // path like /api/sim or /api/sim/42
      const parts = url.pathname.split("/").filter(Boolean); // ["api","sim", "42"]
      const id = parts.length >= 3 ? parts[2] : null;
      return new Response(
        JSON.stringify({ service: "sim", id, message: id ? `SIM ${id} OK` : "SIM root" }),
        { headers }
      );
    }

    // /api/tec/... proxy-like responses
    if (url.pathname.startsWith("/api/tec")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const action = parts[2] || null;
      return new Response(
        JSON.stringify({ service: "tec", action, message: action ? `TEC action: ${action}` : "TEC root" }),
        { headers }
      );
    }

    // /api/identity
    if (url.pathname.startsWith("/api/identity")) {
      return new Response(JSON.stringify({ service: "identity", info: "Identity Physics endpoint" }), { headers });
    }

    // /api/substrate
    if (url.pathname.startsWith("/api/substrate")) {
      return new Response(JSON.stringify({ service: "substrate", info: "Substrate endpoint" }), { headers });
    }

    // Default fallback
    return new Response(JSON.stringify({ message: "Portal‑OS Worker Runtime Active" }), { headers });
  }
};
