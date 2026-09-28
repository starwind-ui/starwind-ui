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
      <div className="space-y-4">
        {(["sm", "md", "lg"] as const).map((size) => (
          <AvatarGroup key={size} data-avatar-group-test={size}>
            {["First", "Second", "Third"].map((name) => (
              <Avatar key={name} size={size}>
                <AvatarImage
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Cpath fill='%23e11d48' d='M0 0h48v48H0z'/%3E%3C/svg%3E"
                  alt={`${name} ${size} avatar`}
                />
                <AvatarFallback>{name[0]}</AvatarFallback>
              </Avatar>
            ))}
            <AvatarGroupCount>+3</AvatarGroupCount>
          </AvatarGroup>
        ))}
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
