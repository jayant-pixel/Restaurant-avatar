import React, { forwardRef } from "react";

export const AvatarVideo = forwardRef<HTMLVideoElement>(({}, ref) => {
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    >
      <track kind="captions" />
    </video>
  );
});

AvatarVideo.displayName = "AvatarVideo";
