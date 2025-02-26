'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, X, Upload, Image as ImageIcon, FileText, Film, Music } from 'lucide-react'

interface PortfolioUploadProps {
  userId: string
  onUploadComplete?: (files: PortfolioFile[]) => void
}

interface PortfolioFile {
  id: string
  name: string
  url: string
  type: string
  thumbnailUrl?: string
}

export function PortfolioUpload({ userId, onUploadComplete }: PortfolioUploadProps) {
  const [files, setFiles] = useState<PortfolioFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    
    const selectedFiles = Array.from(e.target.files)
    handleUpload(selectedFiles)
  }

  const handleUpload = async (selectedFiles: File[]) => {
    if (!userId || !selectedFiles.length) return
    
    setUploading(true)
    const newProgress: Record<string, number> = {}
    
    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const fileId = Math.random().toString(36).substring(2, 15)
        newProgress[fileId] = 0
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))
        
        // Create a file path in the storage bucket
        const filePath = `portfolio/${userId}/${Date.now()}_${file.name}`
        
        // Upload the file to Supabase Storage
        const { data, error } = await supabase.storage
          .from('portfolio')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            onUploadProgress: (progress) => {
              const percent = Math.round((progress.loaded / progress.total) * 100)
              setUploadProgress(prev => ({ ...prev, [fileId]: percent }))
            }
          })
          
        if (error) throw error
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('portfolio')
          .getPublicUrl(filePath)
          
        // Determine file type category
        const fileType = getFileType(file.type)
        
        // Generate thumbnail for images
        let thumbnailUrl = undefined
        if (fileType === 'image') {
          thumbnailUrl = publicUrl
        }
        
        // Return the file info
        return {
          id: fileId,
          name: file.name,
          url: publicUrl,
          type: fileType,
          thumbnailUrl
        }
      })
      
      const uploadedFiles = await Promise.all(uploadPromises)
      
      // Update the files state
      setFiles(prev => [...prev, ...uploadedFiles])
      
      // Save the file references to the user's profile
      await saveFilesToProfile(uploadedFiles)
      
      // Call the callback if provided
      if (onUploadComplete) {
        onUploadComplete(uploadedFiles)
      }
      
      toast({
        title: 'Files uploaded',
        description: `Successfully uploaded ${uploadedFiles.length} file(s)`,
        variant: 'default'
      })
      
    } catch (error) {
      console.error('Error uploading files:', error)
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your files. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
      setUploadProgress({})
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }
  
  const saveFilesToProfile = async (newFiles: PortfolioFile[]) => {
    try {
      // Get existing portfolio files
      const { data: profile } = await supabase
        .from('profiles')
        .select('portfolio_files')
        .eq('user_id', userId)
        .single()
      
      const existingFiles = profile?.portfolio_files || []
      
      // Update the profile with the new files
      await supabase
        .from('profiles')
        .update({
          portfolio_files: [...existingFiles, ...newFiles]
        })
        .eq('user_id', userId)
    } catch (error) {
      console.error('Error saving files to profile:', error)
    }
  }
  
  const handleRemoveFile = async (fileId: string) => {
    try {
      // Find the file to remove
      const fileToRemove = files.find(f => f.id === fileId)
      if (!fileToRemove) return
      
      // Remove from Supabase Storage if needed
      // This would require extracting the path from the URL
      
      // Remove from state
      setFiles(prev => prev.filter(f => f.id !== fileId))
      
      // Update the profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('portfolio_files')
        .eq('user_id', userId)
        .single()
      
      const existingFiles = profile?.portfolio_files || []
      
      await supabase
        .from('profiles')
        .update({
          portfolio_files: existingFiles.filter((f: PortfolioFile) => f.id !== fileId)
        })
        .eq('user_id', userId)
        
      toast({
        title: 'File removed',
        description: `Removed ${fileToRemove.name}`,
        variant: 'default'
      })
    } catch (error) {
      console.error('Error removing file:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove the file. Please try again.',
        variant: 'destructive'
      })
    }
  }
  
  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    return 'document'
  }
  
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-8 w-8 text-blue-500" />
      case 'video':
        return <Film className="h-8 w-8 text-purple-500" />
      case 'audio':
        return <Music className="h-8 w-8 text-green-500" />
      default:
        return <FileText className="h-8 w-8 text-gray-500" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Portfolio</h3>
        <Button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          variant="outline"
          size="sm"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Files
            </>
          )}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
        />
      </div>
      
      {/* File progress indicators */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          ))}
        </div>
      )}
      
      {/* File grid */}
      {files.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {files.map(file => (
            <Card key={file.id} className="relative overflow-hidden group">
              <div className="p-4">
                <div className="aspect-square flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md mb-2">
                  {file.thumbnailUrl ? (
                    <img 
                      src={file.thumbnailUrl} 
                      alt={file.name}
                      className="object-cover w-full h-full rounded-md"
                    />
                  ) : (
                    getFileIcon(file.type)
                  )}
                </div>
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-gray-500 capitalize">{file.type}</p>
              </div>
              
              <button
                onClick={() => handleRemoveFile(file.id)}
                className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove file"
              >
                <X className="h-4 w-4 text-gray-500 hover:text-red-500" />
              </button>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed rounded-md">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            Upload your portfolio items
          </p>
          <p className="text-xs text-gray-400">
            Supports images, videos, audio, and documents
          </p>
        </div>
      )}
    </div>
  )
} 