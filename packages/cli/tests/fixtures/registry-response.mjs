// All requests stay in this process. These responses never contact a registry.
const scenario = process.env.STARWIND_TEST_RESPONSE;
globalThis.fetch = async (url, options) => {
  const name = new URL(url).pathname
    .split("/")
    .at(-1)
    .replace(/\.json$/, "");
  if (scenario === "network") throw new TypeError("Unable to reach test registry");
  const errors = {
    missing: [401, "Unauthorized", "License key required."],
    invalid: [403, "Forbidden", "License validation failed. Please check your key."],
    placeholder: [
      404,
      "Not Found",
      "License key not found. Please check your key or contact support.",
    ],
    server: [503, "Service Unavailable", "Please try again later."],
  };
  if (errors[scenario]) {
    const [status, statusText, message] = errors[scenario];
    return new Response(JSON.stringify({ error: statusText, message }), { status, statusText });
  }
  if (
    scenario === "paid" &&
    new Headers(options?.headers).get("Authorization") !== "Bearer test-license-only"
  ) {
    throw new Error("The test authorization header was missing");
  }
  if (scenario !== "free" && scenario !== "paid") throw new Error("Unexpected test response");
  return Response.json({
    name,
    type: "registry:block",
    dependencies: [],
    registryDependencies: [],
    files: [
      {
        path: "TestCard.astro",
        type: "registry:block",
        target: "components/starwind-pro/test-card/TestCard.astro",
        content: "---\n---\n<div>Test card</div>\n",
      },
    ],
    meta: { plan: scenario === "paid" ? "pro" : "free", version: "1.0.0", framework: "astro" },
  });
};
