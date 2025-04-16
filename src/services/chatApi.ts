import axios from 'axios';

const API_URL = 'https://api-chat1-1-637676062045.southamerica-east1.run.app';
const API_KEY = import.meta.env.VITE_CHAT_API_KEY || '';

interface ChatResponse {
  answer: string;
}

export const askQuestion = async (question: string): Promise<string> => {
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
    // Manejo de errores de Axios
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      if (error.response.status === 403) {
        throw new Error('Error de autenticación: API key inválida');
      } else if (error.response.status === 400) {
        throw new Error('Error en la solicitud: Pregunta no proporcionada');
      } else {
        const errorMessage = error.response.data && typeof error.response.data === 'object' 
          ? error.response.data.message || 'Error del servidor'
          : error.message;
        throw new Error(`Error del servidor: ${errorMessage}`);
      }
    }
    throw new Error('Error al conectar con el servicio de chat');
  }
};