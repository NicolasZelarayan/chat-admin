import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import OpenAI from 'openai';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Components } from 'react-markdown';

// Definir la interfaz CodeProps localmente
interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

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

  // Este componente renderiza un mensaje de chat con formato Markdown
  const MessageContent = ({ text, sender }: { text: string, sender: string }) => {
    if (sender === 'user') {
      return <div className="whitespace-pre-wrap break-words">{text}</div>;
    }
    
    return (
      <div className="markdown-content">
        <ReactMarkdown
          components={{
            h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-xl font-bold my-3" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-lg font-bold my-2" {...props} />,
            p: ({node, ...props}) => <p className="my-2" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2" {...props} />,
            li: ({node, ...props}) => <li className="my-1" {...props} />,
            a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
            blockquote: ({node, ...props}) => (
              <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2" {...props} />
            ),
            code: ({ node, inline, className, children, ...props }: CodeProps) => {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={atomDark}
                  language={match[1]}
                  PreTag="div"
                  className="rounded my-2 text-sm"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className="bg-gray-100 px-1 rounded text-red-500 font-mono text-sm" {...props}>
                  {children}
                </code>
              );
            },
            table: ({node, ...props}) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-gray-200" {...props} />
              </div>
            ),
            thead: ({node, ...props}) => <thead className="bg-gray-50" {...props} />,
            tbody: ({node, ...props}) => <tbody className="divide-y divide-gray-200" {...props} />,
            tr: ({node, ...props}) => <tr className="hover:bg-gray-50" {...props} />,
            th: ({node, ...props}) => (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props} />
            ),
            td: ({node, ...props}) => <td className="px-6 py-4 whitespace-nowrap" {...props} />,
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
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
            className={`mb-6 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}
          >
            <div 
              className={`inline-block p-4 rounded-lg max-w-[80%] shadow ${
                message.sender === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              <MessageContent text={message.text} sender={message.sender} />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-left mb-4">
            <div className="inline-block p-4 rounded-lg bg-white border border-gray-200 text-gray-800 shadow">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span>El asistente está escribiendo...</span>
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
          className="bg-blue-500 text-white p-3 rounded-r-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
          disabled={isLoading || !input.trim() || !threadId}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default Chat;