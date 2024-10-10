import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: This is not recommended for production
});

export const listFiles = async () => {
  try {
    const response = await openai.files.list();
    return response.data;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
};

export const uploadFile = async (file: File) => {
  try {
    const response = await openai.files.create({
      file: file,
      purpose: 'assistants',
    });
    return response;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const deleteFile = async (fileId: string) => {
  try {
    const response = await openai.files.del(fileId);
    return response;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};