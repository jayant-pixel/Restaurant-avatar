import { NextResponse } from "next/server";

import {
  buildLiveAvatarSessionTokenRequest,
  DEFAULT_LIVEAVATAR_VIDEO_SETTINGS,
  parseBooleanEnv,
  parseIntegerEnv,
  type LiveAvatarSessionBootstrap,
  type LiveAvatarSessionConfig,
} from "@/app/lib/liveavatar";

const DEFAULT_API_URL = "https://api.liveavatar.com";

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getLiveAvatarConfigFromEnv(): {
  apiKey: string;
  apiUrl: string;
  sessionConfig: LiveAvatarSessionConfig;
} {
  return {
    apiKey: getRequiredEnv("LIVEAVATAR_API_KEY"),
    apiUrl: process.env.LIVEAVATAR_API_URL?.trim() || DEFAULT_API_URL,
    sessionConfig: {
      avatarId: getRequiredEnv("LIVEAVATAR_AVATAR_ID"),
      contextId: getRequiredEnv("LIVEAVATAR_CONTEXT_ID"),
      voiceId: process.env.LIVEAVATAR_VOICE_ID?.trim() || undefined,
      language: process.env.LIVEAVATAR_LANGUAGE?.trim() || "en",
      isSandbox: parseBooleanEnv(process.env.LIVEAVATAR_IS_SANDBOX),
      sttProvider: process.env.LIVEAVATAR_STT_PROVIDER?.trim() || "deepgram",
      maxSessionDuration: parseIntegerEnv(
        process.env.LIVEAVATAR_MAX_SESSION_DURATION,
      ),
      videoSettings: DEFAULT_LIVEAVATAR_VIDEO_SETTINGS,
    },
  };
}

export async function POST() {
  try {
    const { apiKey, apiUrl, sessionConfig } = getLiveAvatarConfigFromEnv();
    const requestBody = buildLiveAvatarSessionTokenRequest(sessionConfig);

    const response = await fetch(`${apiUrl}/v1/sessions/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });

    const responseText = await response.text();
    const parsedBody = responseText ? JSON.parse(responseText) : null;

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            parsedBody?.message ||
            "LiveAvatar rejected the session token request.",
          upstreamStatus: response.status,
        },
        { status: 502 },
      );
    }

    const sessionId = parsedBody?.data?.session_id;
    const sessionToken = parsedBody?.data?.session_token;

    if (!sessionId || !sessionToken) {
      return NextResponse.json(
        { error: "LiveAvatar response did not include session credentials." },
        { status: 502 },
      );
    }

    const bootstrap: LiveAvatarSessionBootstrap = {
      sessionId,
      sessionToken,
      avatarId: sessionConfig.avatarId,
      contextId: sessionConfig.contextId,
      voiceId: sessionConfig.voiceId,
      language: sessionConfig.language,
      isSandbox: sessionConfig.isSandbox,
      sttProvider: sessionConfig.sttProvider,
      maxSessionDuration: sessionConfig.maxSessionDuration,
      interactivityType: "CONVERSATIONAL",
      videoSettings:
        sessionConfig.videoSettings ?? DEFAULT_LIVEAVATAR_VIDEO_SETTINGS,
    };

    return NextResponse.json({ data: bootstrap });
  } catch (error) {
    console.error("Failed to create LiveAvatar session token:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create LiveAvatar session token.",
      },
      { status: 500 },
    );
  }
}
