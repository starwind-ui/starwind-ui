export function quoteWindowsCommandArg(arg) {
  if (/^[A-Za-z0-9._:/=@+{}-]+$/.test(arg)) return arg;
  if (/["&<>|^%!\r\n]/.test(arg)) {
    throw new Error(`Cannot safely pass argument to cmd.exe: ${arg}`);
  }
  return `"${arg}"`;
}

export function createSpawnCommand(command, args, platform = process.platform) {
  if (platform === "win32" && command.endsWith(".cmd")) {
    return {
      args: ["/d", "/s", "/c", [command, ...args].map(quoteWindowsCommandArg).join(" ")],
      command: "cmd.exe",
    };
  }
  return { args, command };
}
