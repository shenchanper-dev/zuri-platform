'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, Send, Sparkles, Volume2, VolumeX, HelpCircle } from 'lucide-react';
import { parseZuriIntent } from '@/lib/zuri-assistant/intents';

type AssistantStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface ZuriContext {
  selectedServicioId?: number | null;
  selectedServicioLabel?: string;
  selectedServicioHasOrigen?: boolean;
  onApplyDriverFilter: (filters: { equipamiento?: string; servicio?: string; soloDisponibles?: boolean }) => void;
  onRequestNearestDrivers: (radiusKm?: number) => void;
  onFindDriver: (query: string) => void;
  onAssignDriver: (query: string) => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

export default function ZuriAssistantPanel({ context }: { context: ZuriContext }) {
  const [status, setStatus] = useState<AssistantStatus>('idle');
  const [input, setInput] = useState('');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string>('Lista. Puedes escribir o usar tu voz.');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [listeningSupported, setListeningSupported] = useState(false);
  const [stats, setStats] = useState<{ total: number; ok: number; fail: number }>({ total: 0, ok: 0, fail: 0 });

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('zuri_assistant_stats') : null;
    if (stored) {
      try {
        setStats(JSON.parse(stored));
      } catch {
        return;
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setListeningSupported(!!SR);
  }, []);

  const speak = useCallback((text: string) => {
    setLastResponse(text);
    if (!voiceEnabled) return;
    if (typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-PE';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setStatus('speaking');
      utterance.onend = () => setStatus('idle');
      utterance.onerror = () => setStatus('idle');
      window.speechSynthesis.speak(utterance);
    } catch {
      setStatus('idle');
    }
  }, [voiceEnabled]);

  const persistStats = useCallback((next: { total: number; ok: number; fail: number }) => {
    setStats(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('zuri_assistant_stats', JSON.stringify(next));
    }
  }, []);

  const handleIntent = useCallback((text: string) => {
    setStatus('thinking');
    const intent = parseZuriIntent(text);
    const nextStats = { ...stats, total: stats.total + 1 };

    const helpText = [
      'Comandos:',
      '• "¿Dónde está Max?"',
      '• "Filtra conductores con oxígeno" / "con rampa" / "con silla de ruedas"',
      '• "Conductores más cercanos" (requiere servicio seleccionado)',
      '• "Asignar a Max" (requiere servicio seleccionado)',
    ].join('\n');

    if (intent.type === 'help') {
      persistStats({ ...nextStats, ok: nextStats.ok + 1 });
      speak(helpText);
      return;
    }

    if (intent.type === 'find_driver') {
      context.onFindDriver(intent.query);
      persistStats({ ...nextStats, ok: nextStats.ok + 1 });
      speak(`Buscando al conductor ${intent.query}.`);
      return;
    }

    if (intent.type === 'filter_drivers') {
      context.onApplyDriverFilter({
        equipamiento: intent.equipamiento,
        servicio: intent.servicio,
        soloDisponibles: intent.soloDisponibles,
      });
      persistStats({ ...nextStats, ok: nextStats.ok + 1 });
      const parts = [
        intent.equipamiento ? `equipamiento ${intent.equipamiento}` : null,
        intent.servicio ? `servicio ${intent.servicio}` : null,
        intent.soloDisponibles ? 'solo disponibles' : null,
      ].filter(Boolean);
      speak(parts.length ? `Aplicando filtro: ${parts.join(', ')}.` : 'Aplicando filtro.');
      return;
    }

    if (intent.type === 'nearest_drivers') {
      if (!context.selectedServicioHasOrigen) {
        persistStats({ ...nextStats, fail: nextStats.fail + 1 });
        speak('Para buscar cercanos, primero selecciona un servicio con origen.');
        return;
      }
      context.onRequestNearestDrivers(intent.radiusKm);
      persistStats({ ...nextStats, ok: nextStats.ok + 1 });
      speak('Calculando conductores más cercanos al origen.');
      return;
    }

    if (intent.type === 'assign_driver') {
      if (!context.selectedServicioId) {
        persistStats({ ...nextStats, fail: nextStats.fail + 1 });
        speak('Para asignar, primero selecciona un servicio.');
        return;
      }
      context.onAssignDriver(intent.query);
      persistStats({ ...nextStats, ok: nextStats.ok + 1 });
      speak(`Preparando asignación a ${intent.query}.`);
      return;
    }

    persistStats({ ...nextStats, fail: nextStats.fail + 1 });
    speak('No entendí. Di "ayuda" para ver comandos.');
  }, [context, persistStats, speak, stats]);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { }
      recognitionRef.current = null;
    }
    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = 'es-PE';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => setStatus('listening');
    recognition.onresult = (event: any) => {
      const result = Array.from(event.results).map((r: any) => r[0]?.transcript || '').join(' ').trim();
      setTranscript(result);
      if (event.results?.[0]?.isFinal) {
        setInput(result);
      }
    };
    recognition.onerror = () => setStatus('idle');
    recognition.onend = () => setStatus('idle');
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { }
      recognitionRef.current = null;
    }
    setStatus('idle');
  }, []);

  const submit = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setTranscript(null);
    setInput('');
    handleIntent(text);
  }, [handleIntent, input]);

  const statusLabel = useMemo(() => {
    if (status === 'listening') return 'Escuchando...';
    if (status === 'thinking') return 'Procesando...';
    if (status === 'speaking') return 'Respondiendo...';
    return 'Lista';
  }, [status]);

  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-bold text-slate-800">Zuri</div>
            <div className="text-xs text-slate-500">{statusLabel}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-2 py-2 rounded-lg border hover:bg-slate-50"
            onClick={() => speak('Di "ayuda" para ver comandos.')}
            title="Ayuda"
          >
            <HelpCircle className="w-4 h-4 text-slate-700" />
          </button>
          <button
            type="button"
            className="px-2 py-2 rounded-lg border hover:bg-slate-50"
            onClick={() => {
              setVoiceEnabled(v => !v);
              if (voiceEnabled && typeof window !== 'undefined') window.speechSynthesis?.cancel?.();
            }}
            title={voiceEnabled ? 'Silenciar voz' : 'Activar voz'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4 text-slate-700" /> : <VolumeX className="w-4 h-4 text-slate-700" />}
          </button>
          <button
            type="button"
            className="px-2 py-2 rounded-lg border hover:bg-slate-50 disabled:opacity-50"
            onClick={() => (status === 'listening' ? stopListening() : startListening())}
            disabled={!listeningSupported}
            title={listeningSupported ? 'Voz' : 'Voz no soportada en este navegador'}
          >
            {status === 'listening' ? <MicOff className="w-4 h-4 text-slate-700" /> : <Mic className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>

      <div className="mt-3 text-sm text-slate-700 whitespace-pre-line bg-slate-50 border rounded-lg p-3">
        {lastResponse}
      </div>

      {transcript && (
        <div className="mt-2 text-xs text-slate-500">
          Transcripción: {transcript}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Escribe una pregunta o comando..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
        />
        <button
          type="button"
          className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          onClick={submit}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="border rounded-lg p-2">
          <div className="text-slate-500">Consultas</div>
          <div className="font-bold text-slate-800">{stats.total}</div>
        </div>
        <div className="border rounded-lg p-2">
          <div className="text-slate-500">Éxito</div>
          <div className="font-bold text-emerald-700">{stats.ok}</div>
        </div>
        <div className="border rounded-lg p-2">
          <div className="text-slate-500">No entendido</div>
          <div className="font-bold text-rose-700">{stats.fail}</div>
        </div>
      </div>
    </div>
  );
}

