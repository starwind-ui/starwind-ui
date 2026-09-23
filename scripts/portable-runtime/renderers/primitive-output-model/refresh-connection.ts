import type { PrimitiveRefreshContract } from "../../contracts/primitive/types.js";

export function requireRefreshConnection(
  refresh: PrimitiveRefreshContract | undefined,
  parts: PrimitiveRefreshContract["parts"],
): PrimitiveRefreshContract {
  if (
    refresh?.method !== "refresh" ||
    refresh.formOwner !== "native-input" ||
    refresh.parts !== parts ||
    refresh.state !== "preserve"
  ) {
    throw new Error(
      `Runtime reconnection requires refresh with native form ownership, ${parts} parts, and preserved state.`,
    );
  }
  return { ...refresh };
}
