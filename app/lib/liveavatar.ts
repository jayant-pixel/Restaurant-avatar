export type LiveAvatarVideoQuality = "low" | "medium" | "high";
export type LiveAvatarVideoEncoding = "H264" | "VP8" | "VP9";
export type LiveAvatarSttConfig = {
  provider: string;
};

export type LiveAvatarVideoSettings = {
  quality: LiveAvatarVideoQuality;
  encoding: LiveAvatarVideoEncoding;
};

export type LiveAvatarSessionBootstrap = {
  sessionId: string;
  sessionToken: string;
  avatarId: string;
  contextId: string;
  voiceId?: string;
  language: string;
  isSandbox: boolean;
  sttProvider?: string;
  maxSessionDuration?: number;
  interactivityType: "CONVERSATIONAL";
  videoSettings: LiveAvatarVideoSettings;
};

export type LiveAvatarSessionTokenRequest = {
  mode: "FULL";
  avatar_id: string;
  avatar_persona: {
    context_id: string;
    language: string;
    voice_id?: string;
    stt_config?: LiveAvatarSttConfig;
  };
  is_sandbox: boolean;
  interactivity_type: "CONVERSATIONAL";
  video_settings: LiveAvatarVideoSettings;
  max_session_duration?: number;
};

export type LiveAvatarSessionConfig = {
  avatarId: string;
  contextId: string;
  voiceId?: string;
  language: string;
  isSandbox: boolean;
  sttProvider?: string;
  maxSessionDuration?: number;
  videoSettings?: LiveAvatarVideoSettings;
};

export const DEFAULT_LIVEAVATAR_VIDEO_SETTINGS: LiveAvatarVideoSettings = {
  quality: "high",
  encoding: "H264",
};

export function buildLiveAvatarSessionTokenRequest(
  config: LiveAvatarSessionConfig,
): LiveAvatarSessionTokenRequest {
  return {
    mode: "FULL",
    avatar_id: config.avatarId,
    avatar_persona: {
      context_id: config.contextId,
      language: config.language,
      ...(config.voiceId ? { voice_id: config.voiceId } : {}),
      ...(config.sttProvider
        ? {
            stt_config: {
              provider: config.sttProvider,
            },
          }
        : {}),
    },
    is_sandbox: config.isSandbox,
    interactivity_type: "CONVERSATIONAL",
    video_settings: config.videoSettings ?? DEFAULT_LIVEAVATAR_VIDEO_SETTINGS,
    ...(config.maxSessionDuration
      ? { max_session_duration: config.maxSessionDuration }
      : {}),
  };
}

export function parseBooleanEnv(value?: string): boolean {
  return value?.trim().toLowerCase() === "true";
}

export function parseIntegerEnv(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}
