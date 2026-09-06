import { useRuntimePrototypeContext } from "../context";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  avatarImageSrc,
} from "../kit";

export function AvatarDemo() {
  const { avatarRefSlot, avatarStatus, setAvatarStatus, setAvatarRef } =
    useRuntimePrototypeContext();

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Avatar</h2>
      <div className="flex flex-wrap gap-4">
        <Avatar
          id="react-runtime-avatar-loaded"
          ref={setAvatarRef}
          variant="primary"
          size="lg"
          className="runtime-avatar-custom"
        >
          <AvatarImage
            src={avatarImageSrc}
            alt="Jane Doe"
            onLoadingStatusChange={(status) => setAvatarStatus(status)}
          />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <Avatar id="react-runtime-avatar-error" variant="error">
          <AvatarImage src={avatarImageSrc} alt="Error state" />
          <AvatarFallback>ER</AvatarFallback>
        </Avatar>
        <Avatar id="react-runtime-avatar-delayed" variant="warning" size="sm">
          <AvatarImage src={avatarImageSrc} alt="Delayed fallback" />
          <AvatarFallback delay={1000}>DL</AvatarFallback>
        </Avatar>
        <AvatarGroup id="react-runtime-avatar-group" className="runtime-avatar-group-custom">
          <Avatar size="sm">
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar size="sm">
            <AvatarFallback>LR</AvatarFallback>
          </Avatar>
          <Avatar size="sm">
            <AvatarFallback>ER</AvatarFallback>
          </Avatar>
          <AvatarGroupCount
            id="react-runtime-avatar-group-count"
            className="runtime-avatar-count-custom"
          >
            +3
          </AvatarGroupCount>
        </AvatarGroup>
      </div>
      <p className="sr-only" data-runtime-avatar-ref>
        {avatarRefSlot}
      </p>
      <p className="sr-only" data-runtime-avatar-status>
        {avatarStatus}
      </p>
    </section>
  );
}
