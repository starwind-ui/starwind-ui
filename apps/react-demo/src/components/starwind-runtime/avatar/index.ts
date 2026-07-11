import Avatar from "./Avatar";
import AvatarFallback from "./AvatarFallback";
import AvatarImage from "./AvatarImage";
import { avatar, avatarFallback, avatarImage } from "./variants";

const AvatarVariants = {
  avatar,
  avatarFallback,
  avatarImage,
};

export { Avatar, AvatarFallback, AvatarImage, AvatarVariants };

export default {
  Root: Avatar,
  Image: AvatarImage,
  Fallback: AvatarFallback,
};
