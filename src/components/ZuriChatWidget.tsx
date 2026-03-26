'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
    id: number;
    rol: 'USER' | 'ASSISTANT' | 'SYSTEM';
    contenido: string;
    created_at: string;
}

export default function ZuriChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Iniciar con mensaje de bienvenida
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                id: 0,
                rol: 'ASSISTANT',
                contenido: '👋 Hola, soy **ZURI**, tu asistente administrativo.\n\n' +
                    'Puedo ayudarte con:\n' +
                    '• Ubicación de conductores\n' +
                    '• Estado de la flota\n' +
                    '• Servicios programados\n\n' +
                    '¿En qué puedo ayudarte?',
                created_at: new Date().toISOString()
            }]);
        }
    }, []);

    const handleSend = async () => {
        if (!inputValue.trim() || loading) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        setLoading(true);

        // Agregar mensaje del usuario
        const tempUserMsg: Message = {
            id: Date.now(),
            rol: 'USER',
            contenido: userMessage,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempUserMsg]);

        try {
            const res = await fetch('/api/ai/zuri/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mensaje: userMessage,
                    session_id: sessionId
                })
            });

            if (!res.ok) throw new Error('Error al enviar mensaje');

            const data = await res.json();

            // Agregar respuesta de ZURI
            const assistantMsg: Message = {
                id: Date.now() + 1,
                rol: 'ASSISTANT',
                contenido: data.respuesta,
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, assistantMsg]);

            // Guardar session_id si es nuevo
            if (!sessionId && data.session_id) {
                setSessionId(data.session_id);
            }

        } catch (error) {
            console.error('Error:', error);
            const errorMsg: Message = {
                id: Date.now() + 1,
                rol: 'SYSTEM',
                contenido: '❌ Error al procesar tu mensaje. Por favor intenta de nuevo.',
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white w-16 h-16 rounded-full shadow-2xl hover:shadow-purple-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center z-50"
                    title="Abrir asistente ZURI"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                </button>
            )}

            {/* Chat Widget */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <span className="text-lg font-bold">Z</span>
                            </div>
                            <div>
                                <h3 className="font-bold">ZURI</h3>
                                <p className="text-xs text-white/80">Asistente Administrativo</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.rol === 'USER' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.rol === 'USER'
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : msg.rol === 'SYSTEM'
                                                ? 'bg-red-100 text-red-800 rounded-bl-none'
                                                : 'bg-white text-gray-800 shadow rounded-bl-none border border-gray-200'
                                        }`}
                                >
                                    <div className="text-sm whitespace-pre-wrap">
                                        {msg.contenido.split('\n').map((line, i) => {
                                            // Parse markdown bold
                                            const parts = line.split(/\*\*(.+?)\*\*/g);
                                            return (
                                                <div key={i}>
                                                    {parts.map((part, j) =>
                                                        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="text-xs opacity-60 mt-1">
                                        {new Date(msg.created_at).toLocaleTimeString('es-PE', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white rounded-2xl px-4 py-2 shadow border border-gray-200">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-gray-200">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Escribe tu pregunta..."
                                disabled={loading}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading || !inputValue.trim()}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2 rounded-full hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                title="Enviar mensaje"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                        <div className="text-xs text-gray-400 mt-2 text-center">
                            Powered by ZURI AI • v1.0 MVP
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
