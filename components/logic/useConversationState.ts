import { useLiveAvatarContext } from "./context";

export const useConversationState = () => {
  const {
    isAvatarTalking,
    isListening,
    isUserTalking,
    startListening,
    stopListening,
  } = useLiveAvatarContext();

  return {
    isAvatarTalking,
    isListening,
    isUserTalking,
    startListening,
    stopListening,
  };
};
