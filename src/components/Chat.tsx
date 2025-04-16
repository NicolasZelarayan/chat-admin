import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';

const API_URL = 'https://api-chat1-1-637676062045.southamerica-east1.run.app';
const API_KEY = import.meta.env.VITE_CHAT_API_KEY || '';

interface ChatResponse {
  answer: string;
}

const askQuestion = async (question: string): Promise<string> => {
  try {
    const response = await axios.post<ChatResponse>(
      `${API_URL}/ask`,
      { question },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        }
      }
    );
    return response.data.answer;
  } catch (error: any) {
    // Verificamos si es un error de Axios comprobando si tiene la propiedad response
    if (error.response) {
      if (error.response.status === 403) {
        throw new Error('Error de autenticación: API key inválida');
      } else if (error.response.status === 400) {
        throw new Error('Error en la solicitud: Pregunta no proporcionada');
      } else {
        const errorMessage = error.response.data && typeof error.response.data === 'object' 
          ? error.response.data.message || 'Error desconocido'
          : error.message || 'Error desconocido';
        throw new Error(`Error del servidor: ${errorMessage}`);
      }
    } else if (error.request) {
      // La solicitud se realizó pero no se recibió respuesta
      throw new Error('No se recibió respuesta del servidor');
    } else {
      // Ocurrió un error al configurar la solicitud
      throw new Error(`Error al configurar la solicitud: ${error.message || 'Error desconocido'}`);
    }
  }
};

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatProps {
  user?: any;
}

const Chat: React.FC<ChatProps> = ({ user }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await askQuestion(userMessage.text);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al comunicarse con el asistente');
      console.error('Error al enviar mensaje:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      <div className="flex items-center mb-4">
        <button 
          onClick={() => navigate('/dashboard')}
          className="mr-4 p-2 rounded-full hover:bg-gray-200"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Chat con Asistente IA</h1>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          {error}
        </div>
      )}
      
      <div 
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg"
      >
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}
          >
            <div 
              className={`inline-block p-3 rounded-lg max-w-[70%] ${
                message.sender === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {message.text}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-left mb-4">
            <div className="inline-block p-3 rounded-lg bg-gray-200 text-gray-800">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '600ms' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Escribe tu mensaje aquí..."
          className="flex-1 p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="bg-blue-500 text-white p-3 rounded-r-lg hover:bg-blue-600 disabled:bg-blue-300"
          disabled={isLoading || !input.trim()}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default Chat;