export function recordMenuCallback(item, source, recordRaw, invoke) {
  recordRaw({ id: item.id, source });
  if (item.disabled) return false;
  invoke(item.id);
  return true;
}
