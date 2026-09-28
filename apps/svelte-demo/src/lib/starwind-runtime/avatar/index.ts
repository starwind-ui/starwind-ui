import Avatar from "./Avatar.svelte";
import AvatarImage from "./AvatarImage.svelte";
import AvatarFallback from "./AvatarFallback.svelte";
import AvatarGroup from "./AvatarGroup.svelte";
import AvatarGroupCount from "./AvatarGroupCount.svelte";
import { avatar, avatarFallback, avatarGroup, avatarGroupCount, avatarImage } from "./variants.js";
export type { AvatarProps } from "./Avatar.svelte";
export type { AvatarImageProps } from "./AvatarImage.svelte";
export type { AvatarFallbackProps } from "./AvatarFallback.svelte";
export type { AvatarGroupProps } from "./AvatarGroup.svelte";
export type { AvatarGroupCountProps } from "./AvatarGroupCount.svelte";
const AvatarVariants = { avatar, avatarFallback, avatarGroup, avatarGroupCount, avatarImage };
const AvatarParts = {
  Root: Avatar,
  Image: AvatarImage,
  Fallback: AvatarFallback,
  Group: AvatarGroup,
  GroupCount: AvatarGroupCount,
};
export { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage, AvatarVariants };
export default AvatarParts;
