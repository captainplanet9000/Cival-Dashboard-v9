'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, File, FileText, Image, Video, Music, Archive,
  Check, X, AlertTriangle, Loader2, Download, Trash2,
  Eye, Share2, FolderOpen
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: string
  status: 'uploading' | 'completed' | 'error'
  progress: number
  agentIngested?: boolean
}

interface FileManagerDropzoneProps {
  onFileUploaded?: (file: UploadedFile) => void
  onFileIngested?: (file: UploadedFile) => void
  maxFiles?: number
  maxSize?: number
  acceptedTypes?: string[]
}

export function FileManagerDropzone({
  onFileUploaded,
  onFileIngested,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  acceptedTypes = ['image/*', 'text/*', 'application/pdf', 'application/json', '.csv', '.xlsx']
}: FileManagerDropzoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length + uploadedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    setIsUploading(true)

    for (const file of acceptedFiles) {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size: ${maxSize / 1024 / 1024}MB`)
        continue
      }

      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: '',
        uploadedAt: new Date().toISOString(),
        status: 'uploading',
        progress: 0
      }

      setUploadedFiles(prev => [...prev, newFile])

      try {
        // Upload to Supabase Storage
        const filePath = `agent-data/${fileId}/${file.name}`
        
        const { data, error } = await supabase.storage
          .from('agent-files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          throw error
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('agent-files')
          .getPublicUrl(filePath)

        // Store file metadata in database
        const { error: dbError } = await supabase
          .from('agent_files')
          .insert({
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            url: publicUrl,
            storage_path: filePath,
            uploaded_at: new Date().toISOString(),
            agent_ingested: false,
            metadata: {
              originalName: file.name,
              uploadSource: 'dashboard_dropzone'
            }
          })

        if (dbError) {
          throw dbError
        }

        // Update file status
        const updatedFile: UploadedFile = {
          ...newFile,
          url: publicUrl,
          status: 'completed',
          progress: 100
        }

        setUploadedFiles(prev => 
          prev.map(f => f.id === fileId ? updatedFile : f)
        )

        onFileUploaded?.(updatedFile)
        toast.success(`File ${file.name} uploaded successfully`)

      } catch (error) {
        console.error('Upload error:', error)
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileId ? { ...f, status: 'error' as const } : f)
        )
        toast.error(`Failed to upload ${file.name}`)
      }
    }

    setIsUploading(false)
  }, [uploadedFiles.length, maxFiles, maxSize, onFileUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    multiple: true,
    disabled: isUploading
  })

  const ingestFileForAgents = async (file: UploadedFile) => {
    try {
      // Mark file as being processed for agent ingestion
      const { error } = await supabase
        .from('agent_files')
        .update({ 
          agent_ingested: true,
          ingested_at: new Date().toISOString()
        })
        .eq('id', file.id)

      if (error) throw error

      // Trigger agent data processing
      const response = await fetch('/api/agents/ingest-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: file.id,
          url: file.url,
          type: file.type,
          name: file.name
        })
      })

      if (!response.ok) {
        throw new Error('Failed to ingest file for agents')
      }

      setUploadedFiles(prev => 
        prev.map(f => f.id === file.id ? { ...f, agentIngested: true } : f)
      )

      onFileIngested?.(file)
      toast.success(`File ${file.name} ingested for agent processing`)

    } catch (error) {
      console.error('Ingestion error:', error)
      toast.error(`Failed to ingest ${file.name} for agents`)
    }
  }

  const deleteFile = async (file: UploadedFile) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('agent-files')
        .remove([file.url.split('/').slice(-2).join('/')])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('agent_files')
        .delete()
        .eq('id', file.id)

      if (dbError) throw dbError

      setUploadedFiles(prev => prev.filter(f => f.id !== file.id))
      toast.success(`File ${file.name} deleted`)

    } catch (error) {
      console.error('Delete error:', error)
      toast.error(`Failed to delete ${file.name}`)
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />
    if (type.startsWith('video/')) return <Video className="h-5 w-5" />
    if (type.startsWith('audio/')) return <Music className="h-5 w-5" />
    if (type.includes('pdf') || type.startsWith('text/')) return <FileText className="h-5 w-5" />
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Agent File Manager
          </CardTitle>
          <CardDescription>
            Upload files for agent data ingestion and processing. Supported formats: Images, Documents, CSV, JSON, PDF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600 font-medium">Drop files here to upload...</p>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {isUploading ? 'Uploading...' : 'Drag & drop files here'}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  or click to select files
                </p>
                <Button variant="outline" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Select Files
                    </>
                  )}
                </Button>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-4">
              Max {maxFiles} files, {maxSize / 1024 / 1024}MB each
            </p>
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files ({uploadedFiles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleString()}
                      </p>
                      {file.status === 'uploading' && (
                        <Progress value={file.progress} className="mt-1 h-1" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {file.status === 'completed' && (
                      <>
                        <Badge variant={file.agentIngested ? 'success' : 'outline'}>
                          {file.agentIngested ? 'Ingested' : 'Ready'}
                        </Badge>
                        {!file.agentIngested && (
                          <Button
                            size="sm"
                            variant="agent"
                            onClick={() => ingestFileForAgents(file)}
                          >
                            Ingest for Agents
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(file.url, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {file.status === 'uploading' && (
                      <Badge variant="info">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Uploading
                      </Badge>
                    )}
                    {file.status === 'error' && (
                      <Badge variant="destructive">
                        <X className="h-3 w-3 mr-1" />
                        Error
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteFile(file)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {uploadedFiles.some(f => f.agentIngested) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Files marked as "Ingested" are being processed by the AI agents for data extraction and analysis.
            You can monitor agent activity in the Agents tab.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default FileManagerDropzone