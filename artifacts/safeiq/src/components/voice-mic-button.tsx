import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceMicButtonProps {
  onResult: (text: string) => void;
  className?: string;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export function VoiceMicButton({ onResult, className }: VoiceMicButtonProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  if (!supported) return null;

  const start = () => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-NZ";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript ?? "";
      if (text) onResult(text);
    };

    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`h-8 w-8 shrink-0 transition-colors ${
        listening
          ? "text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20 animate-pulse"
          : "text-muted-foreground hover:text-primary"
      } ${className ?? ""}`}
      title={listening ? "Stop recording" : "Speak to fill"}
      onClick={listening ? stop : start}
    >
      {listening ? <Square className="w-3.5 h-3.5 fill-current" /> : <Mic className="w-3.5 h-3.5" />}
    </Button>
  );
}
