import { useLiveAvatarContext } from "./context";

export const useStreamingAvatarSession = () => {
  const {
    avatarRef,
    bootstrap,
    error,
    isStreamReady,
    sessionState,
    attachMediaElement,
    startSession,
    stopSession,
  } = useLiveAvatarContext();

  return {
    avatarRef,
    bootstrap,
    error,
    isStreamReady,
    sessionState,
    attachMediaElement,
    startSession,
    stopSession,
  };
};
