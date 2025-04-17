import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Assistant ID
const ASSISTANT_ID = 'asst_gtfqLpPJuQnhonLHG0RIpvma';

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
  const [threadId, setThreadId] = useState<string | null>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Create a new thread when component mounts
  useEffect(() => {
    const createThread = async () => {
      try {
        const thread = await openai.beta.threads.create();
        setThreadId(thread.id);
        console.log('Thread created with ID:', thread.id);
      } catch (err) {
        console.error('Error creating thread:', err);
        setError('Error al inicializar el chat');
      }
    };

    createThread();
  }, []);

  // Auto-scroll to the last message
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || !threadId) return;
    
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
      // Add message to thread
      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: userMessage.text
      });
      
      // Run the assistant
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: ASSISTANT_ID
      });
      
      // Poll for the run completion
      let runStatus = await pollRunStatus(threadId, run.id);
      
      if (runStatus === 'completed') {
        // Get the assistant's messages
        const messagesResponse = await openai.beta.threads.messages.list(threadId);
        
        // Get the last assistant message
        const assistantMessages = messagesResponse.data.filter(msg => msg.role === 'assistant');
        if (assistantMessages.length > 0) {
          const lastMessage = assistantMessages[0];
          
          // Extract text content
          let responseText = '';
          if (lastMessage.content && lastMessage.content.length > 0) {
            const textContent = lastMessage.content.filter(content => 
              content.type === 'text'
            );
            if (textContent.length > 0 && 'text' in textContent[0]) {
              responseText = textContent[0].text.value;
            }
          }
          
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: responseText || 'No pude generar una respuesta.',
            sender: 'bot',
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, botMessage]);
        }
      } else {
        throw new Error(`La ejecución del asistente falló con estado: ${runStatus}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al comunicarse con el asistente');
      console.error('Error al enviar mensaje:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const pollRunStatus = async (threadId: string, runId: string) => {
    const maxAttempts = 20;
    const delayMs = 1000;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const run = await openai.beta.threads.runs.retrieve(threadId, runId);
      
      if (run.status === 'completed') {
        return 'completed';
      } else if (
        run.status === 'failed' || 
        run.status === 'cancelled' || 
        run.status === 'expired'
      ) {
        throw new Error(`Run ended with status: ${run.status}`);
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    throw new Error('Run timed out');
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
          disabled={isLoading || !threadId}
        />
        <button 
          type="submit" 
          className="bg-blue-500 text-white p-3 rounded-r-lg hover:bg-blue-600 disabled:bg-blue-300"
          disabled={isLoading || !input.trim() || !threadId}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default Chat;