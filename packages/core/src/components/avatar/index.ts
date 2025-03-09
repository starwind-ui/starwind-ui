import Avatar from "./Avatar.astro";
import AvatarFallback from "./AvatarFallback.astro";
import AvatarImage from "./AvatarImage.astro";

export { Avatar, AvatarImage, AvatarFallback };

export default {
	Root: Avatar,
	Image: AvatarImage,
	Fallback: AvatarFallback,
};
