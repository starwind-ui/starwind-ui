export function quoteWindowsCommandArg(arg) {
  if (/^[A-Za-z0-9._:/=@+{}-]+$/.test(arg)) return arg;
  if (/["&<>|^%!\r\n]/.test(arg)) {
    throw new Error(`Cannot safely pass argument to cmd.exe: ${arg}`);
  }
  return `"${arg}"`;
}

export function getPackageManagerCommand(packageManager, platform = process.platform) {
  if (!new Set(["npm", "pnpm"]).has(packageManager)) {
    throw new Error(`Unsupported package manager command: ${packageManager}`);
  }
  return platform === "win32" ? `${packageManager}.cmd` : packageManager;
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
