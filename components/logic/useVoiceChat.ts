import { useLiveAvatarContext } from "./context";

export const useVoiceChat = () => {
  const {
    isMuted,
    isVoiceChatActive,
    isVoiceChatLoading,
    muteInputAudio,
    unmuteInputAudio,
  } = useLiveAvatarContext();

  return {
    muteInputAudio,
    unmuteInputAudio,
    isMuted,
    isVoiceChatActive,
    isVoiceChatLoading,
  };
};
