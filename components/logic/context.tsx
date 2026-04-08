"use client";

import type { LiveAvatarSessionBootstrap } from "@/app/lib/liveavatar";

import {
  AgentEventsEnum,
  ConnectionQuality,
  LiveAvatarSession,
  SessionEvent,
  SessionInteractivityMode,
  SessionState as LiveAvatarSdkSessionState,
  VoiceChatEvent,
  VoiceChatState,
} from "@heygen/liveavatar-web-sdk";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export enum AvatarSessionState {
  INACTIVE = "inactive",
  CONNECTING = "connecting",
  CONNECTED = "connected",
}

export enum MessageSender {
  CLIENT = "CLIENT",
  AVATAR = "AVATAR",
}

export interface Message {
  id: string;
  sender: MessageSender;
  content: string;
}

type LiveKitTextStreamReader = {
  info?: {
    id?: string;
    topic?: string;
    attributes?: Record<string, unknown>;
  };
  [Symbol.asyncIterator](): AsyncIterator<string>;
  readAll?: () => Promise<string>;
};

type LiveKitRoomLike = {
  localParticipant?: {
    identity?: string;
  };
  on?: (event: string, callback: (...args: any[]) => void) => void;
  off?: (event: string, callback: (...args: any[]) => void) => void;
  registerTextStreamHandler?: (
    topic: string,
    callback: (
      reader: LiveKitTextStreamReader,
      participantInfo: { identity: string },
    ) => void,
  ) => void;
  unregisterTextStreamHandler?: (topic: string) => void;
};

type LiveAvatarContextValue = {
  avatarRef: React.MutableRefObject<LiveAvatarSession | null>;
  bootstrap: LiveAvatarSessionBootstrap | null;
  connectionQuality: ConnectionQuality;
  error: string | null;
  isAvatarTalking: boolean;
  isListening: boolean;
  isMuted: boolean;
  isStreamReady: boolean;
  isUserTalking: boolean;
  isVoiceChatActive: boolean;
  isVoiceChatLoading: boolean;
  messages: Message[];
  sessionState: AvatarSessionState;
  attachMediaElement: (element: HTMLMediaElement | null) => void;
  clearMessages: () => void;
  interrupt: () => void;
  muteInputAudio: () => Promise<void>;
  repeatMessage: (message: string) => void;
  sendMessage: (message: string) => void;
  startListening: () => void;
  startSession: () => Promise<void>;
  stopListening: () => void;
  stopSession: () => Promise<void>;
  unmuteInputAudio: () => Promise<void>;
};

const LiveAvatarContext = React.createContext<LiveAvatarContextValue | null>(
  null,
);

const KEEP_ALIVE_INTERVAL_MS = 30_000;

function mapSessionState(state: LiveAvatarSdkSessionState): AvatarSessionState {
  switch (state) {
    case LiveAvatarSdkSessionState.CONNECTING:
      return AvatarSessionState.CONNECTING;
    case LiveAvatarSdkSessionState.CONNECTED:
      return AvatarSessionState.CONNECTED;
    default:
      return AvatarSessionState.INACTIVE;
  }
}

function createMessageId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function LiveAvatarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const avatarRef = useRef<LiveAvatarSession | null>(null);
  const isListeningRef = useRef(false);
  const mediaElementRef = useRef<HTMLMediaElement | null>(null);
  const streamMessageIdsRef = useRef<Record<string, string>>({});
  const sdkTranscriptSeenRef = useRef<Record<MessageSender, boolean>>({
    [MessageSender.CLIENT]: false,
    [MessageSender.AVATAR]: false,
  });
  const teardownRef = useRef<(() => void) | null>(null);
  const activeMessageIdsRef = useRef<{
    [MessageSender.CLIENT]: string | null;
    [MessageSender.AVATAR]: string | null;
  }>({
    [MessageSender.CLIENT]: null,
    [MessageSender.AVATAR]: null,
  });

  const [bootstrap, setBootstrap] = useState<LiveAvatarSessionBootstrap | null>(
    null,
  );
  const [connectionQuality, setConnectionQuality] = useState(
    ConnectionQuality.UNKNOWN,
  );
  const [error, setError] = useState<string | null>(null);
  const [isAvatarTalking, setIsAvatarTalking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [isUserTalking, setIsUserTalking] = useState(false);
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [isVoiceChatLoading, setIsVoiceChatLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionState, setSessionState] = useState<AvatarSessionState>(
    AvatarSessionState.INACTIVE,
  );

  const setListeningState = useCallback((nextValue: boolean) => {
    isListeningRef.current = nextValue;
    setIsListening(nextValue);
  }, []);

  const clearMessages = useCallback(() => {
    activeMessageIdsRef.current[MessageSender.CLIENT] = null;
    activeMessageIdsRef.current[MessageSender.AVATAR] = null;
    sdkTranscriptSeenRef.current[MessageSender.CLIENT] = false;
    sdkTranscriptSeenRef.current[MessageSender.AVATAR] = false;
    streamMessageIdsRef.current = {};
    setMessages([]);
  }, []);

  const appendChunk = useCallback((sender: MessageSender, text: string) => {
    if (!text) {
      return;
    }

    sdkTranscriptSeenRef.current[sender] = true;

    setMessages((previousMessages) => {
      const activeId = activeMessageIdsRef.current[sender];

      if (!activeId) {
        const messageId = createMessageId();

        activeMessageIdsRef.current[sender] = messageId;

        return [
          ...previousMessages,
          {
            id: messageId,
            sender,
            content: text,
          },
        ];
      }

      return previousMessages.map((message) =>
        message.id === activeId
          ? { ...message, content: `${message.content}${text}` }
          : message,
      );
    });
  }, []);

  const finalizeMessage = useCallback((sender: MessageSender, text: string) => {
    sdkTranscriptSeenRef.current[sender] = true;

    const activeId = activeMessageIdsRef.current[sender];

    setMessages((previousMessages) => {
      if (!activeId) {
        if (!text) {
          return previousMessages;
        }

        return [
          ...previousMessages,
          {
            id: createMessageId(),
            sender,
            content: text,
          },
        ];
      }

      return previousMessages.map((message) =>
        message.id === activeId
          ? { ...message, content: text || message.content }
          : message,
      );
    });

    activeMessageIdsRef.current[sender] = null;
  }, []);

  const upsertStreamMessage = useCallback(
    (sender: MessageSender, streamId: string, text: string) => {
      const normalizedText = text.trim();

      if (!normalizedText) {
        return;
      }

      setMessages((previousMessages) => {
        const messageId = streamMessageIdsRef.current[streamId];

        if (!messageId) {
          const nextMessageId = createMessageId();

          streamMessageIdsRef.current[streamId] = nextMessageId;

          return [
            ...previousMessages,
            {
              id: nextMessageId,
              sender,
              content: normalizedText,
            },
          ];
        }

        return previousMessages.map((message) =>
          message.id === messageId
            ? { ...message, content: normalizedText }
            : message,
        );
      });
    },
    [],
  );

  const addTypedMessage = useCallback((text: string) => {
    const trimmedText = text.trim();

    if (!trimmedText) {
      return;
    }

    setMessages((previousMessages) => [
      ...previousMessages,
      {
        id: createMessageId(),
        sender: MessageSender.CLIENT,
        content: trimmedText,
      },
    ]);
  }, []);

  const resetSessionState = useCallback(
    (clearTranscript = true) => {
      if (teardownRef.current) {
        teardownRef.current();
        teardownRef.current = null;
      }

      avatarRef.current = null;
      setBootstrap(null);
      setConnectionQuality(ConnectionQuality.UNKNOWN);
      setIsAvatarTalking(false);
      setListeningState(false);
      setIsMuted(false);
      setIsStreamReady(false);
      setIsUserTalking(false);
      setIsVoiceChatActive(false);
      setIsVoiceChatLoading(false);
      setSessionState(AvatarSessionState.INACTIVE);

      if (clearTranscript) {
        clearMessages();
      }
    },
    [clearMessages, setListeningState],
  );

  const attachMediaElement = useCallback(
    (element: HTMLMediaElement | null) => {
      mediaElementRef.current = element;

      if (element && avatarRef.current && isStreamReady) {
        avatarRef.current.attach(element);
      }
    },
    [isStreamReady],
  );

  const startSession = useCallback(async () => {
    if (avatarRef.current || sessionState === AvatarSessionState.CONNECTING) {
      return;
    }

    clearMessages();
    setError(null);
    setConnectionQuality(ConnectionQuality.UNKNOWN);
    setIsAvatarTalking(false);
    setIsListening(false);
    setIsMuted(false);
    setIsStreamReady(false);
    setIsUserTalking(false);
    setIsVoiceChatActive(false);
    setIsVoiceChatLoading(true);
    setSessionState(AvatarSessionState.CONNECTING);

    try {
      const response = await fetch("/api/liveavatar/session", {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error || "Failed to create a LiveAvatar session.",
        );
      }

      const nextBootstrap = payload.data as LiveAvatarSessionBootstrap;
      const nextSession = new LiveAvatarSession(nextBootstrap.sessionToken, {
        voiceChat: {
          defaultMuted: false,
          mode: SessionInteractivityMode.CONVERSATIONAL,
        },
      });
      const liveKitRoom = (
        nextSession as unknown as {
          room?: LiveKitRoomLike;
        }
      ).room;

      const handleSessionStateChanged = (state: LiveAvatarSdkSessionState) => {
        setSessionState(mapSessionState(state));

        if (state === LiveAvatarSdkSessionState.CONNECTED) {
          setIsVoiceChatLoading(false);
          setIsMuted(nextSession.voiceChat.isMuted);
        }
      };

      const handleStreamReady = () => {
        setIsStreamReady(true);

        if (mediaElementRef.current) {
          nextSession.attach(mediaElementRef.current);
        }
      };

      const handleDisconnect = () => {
        resetSessionState();
      };

      const handleUserSpeakStarted = () => {
        setIsUserTalking(true);
      };

      const handleUserSpeakEnded = () => {
        setIsUserTalking(false);
      };

      const handleAvatarSpeakStarted = () => {
        setIsAvatarTalking(true);
      };

      const handleAvatarSpeakEnded = () => {
        setIsAvatarTalking(false);
      };

      const handleUserTranscriptionChunk = (event: { text: string }) => {
        appendChunk(MessageSender.CLIENT, event.text);
      };

      const handleUserTranscription = (event: { text: string }) => {
        finalizeMessage(MessageSender.CLIENT, event.text);
      };

      const handleAvatarTranscriptionChunk = (event: { text: string }) => {
        appendChunk(MessageSender.AVATAR, event.text);
      };

      const handleAvatarTranscription = (event: { text: string }) => {
        finalizeMessage(MessageSender.AVATAR, event.text);
      };

      const handleVoiceChatStateChanged = (state: VoiceChatState) => {
        setIsVoiceChatLoading(state === VoiceChatState.STARTING);
        setIsVoiceChatActive(state === VoiceChatState.ACTIVE);
        setIsMuted(nextSession.voiceChat.isMuted);
      };

      const handleVoiceMuted = () => {
        setIsMuted(true);
      };

      const handleVoiceUnmuted = () => {
        setIsMuted(false);
      };

      const handleRoomTranscriptionReceived = (
        transcription: Array<{ id: string; text: string }>,
        participant?: { identity?: string },
      ) => {
        const sender =
          participant?.identity &&
          participant.identity === liveKitRoom?.localParticipant?.identity
            ? MessageSender.CLIENT
            : MessageSender.AVATAR;

        if (sdkTranscriptSeenRef.current[sender]) {
          return;
        }

        transcription.forEach((segment) => {
          if (!segment.text?.trim()) {
            return;
          }

          upsertStreamMessage(
            sender,
            `${sender}:room:${segment.id}`,
            segment.text,
          );
        });
      };

      const handleTranscriptTextStream = async (
        reader: LiveKitTextStreamReader,
        participantInfo: { identity: string },
      ) => {
        const sender =
          participantInfo.identity === liveKitRoom?.localParticipant?.identity
            ? MessageSender.CLIENT
            : MessageSender.AVATAR;

        if (sdkTranscriptSeenRef.current[sender]) {
          return;
        }

        const segmentId =
          String(reader.info?.attributes?.["lk.segment_id"] || "") ||
          reader.info?.id ||
          `${sender}:${Date.now()}-${Math.random().toString(16).slice(2)}`;

        try {
          const message = await reader.readAll?.();

          if (!message || sdkTranscriptSeenRef.current[sender]) {
            return;
          }

          upsertStreamMessage(
            sender,
            `${sender}:segment:${segmentId}`,
            message,
          );
        } catch (error) {
          console.warn(
            "Failed to process LiveAvatar transcript stream:",
            error,
          );
        }
      };

      const handleAgentEventTextStream = async (
        reader: LiveKitTextStreamReader,
        participantInfo: { identity: string },
      ) => {
        try {
          const payloadText = await reader.readAll?.();

          if (!payloadText) {
            return;
          }

          const payload = JSON.parse(payloadText);
          const events = Array.isArray(payload) ? payload : [payload];

          events.forEach((event, index) => {
            const eventType = String(event?.event_type || event?.type || "");
            const text = String(event?.text || "");

            if (!text.trim()) {
              return;
            }

            const sender =
              eventType.includes("user") ||
              participantInfo.identity ===
                liveKitRoom?.localParticipant?.identity
                ? MessageSender.CLIENT
                : MessageSender.AVATAR;

            if (sdkTranscriptSeenRef.current[sender]) {
              return;
            }

            upsertStreamMessage(
              sender,
              `${sender}:agent:${reader.info?.id || index}`,
              text,
            );
          });
        } catch (error) {
          console.warn(
            "Failed to process LiveAvatar agent event stream:",
            error,
          );
        }
      };

      nextSession.on(
        SessionEvent.SESSION_STATE_CHANGED,
        handleSessionStateChanged,
      );
      nextSession.on(SessionEvent.SESSION_STREAM_READY, handleStreamReady);
      nextSession.on(
        SessionEvent.SESSION_CONNECTION_QUALITY_CHANGED,
        setConnectionQuality,
      );
      nextSession.on(SessionEvent.SESSION_DISCONNECTED, handleDisconnect);
      nextSession.on(
        AgentEventsEnum.USER_SPEAK_STARTED,
        handleUserSpeakStarted,
      );
      nextSession.on(AgentEventsEnum.USER_SPEAK_ENDED, handleUserSpeakEnded);
      nextSession.on(
        AgentEventsEnum.AVATAR_SPEAK_STARTED,
        handleAvatarSpeakStarted,
      );
      nextSession.on(
        AgentEventsEnum.AVATAR_SPEAK_ENDED,
        handleAvatarSpeakEnded,
      );
      nextSession.on(
        AgentEventsEnum.USER_TRANSCRIPTION_CHUNK,
        handleUserTranscriptionChunk,
      );
      nextSession.on(
        AgentEventsEnum.USER_TRANSCRIPTION,
        handleUserTranscription,
      );
      nextSession.on(
        AgentEventsEnum.AVATAR_TRANSCRIPTION_CHUNK,
        handleAvatarTranscriptionChunk,
      );
      nextSession.on(
        AgentEventsEnum.AVATAR_TRANSCRIPTION,
        handleAvatarTranscription,
      );
      nextSession.voiceChat.on(
        VoiceChatEvent.STATE_CHANGED,
        handleVoiceChatStateChanged,
      );
      nextSession.voiceChat.on(VoiceChatEvent.MUTED, handleVoiceMuted);
      nextSession.voiceChat.on(VoiceChatEvent.UNMUTED, handleVoiceUnmuted);
      liveKitRoom?.on?.(
        "transcriptionReceived",
        handleRoomTranscriptionReceived,
      );
      liveKitRoom?.registerTextStreamHandler?.(
        "lk.transcription",
        handleTranscriptTextStream,
      );
      liveKitRoom?.registerTextStreamHandler?.(
        "lk.agent.events",
        handleAgentEventTextStream,
      );

      teardownRef.current = () => {
        nextSession.off(
          SessionEvent.SESSION_STATE_CHANGED,
          handleSessionStateChanged,
        );
        nextSession.off(SessionEvent.SESSION_STREAM_READY, handleStreamReady);
        nextSession.off(
          SessionEvent.SESSION_CONNECTION_QUALITY_CHANGED,
          setConnectionQuality,
        );
        nextSession.off(SessionEvent.SESSION_DISCONNECTED, handleDisconnect);
        nextSession.off(
          AgentEventsEnum.USER_SPEAK_STARTED,
          handleUserSpeakStarted,
        );
        nextSession.off(AgentEventsEnum.USER_SPEAK_ENDED, handleUserSpeakEnded);
        nextSession.off(
          AgentEventsEnum.AVATAR_SPEAK_STARTED,
          handleAvatarSpeakStarted,
        );
        nextSession.off(
          AgentEventsEnum.AVATAR_SPEAK_ENDED,
          handleAvatarSpeakEnded,
        );
        nextSession.off(
          AgentEventsEnum.USER_TRANSCRIPTION_CHUNK,
          handleUserTranscriptionChunk,
        );
        nextSession.off(
          AgentEventsEnum.USER_TRANSCRIPTION,
          handleUserTranscription,
        );
        nextSession.off(
          AgentEventsEnum.AVATAR_TRANSCRIPTION_CHUNK,
          handleAvatarTranscriptionChunk,
        );
        nextSession.off(
          AgentEventsEnum.AVATAR_TRANSCRIPTION,
          handleAvatarTranscription,
        );
        nextSession.voiceChat.off(
          VoiceChatEvent.STATE_CHANGED,
          handleVoiceChatStateChanged,
        );
        nextSession.voiceChat.off(VoiceChatEvent.MUTED, handleVoiceMuted);
        nextSession.voiceChat.off(VoiceChatEvent.UNMUTED, handleVoiceUnmuted);
        liveKitRoom?.off?.(
          "transcriptionReceived",
          handleRoomTranscriptionReceived,
        );
        liveKitRoom?.unregisterTextStreamHandler?.("lk.transcription");
        liveKitRoom?.unregisterTextStreamHandler?.("lk.agent.events");
      };

      avatarRef.current = nextSession;
      setBootstrap(nextBootstrap);

      await nextSession.start();

      if (
        nextSession.voiceChat.state === VoiceChatState.ACTIVE &&
        !nextSession.voiceChat.isMuted
      ) {
        try {
          nextSession.startListening();
          setListeningState(true);
        } catch (error) {
          console.warn("Failed to enter LiveAvatar listening state:", error);
        }
      }
    } catch (nextError) {
      console.error("Failed to start LiveAvatar session:", nextError);
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Failed to start the LiveAvatar session.",
      );
      resetSessionState();
    }
  }, [
    appendChunk,
    clearMessages,
    finalizeMessage,
    resetSessionState,
    setListeningState,
    sessionState,
    upsertStreamMessage,
  ]);

  const stopSession = useCallback(async () => {
    const session = avatarRef.current;

    if (!session) {
      resetSessionState();

      return;
    }

    try {
      if (isListeningRef.current) {
        session.stopListening();
        setListeningState(false);
      }

      await session.stop();
    } catch (nextError) {
      console.error("Failed to stop LiveAvatar session:", nextError);

      resetSessionState();
    }
  }, [resetSessionState, setListeningState]);

  const sendMessage = useCallback(
    (message: string) => {
      const trimmedMessage = message.trim();

      if (!avatarRef.current || !trimmedMessage) {
        return;
      }

      addTypedMessage(trimmedMessage);
      avatarRef.current.message(trimmedMessage);
    },
    [addTypedMessage],
  );

  const repeatMessage = useCallback(
    (message: string) => {
      const trimmedMessage = message.trim();

      if (!avatarRef.current || !trimmedMessage) {
        return;
      }

      addTypedMessage(trimmedMessage);
      avatarRef.current.repeat(trimmedMessage);
    },
    [addTypedMessage],
  );

  const startListening = useCallback(() => {
    if (!avatarRef.current) {
      return;
    }

    try {
      avatarRef.current.startListening();
      setListeningState(true);
    } catch (error) {
      console.warn("Failed to enter LiveAvatar listening state:", error);
    }
  }, [setListeningState]);

  const stopListening = useCallback(() => {
    if (!avatarRef.current) {
      return;
    }

    try {
      avatarRef.current.stopListening();
    } catch (error) {
      console.warn("Failed to leave LiveAvatar listening state:", error);
    }

    setListeningState(false);
  }, [setListeningState]);

  const interrupt = useCallback(() => {
    avatarRef.current?.interrupt();
  }, []);

  const muteInputAudio = useCallback(async () => {
    if (!avatarRef.current) {
      return;
    }

    if (isListeningRef.current) {
      try {
        avatarRef.current.stopListening();
      } catch (error) {
        console.warn("Failed to leave LiveAvatar listening state:", error);
      }

      setListeningState(false);
    }

    await avatarRef.current.voiceChat.mute();
    setIsMuted(true);
  }, [setListeningState]);

  const unmuteInputAudio = useCallback(async () => {
    if (!avatarRef.current) {
      return;
    }

    await avatarRef.current.voiceChat.unmute();

    setIsMuted(false);
  }, []);

  useEffect(() => {
    if (sessionState !== AvatarSessionState.CONNECTED || !avatarRef.current) {
      return;
    }

    const intervalId = window.setInterval(() => {
      avatarRef.current?.keepAlive().catch((nextError) => {
        console.error("LiveAvatar keep-alive failed:", nextError);
      });
    }, KEEP_ALIVE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [sessionState]);

  useEffect(() => {
    return () => {
      avatarRef.current?.stop().catch((nextError) => {
        console.error(
          "Failed to stop LiveAvatar session on unmount:",
          nextError,
        );
      });
    };
  }, []);

  const value = useMemo<LiveAvatarContextValue>(
    () => ({
      avatarRef,
      bootstrap,
      connectionQuality,
      error,
      isAvatarTalking,
      isListening,
      isMuted,
      isStreamReady,
      isUserTalking,
      isVoiceChatActive,
      isVoiceChatLoading,
      messages,
      sessionState,
      attachMediaElement,
      clearMessages,
      interrupt,
      muteInputAudio,
      repeatMessage,
      sendMessage,
      startListening,
      startSession,
      stopListening,
      stopSession,
      unmuteInputAudio,
    }),
    [
      attachMediaElement,
      bootstrap,
      clearMessages,
      connectionQuality,
      error,
      interrupt,
      isAvatarTalking,
      isListening,
      isMuted,
      isStreamReady,
      isUserTalking,
      isVoiceChatActive,
      isVoiceChatLoading,
      messages,
      muteInputAudio,
      repeatMessage,
      sendMessage,
      sessionState,
      startListening,
      startSession,
      stopListening,
      stopSession,
      unmuteInputAudio,
    ],
  );

  return (
    <LiveAvatarContext.Provider value={value}>
      {children}
    </LiveAvatarContext.Provider>
  );
}

export function useLiveAvatarContext(): LiveAvatarContextValue {
  const context = useContext(LiveAvatarContext);

  if (!context) {
    throw new Error(
      "useLiveAvatarContext must be used within LiveAvatarProvider",
    );
  }

  return context;
}

export { AvatarSessionState as StreamingAvatarSessionState };
export const StreamingAvatarProvider = LiveAvatarProvider;
export const useStreamingAvatarContext = useLiveAvatarContext;
