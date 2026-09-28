import Avatar from "./Avatar.astro";
import AvatarFallback from "./AvatarFallback.astro";
import AvatarGroup from "./AvatarGroup.astro";
import AvatarGroupCount from "./AvatarGroupCount.astro";
import AvatarImage from "./AvatarImage.astro";
import { avatar, avatarFallback, avatarGroup, avatarGroupCount, avatarImage } from "./variants";

const AvatarVariants = {
  avatar,
  avatarFallback,
  avatarGroup,
  avatarGroupCount,
  avatarImage,
};

const AvatarParts = {
  Root: Avatar,
  Image: AvatarImage,
  Fallback: AvatarFallback,
  Group: AvatarGroup,
  GroupCount: AvatarGroupCount,
};

export { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage, AvatarVariants };

export default AvatarParts;
