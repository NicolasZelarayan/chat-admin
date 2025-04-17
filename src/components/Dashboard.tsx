import React, { useState, useEffect } from 'react'
import { User, File } from '../types'
import { Trash2, Upload, Search, LogOut, FileText, MessageSquare, Calendar, Clock } from 'lucide-react'
import { listFiles, uploadFile, deleteFile } from '../services/openai'
import { useNavigate } from 'react-router-dom'

interface DashboardProps {
  user: User
  setUser: (user: User | null) => void
}

// Función para formatear bytes en unidades legibles
const formatBytes = (bytes: number, decimals = 2) => {
  if (!bytes) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Función para formatear fechas
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000); // Convertir de timestamp Unix a fecha JS
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

const Dashboard: React.FC<DashboardProps> = ({ user, setUser }) => {
  const [files, setFiles] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      setIsLoading(true)
      const fetchedFiles = await listFiles()
      setFiles(fetchedFiles);
      setError(null)
    } catch (err) {
      setError('Error al cargar los archivos del vector store. Por favor, intente de nuevo.')
      console.error('Error fetching files:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const confirmDelete = (id: string) => {
    setFileToDelete(id)
    setShowDeleteConfirm(true)
  }

  const handleDelete = async () => {
    if (!fileToDelete) return

    try {
      await deleteFile(fileToDelete)
      setFiles(files.filter(file => file.id !== fileToDelete))
      setShowDeleteConfirm(false)
      setFileToDelete(null)
    } catch (err) {
      setError('Error al eliminar el archivo del vector store. Por favor, intente de nuevo.')
      console.error('Error deleting file:', err)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        setIsLoading(true)
        const uploadedFile = await uploadFile(e.target.files[0])
        
        // Actualizar la lista completa en lugar de añadir manualmente
        await fetchFiles()
      } catch (err) {
        setError('Error al subir el archivo al vector store. Por favor, intente de nuevo.')
        console.error('Error uploading file:', err)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }

  const filteredFiles = files.filter(file =>
    file.object_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Bienvenido, {user.username}</h1>
        <div className="flex space-x-3">
          <button 
            onClick={() => navigate('/chat')}
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200"
          >
            <MessageSquare className="mr-2" size={18} />
            Chat IA
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-200"
          >
            <LogOut className="mr-2" size={18} />
            Cerrar sesión
          </button>
        </div>
      </div>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      
      <div className="mb-4 flex items-center">
        <Search className="mr-2" />
        <input
          type="text"
          placeholder="Buscar archivos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded flex-grow"
        />
        <label className="ml-4 bg-green-500 text-white p-2 rounded hover:bg-green-600 cursor-pointer flex items-center">
          <Upload className="mr-2" size={18} />
          Subir archivo al Vector Store
          <input type="file" onChange={handleUpload} className="hidden" />
        </label>
      </div>
      
      <div className="mb-4 flex items-center bg-blue-50 p-3 rounded-md border border-blue-200">
        <FileText className="text-blue-500 mr-2" size={20} />
        <span className="font-medium">Vector Store ID: <span className="text-blue-600">vs_680076f14da08191a3b2f2b330da3dc3</span></span>
      </div>
      
      <div className="mb-4 flex items-center bg-blue-50 p-3 rounded-md border border-blue-200">
        <FileText className="text-blue-500 mr-2" size={20} />
        <span className="font-medium">Total de archivos: <span className="text-blue-600">{files.length}</span></span>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">
          <div className="flex justify-center items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '600ms' }}></div>
          </div>
          <p className="mt-2 text-gray-600">Cargando archivos del Vector Store...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">Nombre</th>
                <th className="p-2 text-left">Tamaño</th>
                <th className="p-2 text-left">Fecha</th>
                <th className="p-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.length > 0 ? (
                filteredFiles.map(file => (
                  <tr key={file.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center">
                        <FileText size={18} className="mr-2 text-blue-500" />
                        <span>{file.object_name}</span>
                      </div>
                    </td>
                    <td className="p-3">{formatBytes(file.object_size)}</td>
                    <td className="p-3">
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-1 text-gray-500" />
                        <span>{file.created_at ? formatDate(file.created_at) : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <button 
                        onClick={() => confirmDelete(file.id)} 
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                        title="Eliminar archivo"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    {searchTerm ? 'No se encontraron archivos que coincidan con la búsqueda' : 'No hay archivos en el Vector Store'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirmar eliminación</h3>
            <p className="mb-6">¿Está seguro que desea eliminar este archivo del Vector Store? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)} 
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDelete} 
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard