export const svelteAdapterPublicContract = {
  attrs: {
    destination: "single-semantic-element",
    forwarding: "exactly-once",
    includesAttachmentSymbols: true,
  },
  framework: {
    minimumVersion: "5.29.0",
    packageIntent: "@starwind-ui/svelte",
    sveltePeerExternalized: true,
    setupModel: "component-with-attachment-owned-runtime-connection",
  },
  lifecycle: {
    connection: "attachment",
    mutableOptions: "nested-effect-runtime-setter",
    teardown: "attachment-cleanup",
  },
  publicSupport: {
    cliRegistry: false,
    demoIntegration: false,
    packageExports: false,
    publicDocsClaim: false,
    status: "non-shipping-tracer",
  },
  rendering: {
    content: "typed-snippet",
    props: "$props-rest-forwarding",
  },
  server: {
    browserGlobals: false,
    hydration: "exact-server-markup",
  },
} as const;

export type SvelteAdapterPublicContract = typeof svelteAdapterPublicContract;
