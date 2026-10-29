"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceRecorderState = "idle" | "recording" | "processing";

export function useVoiceRecorder(maxSeconds: number) {
  const [state, setState] = useState<VoiceRecorderState>("idle");
  const [secondsLeft, setSecondsLeft] = useState(maxSeconds);
  const [warning, setWarning] = useState("");
  const [hardStopMessage, setHardStopMessage] = useState("");

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSecondsLeft(maxSeconds);
  }, [maxSeconds]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopTracks = useCallback(() => {
    mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
    mediaRef.current = null;
  }, []);

  const stopRecording = useCallback(async (): Promise<{ blob: Blob | null; durationSeconds: number }> => {
    clearTimer();
    const recorder = mediaRef.current;
    if (!recorder || recorder.state === "inactive") {
      stopTracks();
      setState("idle");
      return { blob: null, durationSeconds: 0 };
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const durationSeconds = Math.min(
          maxSeconds,
          (Date.now() - startedAtRef.current) / 1000,
        );
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        stopTracks();
        setState("idle");
        resolve({ blob, durationSeconds });
      };
      recorder.stop();
    });
  }, [clearTimer, maxSeconds, stopTracks]);

  const startRecording = useCallback(async () => {
    setWarning("");
    setHardStopMessage("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setHardStopMessage("مرورگر شما ضبط صدا را پشتیبانی نمی‌کند.");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRef.current = recorder;
    startedAtRef.current = Date.now();
    setSecondsLeft(maxSeconds);
    setState("recording");
    recorder.start(250);

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      const left = Math.max(0, Math.ceil(maxSeconds - elapsed));
      setSecondsLeft(left);
      if (left <= 60 && left > 30) {
        setWarning("کمتر از یک دقیقه تا پایان زمان ضبط باقی مانده — سوال را جمع‌بندی کنید.");
      } else if (left <= 30 && left > 10) {
        setWarning("زمان رو به اتمام است — سریع سوال را تمام کنید.");
      } else if (left <= 10 && left > 0) {
        setWarning("فقط چند ثانیه مانده — همین الان ضبط را متوقف کنید.");
      }
      if (elapsed >= maxSeconds) {
        setHardStopMessage(
          `حداکثر ${maxSeconds} ثانیه مجاز بود. فقط همان مدت پردازش می‌شود؛ لطفاً دوباره با سوال کوتاه‌تر تلاش کنید.`,
        );
        void stopRecording();
      }
    }, 500);
  }, [maxSeconds, stopRecording]);

  useEffect(() => {
    return () => {
      clearTimer();
      stopTracks();
    };
  }, [clearTimer, stopTracks]);

  return {
    state,
    secondsLeft,
    warning,
    hardStopMessage,
    startRecording,
    stopRecording,
    setState,
  };
}
