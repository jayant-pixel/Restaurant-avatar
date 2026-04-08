import { useEffect, useRef } from "react";

import { AvatarVideo } from "./AvatarSession/AvatarVideo";
import { AvatarUI } from "./AvatarSession/AvatarUI";
import { Button } from "./Button";
import { LoadingIcon } from "./Icons";
import { AvatarSessionState } from "./logic";
import { useStreamingAvatarSession } from "./logic/useStreamingAvatarSession";

export default function InteractiveAvatar() {
  const { attachMediaElement, error, sessionState, startSession } =
    useStreamingAvatarSession();
  const mediaElementRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    attachMediaElement(mediaElementRef.current);

    return () => {
      attachMediaElement(null);
    };
  }, [attachMediaElement]);

  if (sessionState === AvatarSessionState.INACTIVE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black px-6">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <Button
            className="rounded-full bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
            onClick={startSession}
          >
            Start Session
          </Button>
          {error ? (
            <p className="text-sm text-red-300">{error}</p>
          ) : (
            <p className="text-sm text-zinc-400">
              Launch the restaurant avatar using your configured LiveAvatar
              assets.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-black">
      <div className="h-full w-full">
        <AvatarVideo ref={mediaElementRef} />
        <AvatarUI />

        {sessionState === AvatarSessionState.CONNECTING ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <LoadingIcon className="h-8 w-8 animate-spin text-white" />
            <p className="ml-3 text-white">Connecting to avatar...</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
