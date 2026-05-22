import Avatar from "./Avatar.astro";
import AvatarFallback from "./AvatarFallback.astro";
import AvatarImage from "./AvatarImage.astro";
import { avatar, avatarFallback, avatarImage } from "./variants";
const AvatarVariants = { avatar, avatarFallback, avatarImage };

export { Avatar, AvatarFallback, AvatarImage, AvatarVariants };

export default {
  Root: Avatar,
  Image: AvatarImage,
  Fallback: AvatarFallback,
};
