type FormValueRevision = object;

const revisions = new WeakMap<object, FormValueRevision>();

export function attachFormValueRevision(target: object, source?: object): FormValueRevision {
  const revision = source ? (getFormValueRevision(source) ?? createRevision(source)) : {};
  revisions.set(target, revision);
  return revision;
}

export function getFormValueRevision(notification: unknown): FormValueRevision | undefined {
  if (!isObject(notification)) return undefined;

  const directRevision = revisions.get(notification);
  if (directRevision) return directRevision;

  if ("detail" in notification) {
    const detail = (notification as { detail?: unknown }).detail;
    if (isObject(detail)) return revisions.get(detail);
  }

  return undefined;
}

function createRevision(origin: object): FormValueRevision {
  const revision = {};
  revisions.set(origin, revision);
  return revision;
}

function isObject(value: unknown): value is object {
  return (typeof value === "object" && value !== null) || typeof value === "function";
}
