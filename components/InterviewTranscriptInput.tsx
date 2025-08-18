"use client";

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { useToast } from './ui/use-toast';
import { Upload, Link, FolderOpen, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { importFromDocument, importFromFolder } from '@/lib/api';

interface TranscriptInput {
  id: string;
  type: 'file' | 'folder' | 'document';
  name: string;
  source: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  size?: number;
  file_count?: number;
  file?: File; // Add actual file reference
}

interface InterviewTranscriptInputProps {
  onTranscriptsAdded: (transcripts: TranscriptInput[]) => void;
  onTranscriptsRemoved: (transcriptIds: string[]) => void;
}

export default function InterviewTranscriptInput({ 
  onTranscriptsAdded, 
  onTranscriptsRemoved 
}: InterviewTranscriptInputProps) {
  const [transcripts, setTranscripts] = useState<TranscriptInput[]>([]);
  const [activeTab, setActiveTab] = useState('file');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Form states for different input types
  const [folderForm, setFolderForm] = useState({
    url: '',
    name: '',
    description: ''
  });

  const [documentForm, setDocumentForm] = useState({
    url: '',
    name: '',
    description: ''
  });

  // File dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newTranscripts: TranscriptInput[] = acceptedFiles.map((file, index) => ({
      id: `file_${Date.now()}_${index}`,
      type: 'file' as const,
      name: file.name,
      source: file.name,
      status: 'pending',
      size: file.size,
      file: file // Store the actual file reference
    }));

    setTranscripts(prev => [...prev, ...newTranscripts]);
    onTranscriptsAdded(newTranscripts);

    toast({
      title: "Files Added",
      description: `${acceptedFiles.length} file(s) added for processing`,
    });
  }, [onTranscriptsAdded, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/pdf': ['.pdf'],
      'text/markdown': ['.md']
    },
    multiple: true
  });

  const handleFolderImport = async () => {
    if (!folderForm.url.trim()) {
      toast({
        title: "Error",
        description: "Please provide a valid folder URL",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    const newTranscript: TranscriptInput = {
      id: `folder_${Date.now()}`,
      type: 'folder',
      name: folderForm.name || `Imported Folder`,
      source: folderForm.url,
      status: 'uploading'
    };

    setTranscripts(prev => [...prev, newTranscript]);

    try {
      // Call real API
      const result = await importFromFolder(
        folderForm.url,
        folderForm.name || `Imported Folder`,
        folderForm.description
      );
      
      if (result.success) {
        setTranscripts(prev => prev.map(t => 
          t.id === newTranscript.id 
            ? { ...t, status: 'completed', file_count: result.stories_imported || 0 }
            : t
        ));

        onTranscriptsAdded([newTranscript]);

        toast({
          title: "Folder Imported",
          description: `Successfully imported folder with ${result.stories_imported || 0} stories`,
        });
      } else {
        throw new Error(result.error || 'Import failed');
      }

      // Clear form
      setFolderForm({ url: '', name: '', description: '' });

    } catch (error) {
      setTranscripts(prev => prev.map(t => 
        t.id === newTranscript.id 
          ? { ...t, status: 'error' }
          : t
      ));

      toast({
        title: "Import Failed",
        description: "Failed to import folder. Please check the URL and try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDocumentImport = async () => {
    if (!documentForm.url.trim()) {
      toast({
        title: "Error",
        description: "Please provide a valid document URL",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    const newTranscript: TranscriptInput = {
      id: `document_${Date.now()}`,
      type: 'document',
      name: documentForm.name || `Imported Document`,
      source: documentForm.url,
      status: 'uploading'
    };

    setTranscripts(prev => [...prev, newTranscript]);

    try {
      // Call real API
      const result = await importFromDocument(
        documentForm.url,
        documentForm.name || `Imported Document`,
        documentForm.description
      );
      
      if (result.success) {
        setTranscripts(prev => prev.map(t => 
          t.id === newTranscript.id 
            ? { ...t, status: 'completed', file_count: result.stories_imported || 1 }
            : t
        ));

        onTranscriptsAdded([newTranscript]);

        toast({
          title: "Document Imported",
          description: `Successfully imported document with ${result.stories_imported || 1} stories`,
        });
      } else {
        throw new Error(result.error || 'Import failed');
      }

      // Clear form
      setDocumentForm({ url: '', name: '', description: '' });

    } catch (error) {
      setTranscripts(prev => prev.map(t => 
        t.id === newTranscript.id 
          ? { ...t, status: 'error' }
          : t
      ));

      toast({
        title: "Import Failed",
        description: "Failed to import document. Please check the URL and try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const removeTranscript = (id: string) => {
    setTranscripts(prev => prev.filter(t => t.id !== id));
    onTranscriptsRemoved([id]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'uploading':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Add Interview Transcripts
          </CardTitle>
          <CardDescription>
            Upload interview files, import from cloud storage, or provide document links to process into user stories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                File Upload
              </TabsTrigger>
              <TabsTrigger value="folder" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Folder Link
              </TabsTrigger>
              <TabsTrigger value="document" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Document Link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                {isDragActive ? (
                  <p className="text-blue-600 font-medium">Drop the files here...</p>
                ) : (
                  <div>
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Drag & drop interview files here
                    </p>
                    <p className="text-gray-500 mb-4">
                      or click to select files
                    </p>
                    <p className="text-sm text-gray-400">
                      Supports: ZIP, TXT, DOCX, PDF, MD
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="folder" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="folder-url">Folder URL</Label>
                  <Input
                    id="folder-url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={folderForm.url}
                    onChange={(e) => setFolderForm(prev => ({ ...prev, url: e.target.value }))}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Google Drive, SharePoint, OneDrive, or other cloud storage folders
                  </p>
                </div>
                <div>
                  <Label htmlFor="folder-name">Display Name (Optional)</Label>
                  <Input
                    id="folder-name"
                    placeholder="Interview Transcripts 2024"
                    value={folderForm.name}
                    onChange={(e) => setFolderForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="folder-description">Description (Optional)</Label>
                  <Input
                    id="folder-description"
                    placeholder="Customer interview transcripts for Q1 2024"
                    value={folderForm.description}
                    onChange={(e) => setFolderForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <Button 
                  onClick={handleFolderImport}
                  disabled={isProcessing || !folderForm.url.trim()}
                  className="w-full"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Import Folder
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="document" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="doc-url">Document URL</Label>
                  <Input
                    id="doc-url"
                    placeholder="https://docs.google.com/document/d/..."
                    value={documentForm.url}
                    onChange={(e) => setDocumentForm(prev => ({ ...prev, url: e.target.value }))}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Google Docs, Word documents, PDFs, or other document formats
                  </p>
                </div>
                <div>
                  <Label htmlFor="doc-name">Display Name (Optional)</Label>
                  <Input
                    id="doc-name"
                    placeholder="Customer Interview Summary"
                    value={documentForm.name}
                    onChange={(e) => setDocumentForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="doc-description">Description (Optional)</Label>
                  <Input
                    id="doc-description"
                    placeholder="Summary of customer interviews conducted in March 2024"
                    value={documentForm.description}
                    onChange={(e) => setDocumentForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <Button 
                  onClick={handleDocumentImport}
                  disabled={isProcessing || !documentForm.url.trim()}
                  className="w-full"
                >
                  <Link className="h-4 w-4 mr-2" />
                  Import Document
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Transcript List */}
      {transcripts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Interview Transcripts ({transcripts.length})</CardTitle>
            <CardDescription>
              Transcripts ready for processing into user stories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transcripts.map((transcript) => (
                <div key={transcript.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(transcript.status)}
                    <div>
                      <div className="font-medium">{transcript.name}</div>
                      <div className="text-sm text-gray-500">{transcript.source}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {transcript.type}
                        </Badge>
                        <Badge className={getStatusColor(transcript.status)}>
                          {transcript.status}
                        </Badge>
                        {transcript.size && (
                          <Badge variant="secondary" className="text-xs">
                            {formatFileSize(transcript.size)}
                          </Badge>
                        )}
                        {transcript.file_count && (
                          <Badge variant="secondary" className="text-xs">
                            {transcript.file_count} files
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => removeTranscript(transcript.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Info */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-blue-700">Supported Formats</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• ZIP archives (containing multiple files)</li>
                <li>• Text files (.txt)</li>
                <li>• Word documents (.docx)</li>
                <li>• PDF files (.pdf)</li>
                <li>• Markdown files (.md)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-green-700">Processing Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Automatic text extraction</li>
                <li>• Speaker identification</li>
                <li>• Content categorization</li>
                <li>• AI-powered story extraction</li>
                <li>• CSV output generation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
