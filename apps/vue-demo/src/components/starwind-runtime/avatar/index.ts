import Avatar from "./Avatar.vue";
import AvatarFallback from "./AvatarFallback.vue";
import AvatarImage from "./AvatarImage.vue";
import { avatar, avatarFallback, avatarImage } from "./variants";

export type { AvatarProps } from "./Avatar.vue";
export type { AvatarFallbackProps } from "./AvatarFallback.vue";
export type { AvatarImageProps } from "./AvatarImage.vue";

const AvatarVariants = { avatar, avatarFallback, avatarImage };

export { Avatar, AvatarFallback, AvatarImage, AvatarVariants };

export default { Root: Avatar, Image: AvatarImage, Fallback: AvatarFallback };
