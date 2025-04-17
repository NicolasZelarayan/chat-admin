import OpenAI from 'openai';

const VECTOR_STORE_ID = 'vs_680076f14da08191a3b2f2b330da3dc3';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const listFiles = async () => {
  try {
    // List all files from the vector store
    const response = await openai.beta.vectorStores.files.list(VECTOR_STORE_ID);
    
    // Para cada archivo en el vector store, obtener más detalles si es necesario
    const filesWithDetails = await Promise.all(
      response.data.map(async (fileRef) => {
        try {
          // Obtener detalles del archivo desde OpenAI files API
          const fileDetails = await openai.files.retrieve(fileRef.id);
          
          return {
            id: fileRef.id,
            file_id: fileRef.id,
            object_name: fileDetails.filename, // Usar el nombre real del archivo
            object_size: fileDetails.bytes,    // Usar el tamaño real del archivo
            created_at: fileDetails.created_at
          };
        } catch (error) {
          console.error(`Error obteniendo detalles para el archivo ${fileRef.id}:`, error);
          // Devolver información básica si no se pueden obtener detalles
          return {
            id: fileRef.id,
            file_id: fileRef.id,
            object_name: `File-${fileRef.id.substring(0, 8)}`, // Nombre genérico con parte del ID
            object_size: 0,
            created_at: fileRef.created_at
          };
        }
      })
    );
    
    return filesWithDetails;
  } catch (error) {
    console.error('Error listing vector store files:', error);
    throw error;
  }
};

export const uploadFile = async (file: File) => {
  try {
    // First upload the file to OpenAI
    const fileResponse = await openai.files.create({
      file: file,
      purpose: 'assistants',
    });
    
    // Then add the file to the vector store
    const response = await openai.beta.vectorStores.files.create(
      VECTOR_STORE_ID,
      { file_id: fileResponse.id }
    );
    
    return {
      id: response.id,
      filename: file.name,
      bytes: file.size
    };
  } catch (error) {
    console.error('Error uploading file to vector store:', error);
    throw error;
  }
};

export const deleteFile = async (fileId: string) => {
  try {
    // Remove the file from the vector store
    const response = await openai.beta.vectorStores.files.del(VECTOR_STORE_ID, fileId);
    
    // Optionally, you could also delete the file itself from OpenAI if needed
    // await openai.files.del(fileId);
    
    return response;
  } catch (error) {
    console.error('Error deleting file from vector store:', error);
    throw error;
  }
};