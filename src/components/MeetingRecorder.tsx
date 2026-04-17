import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Loader2, Play, Plus, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TranscriptPart } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MeetingRecorderProps {
  onTranscriptUpdate: (parts: TranscriptPart[]) => void;
  onFinish: (transcript: TranscriptPart[]) => void;
}

export const MeetingRecorder: React.FC<MeetingRecorderProps> = ({ onTranscriptUpdate, onFinish }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptPart[]>([]);
  const [currentText, setCurrentText] = useState('');
  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ko-KR';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const text = event.results[i][0].transcript;
            const newPart: TranscriptPart = {
              speaker: 'Speaker 1', // Simple speaker identification for MVP
              text: text,
              timestamp: (Date.now() - startTimeRef.current) / 1000
            };
            setTranscript(prev => {
              const updated = [...prev, newPart];
              onTranscriptUpdate(updated);
              return updated;
            });
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setCurrentText(interimTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscriptUpdate]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      onFinish(transcript);
    } else {
      setTranscript([]);
      setCurrentText('');
      startTimeRef.current = Date.now();
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  return (
    <div className="sleek-card p-6 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-3 h-3 rounded-full bg-red-500",
            isRecording && "recording-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]"
          )} />
          <h2 className="text-[var(--text-main)] font-bold tracking-tight text-sm uppercase">LIVE SESSION RECORDING</h2>
        </div>
        <div className="mono text-[10px] text-[var(--text-sub)] tracking-widest uppercase font-bold">
          {isRecording ? "REC. ON AIR" : "IDLE / STANDBY"}
        </div>
      </div>

      <div className="flex-1 min-h-[200px] max-h-[400px] overflow-y-auto bg-slate-50 rounded-lg p-6 border border-[var(--border)] font-sans text-sm leading-relaxed">
        {transcript.map((part, i) => (
          <div key={i} className="mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[var(--primary)] font-bold text-[10px] uppercase tracking-wider">{part.speaker}</span>
              <span className="text-[var(--text-sub)] text-[10px] mono">[{Math.floor(part.timestamp)}s]</span>
            </div>
            <p className="text-[var(--text-main)] font-medium leading-relaxed">{part.text}</p>
          </div>
        ))}
        {currentText && (
          <div className="opacity-50 italic">
            <span className="text-[var(--primary)] font-bold text-[10px] uppercase tracking-wider mr-2">Speaker 1:</span>
            <span className="text-[var(--text-main)]">{currentText}</span>
          </div>
        )}
        {transcript.length === 0 && !currentText && (
          <div className="h-full flex items-center justify-center text-[var(--text-sub)] uppercase tracking-widest text-[10px] opacity-40 font-bold italic">
            Waiting for audio input...
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleRecording}
          className={cn(
            "sleek-btn-primary flex-1 flex items-center justify-center gap-3",
            isRecording && "bg-red-500 shadow-[0_4px_12px_rgba(239,68,68,0.2)]"
          )}
        >
          {isRecording ? (
            <>
              <Square size={18} fill="currentColor" />
              녹음 종료 및 분석
            </>
          ) : (
            <>
              <Mic size={18} />
              녹음 시작
            </>
          )}
        </button>
      </div>
    </div>
  );
};
