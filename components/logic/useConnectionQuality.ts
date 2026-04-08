import { useLiveAvatarContext } from "./context";

export const useConnectionQuality = () => {
  const { connectionQuality } = useLiveAvatarContext();

  return {
    connectionQuality,
  };
};
