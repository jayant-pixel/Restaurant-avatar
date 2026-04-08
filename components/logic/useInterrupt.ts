import { useLiveAvatarContext } from "./context";

export const useInterrupt = () => {
  const { interrupt } = useLiveAvatarContext();

  return { interrupt };
};
