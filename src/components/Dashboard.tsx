import React, { useState, useEffect } from 'react'
import { User, File } from '../types'
import { Trash2, Upload, Search } from 'lucide-react'
import { listFiles, uploadFile, deleteFile } from '../services/openai'

interface DashboardProps {
  user: User
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [files, setFiles] = useState<File[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const handleDelete = async (id: string) => {
    try {
      await deleteFile(id)
      setFiles(files.filter(file => file.id !== id))
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

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) return <div className="text-center mt-8">Cargando...</div>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Bienvenido, {user.username}</h1>
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
                <button onClick={() => handleDelete(file.id)} className="text-red-500 hover:text-red-700">
                  <Trash2 />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Dashboard