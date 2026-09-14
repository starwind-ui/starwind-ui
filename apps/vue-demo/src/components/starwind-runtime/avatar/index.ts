import Avatar from "./Avatar.vue";
import AvatarFallback from "./AvatarFallback.vue";
import AvatarGroup from "./AvatarGroup.vue";
import AvatarGroupCount from "./AvatarGroupCount.vue";
import AvatarImage from "./AvatarImage.vue";
import { avatar, avatarFallback, avatarGroup, avatarGroupCount, avatarImage } from "./variants";

export type { AvatarProps } from "./Avatar.vue";
export type { AvatarFallbackProps } from "./AvatarFallback.vue";
export type { AvatarGroupProps } from "./AvatarGroup.vue";
export type { AvatarGroupCountProps } from "./AvatarGroupCount.vue";
export type { AvatarImageProps } from "./AvatarImage.vue";

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
