import { useLiveAvatarContext } from "./context";

export { MessageSender } from "./context";
export type { Message } from "./context";

export const useMessageHistory = () => {
  const { clearMessages, messages } = useLiveAvatarContext();

  return {
    messages,
    clearMessages,
  };
};
