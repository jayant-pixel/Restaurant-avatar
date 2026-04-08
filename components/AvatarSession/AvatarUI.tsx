import { useEffect, useRef } from "react";
import { ConnectionQuality } from "@heygen/liveavatar-web-sdk";

import { Button } from "../Button";
import { MicIcon, MicOffIcon } from "../Icons";
import { AvatarSessionState } from "../logic";
import { useConnectionQuality } from "../logic/useConnectionQuality";
import { useConversationState } from "../logic/useConversationState";
import { MessageSender, useMessageHistory } from "../logic/useMessageHistory";
import { useStreamingAvatarSession } from "../logic/useStreamingAvatarSession";
import { useVoiceChat } from "../logic/useVoiceChat";

export const AvatarUI = () => {
  const { connectionQuality } = useConnectionQuality();
  const { sessionState, stopSession } = useStreamingAvatarSession();
  const { isMuted, muteInputAudio, unmuteInputAudio, isVoiceChatLoading } =
    useVoiceChat();
  const { isAvatarTalking, isListening, isUserTalking } =
    useConversationState();
  const { messages } = useMessageHistory();
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  const isConnected = sessionState === AvatarSessionState.CONNECTED;

  useEffect(() => {
    const transcriptElement = transcriptRef.current;

    if (!transcriptElement) {
      return;
    }

    transcriptElement.scrollTo({
      top: transcriptElement.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  if (!isConnected) {
    return null;
  }

  return (
    <>
      <div className="absolute left-4 top-4 right-4 flex items-start justify-between gap-4">
        <div className="rounded-full bg-black/70 px-4 py-2 text-sm text-white backdrop-blur-sm">
          {connectionQuality !== ConnectionQuality.UNKNOWN ? (
            <>
              Connection:{" "}
              <span className="font-medium capitalize">
                {connectionQuality.toLowerCase()}
              </span>
            </>
          ) : (
            "Session live"
          )}
        </div>

        <Button
          className="rounded-full bg-red-600 px-5 py-2 font-medium hover:bg-red-700"
          onClick={stopSession}
        >
          End Session
        </Button>
      </div>

      <aside className="absolute left-4 top-20 bottom-24 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/10 bg-black/55 backdrop-blur-md">
        <div className="border-b border-white/10 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">
            Live Conversation
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm text-white">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isUserTalking || isAvatarTalking || isListening
                  ? "bg-emerald-400"
                  : "bg-zinc-500"
              }`}
            />
            <span>
              {isUserTalking
                ? "Listening to guest"
                : isAvatarTalking
                  ? "Avatar speaking"
                  : isListening && !isMuted
                    ? "Mic live"
                    : "Mic muted"}
            </span>
          </div>
        </div>

        <div
          ref={transcriptRef}
          className="flex h-[calc(100%-5.5rem)] flex-col gap-4 overflow-y-auto px-4 py-5"
        >
          {messages.length === 0 ? (
            <div className="mt-auto rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
              User and avatar speech will appear here in real time.
            </div>
          ) : (
            messages.map((message) => {
              const isClient = message.sender === MessageSender.CLIENT;

              return (
                <div
                  key={message.id}
                  className={`flex ${isClient ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-lg ${
                      isClient
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-800/95 text-zinc-100"
                    }`}
                  >
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                      {isClient ? "Guest" : "Avatar"}
                    </p>
                    <p className="break-words leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
        <p className="rounded-full bg-black/60 px-4 py-1 text-xs uppercase tracking-[0.22em] text-zinc-300 backdrop-blur-sm">
          {isVoiceChatLoading
            ? "Preparing mic"
            : isMuted
              ? "Tap to unmute"
              : "Mic on"}
        </p>
        <Button
          className={`flex h-20 w-20 items-center justify-center rounded-full shadow-2xl transition-transform hover:scale-105 ${
            isUserTalking
              ? "bg-emerald-500 animate-pulse"
              : isMuted
                ? "bg-zinc-600"
                : "bg-blue-600"
          }`}
          disabled={isVoiceChatLoading}
          onClick={isMuted ? unmuteInputAudio : muteInputAudio}
        >
          {isMuted ? (
            <MicOffIcon className="h-9 w-9" />
          ) : (
            <MicIcon className="h-9 w-9" />
          )}
        </Button>
      </div>
    </>
  );
};
