"use client";

import { useState, useRef } from "react";
import { Mic, StopCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await handleTranscription(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const handleTranscription = async (audioBlob: Blob) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append("audio", audioBlob);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Transcription failed");

      setTranscription(data.text);
      toast({
        title: "Success",
        description: "Audio transcribed successfully!",
      });
    } catch (error) {
      console.error("Transcription error:", error);
      toast({
        title: "Error",
        description: "Failed to transcribe audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Speech to Text Converter</h1>
          <p className="text-gray-400">
            Click the microphone to start recording your voice
          </p>
        </div>

        <Card className="bg-gray-800 border-gray-700 p-8 rounded-xl shadow-xl">
          <div className="flex flex-col items-center gap-8">
            <div className="relative">
              <Button
                size="lg"
                className={`w-24 h-24 rounded-full ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
              >
                {isRecording ? (
                  <StopCircle className="w-12 h-12" />
                ) : (
                  <Mic className="w-12 h-12" />
                )}
              </Button>
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}
            </div>

            <div className="w-full">
              <h2 className="text-xl font-semibold mb-4">Transcription</h2>
              <div
                className={`w-full min-h-[200px] bg-gray-900 rounded-lg p-4 ${
                  transcription ? "text-white" : "text-gray-500"
                }`}
              >
                {transcription || "Your transcription will appear here..."}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}