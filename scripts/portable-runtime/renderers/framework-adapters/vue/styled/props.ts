export function renderVuePropKey(name: string): string {
  return isVueIdentifier(name) ? name : JSON.stringify(name);
}

export function isVueIdentifier(value: string): boolean {
  if (!value.length) return false;
  const first = value.charCodeAt(0);
  if (!(value[0] === "$" || value[0] === "_" || isAsciiLetter(first))) return false;
  for (let index = 1; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (!(value[index] === "$" || value[index] === "_" || isAsciiLetter(code) || isDigit(code))) {
      return false;
    }
  }
  return true;
}

function isAsciiLetter(code: number): boolean {
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function isDigit(code: number): boolean {
  return code >= 48 && code <= 57;
}
