import React, { useState, useEffect } from 'react'
import { User, File } from '../types'
import { Trash2, Upload, Search, LogOut, FileText, MessageSquare } from 'lucide-react'
import { listFiles, uploadFile, deleteFile } from '../services/openai'
import { useNavigate } from 'react-router-dom'

interface DashboardProps {
  user: User
  setUser: (user: User | null) => void
}

const Dashboard: React.FC<DashboardProps> = ({ user, setUser }) => {
  const [files, setFiles] = useState<File[]>([])
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
      setFiles(fetchedFiles.map((file: any) => ({
        id: file.id,
        name: file.filename,
        size: file.bytes
      })))
      setError(null)
    } catch (err) {
      setError('Error al cargar los archivos. Por favor, intente de nuevo.')
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
      setError('Error al eliminar el archivo. Por favor, intente de nuevo.')
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const uploadedFile = await uploadFile(e.target.files[0])
        setFiles([...files, {
          id: uploadedFile.id,
          name: uploadedFile.filename,
          size: uploadedFile.bytes
        }])
      } catch (err) {
        setError('Error al subir el archivo. Por favor, intente de nuevo.')
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) return <div className="text-center mt-8">Cargando...</div>

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
        <label className="ml-4 bg-green-500 text-white p-2 rounded hover:bg-green-600 cursor-pointer">
          <Upload className="inline mr-2" />
          Subir archivo
          <input type="file" onChange={handleUpload} className="hidden" />
        </label>
      </div>
      
      <div className="mb-4 flex items-center bg-blue-50 p-3 rounded-md border border-blue-200">
        <FileText className="text-blue-500 mr-2" size={20} />
        <span className="font-medium">Total de archivos: <span className="text-blue-600">{files.length}</span></span>
      </div>
      
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 text-left">Nombre</th>
            <th className="p-2 text-left">Tamaño</th>
            <th className="p-2 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredFiles.map(file => (
            <tr key={file.id} className="border-b">
              <td className="p-2">{file.name}</td>
              <td className="p-2">{file.size} bytes</td>
              <td className="p-2">
                <button onClick={() => confirmDelete(file.id)} className="text-red-500 hover:text-red-700">
                  <Trash2 />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirmar eliminación</h3>
            <p className="mb-6">¿Está seguro que desea eliminar este archivo? Esta acción no se puede deshacer.</p>
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