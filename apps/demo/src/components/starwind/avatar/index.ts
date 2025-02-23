import Avatar from "./Avatar.astro";
import AvatarImage from "./AvatarImage.astro";
import AvatarFallback from "./AvatarFallback.astro";

export { Avatar, AvatarImage, AvatarFallback };

export default {
	Root: Avatar,
	Image: AvatarImage,
	Fallback: AvatarFallback,
};
