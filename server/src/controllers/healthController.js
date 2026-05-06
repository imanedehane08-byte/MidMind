// Simple health-check controller used to confirm the API is running.
// Responds with a small status object for uptime/deployment checks.
export function check(_req, res) {
  res.json({ status: "ok" });
}
