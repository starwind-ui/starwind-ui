export function toVueAttributeName(name: string): string {
  const normalized = name === "htmlFor" ? "for" : name;
  let output = "";
  for (const character of normalized) {
    const code = character.charCodeAt(0);
    output += code >= 65 && code <= 90 ? `-${character.toLowerCase()}` : character;
  }
  return output;
}

export function escapeVueAttribute(value: string): string {
  let escaped = "";
  for (const character of value) {
    escaped += character === "&" ? "&amp;" : character === '"' ? "&quot;" : character;
  }
  return escaped;
}
