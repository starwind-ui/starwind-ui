import Avatar, { avatar } from "./Avatar.astro";
import AvatarFallback, { avatarFallback } from "./AvatarFallback.astro";
import AvatarImage, { avatarImage } from "./AvatarImage.astro";

const AvatarVariants = { avatar, avatarFallback, avatarImage };

export { Avatar, AvatarFallback, AvatarImage, AvatarVariants };

export default {
  Root: Avatar,
  Image: AvatarImage,
  Fallback: AvatarFallback,
};
