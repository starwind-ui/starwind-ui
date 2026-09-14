"use client";

import Avatar from "./Avatar";
import AvatarFallback from "./AvatarFallback";
import AvatarGroup from "./AvatarGroup";
import AvatarGroupCount from "./AvatarGroupCount";
import AvatarImage from "./AvatarImage";
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
