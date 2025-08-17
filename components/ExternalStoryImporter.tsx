"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { useToast } from './ui/use-toast';
import { Link, Upload, FileText, FolderOpen, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

interface ExternalStory {
  id: string;
  title: string;
  description: string;
  source: string;
  url?: string;
  type: 'folder' | 'document' | 'link';
  status: 'pending' | 'importing' | 'completed' | 'error';
  stories_count?: number;
  last_updated?: string;
}

interface ExternalStoryImporterProps {
  onStoriesImported: (stories: any[]) => void;
  existingStories?: any[];
}

export default function ExternalStoryImporter({ onStoriesImported, existingStories = [] }: ExternalStoryImporterProps) {
  const [imports, setImports] = useState<ExternalStory[]>([]);
  const [activeTab, setActiveTab] = useState('folder');
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  // Form states for different import types
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

  const [linkForm, setLinkForm] = useState({
    url: '',
    name: '',
    description: ''
  });

  const handleImport = async (type: 'folder' | 'document' | 'link') => {
    setIsImporting(true);
    
    let formData;
    switch (type) {
      case 'folder':
        formData = folderForm;
        break;
      case 'document':
        formData = documentForm;
        break;
      case 'link':
        formData = linkForm;
        break;
    }

    if (!formData.url.trim()) {
      toast({
        title: "Error",
        description: "Please provide a valid URL",
        variant: "destructive"
      });
      setIsImporting(false);
      return;
    }

    // Create new import entry
    const newImport: ExternalStory = {
      id: Date.now().toString(),
      title: formData.name || `Imported ${type}`,
      description: formData.description || `Imported from ${formData.url}`,
      source: formData.url,
      url: formData.url,
      type,
      status: 'importing',
      last_updated: new Date().toISOString()
    };

    setImports(prev => [...prev, newImport]);

    try {
      // Simulate API call to import external stories
      await simulateImport(newImport);
      
      // Update import status
      setImports(prev => prev.map(imp => 
        imp.id === newImport.id 
          ? { ...imp, status: 'completed', stories_count: Math.floor(Math.random() * 50) + 10 }
          : imp
      ));

      toast({
        title: "Import Successful",
        description: `Successfully imported ${type} with stories`,
      });

      // Clear form
      switch (type) {
        case 'folder':
          setFolderForm({ url: '', name: '', description: '' });
          break;
        case 'document':
          setDocumentForm({ url: '', name: '', description: '' });
          break;
        case 'link':
          setLinkForm({ url: '', name: '', description: '' });
          break;
      }

    } catch (error) {
      setImports(prev => prev.map(imp => 
        imp.id === newImport.id 
          ? { ...imp, status: 'error' }
          : imp
      ));

      toast({
        title: "Import Failed",
        description: "Failed to import external stories. Please check the URL and try again.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const simulateImport = async (importItem: ExternalStory): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate success/failure
    if (Math.random() > 0.1) { // 90% success rate
      return Promise.resolve();
    } else {
      return Promise.reject(new Error('Import failed'));
    }
  };

  const removeImport = (id: string) => {
    setImports(prev => prev.filter(imp => imp.id !== id));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'importing':
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
      case 'importing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Import External User Stories
          </CardTitle>
          <CardDescription>
            Import existing user stories from Google Drive, SharePoint, or other document sources to compare with your interview results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="folder" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Folder
              </TabsTrigger>
              <TabsTrigger value="document" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Document
              </TabsTrigger>
              <TabsTrigger value="link" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Direct Link
              </TabsTrigger>
            </TabsList>

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
                    Supports Google Drive, SharePoint, OneDrive, and other cloud storage folders
                  </p>
                </div>
                <div>
                  <Label htmlFor="folder-name">Display Name (Optional)</Label>
                  <Input
                    id="folder-name"
                    placeholder="Project Arch User Stories"
                    value={folderForm.name}
                    onChange={(e) => setFolderForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="folder-description">Description (Optional)</Label>
                  <Input
                    id="folder-description"
                    placeholder="Reference user stories from Project Arch for comparison"
                    value={folderForm.description}
                    onChange={(e) => setFolderForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <Button 
                  onClick={() => handleImport('folder')}
                  disabled={isImporting || !folderForm.url.trim()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
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
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={documentForm.url}
                    onChange={(e) => setDocumentForm(prev => ({ ...prev, url: e.target.value }))}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Supports Google Sheets, Excel files, CSV files, and other document formats
                  </p>
                </div>
                <div>
                  <Label htmlFor="doc-name">Display Name (Optional)</Label>
                  <Input
                    id="doc-name"
                    placeholder="Workflow Requirements Spreadsheet"
                    value={documentForm.name}
                    onChange={(e) => setDocumentForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="doc-description">Description (Optional)</Label>
                  <Input
                    id="doc-description"
                    placeholder="Initial workflow management requirements from stakeholders"
                    value={documentForm.description}
                    onChange={(e) => setDocumentForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <Button 
                  onClick={() => handleImport('document')}
                  disabled={isImporting || !documentForm.url.trim()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Document
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="link" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="link-url">Direct Link</Label>
                  <Input
                    id="link-url"
                    placeholder="https://example.com/user-stories.json"
                    value={linkForm.url}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, url: e.target.value }))}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Direct links to JSON, CSV, or other data formats
                  </p>
                </div>
                <div>
                  <Label htmlFor="link-name">Display Name (Optional)</Label>
                  <Input
                    id="link-name"
                    placeholder="External API Stories"
                    value={linkForm.name}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="link-description">Description (Optional)</Label>
                  <Input
                    id="link-description"
                    placeholder="User stories from external system or API"
                    value={linkForm.description}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <Button 
                  onClick={() => handleImport('link')}
                  disabled={isImporting || !linkForm.url.trim()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import from Link
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Import History */}
      {imports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Import History</CardTitle>
            <CardDescription>
              Track your external story imports and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {imports.map((importItem) => (
                <div key={importItem.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(importItem.status)}
                    <div>
                      <div className="font-medium">{importItem.title}</div>
                      <div className="text-sm text-gray-500">{importItem.description}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {importItem.type}
                        </Badge>
                        <Badge className={getStatusColor(importItem.status)}>
                          {importItem.status}
                        </Badge>
                        {importItem.stories_count && (
                          <Badge variant="secondary" className="text-xs">
                            {importItem.stories_count} stories
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {importItem.url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={importItem.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => removeImport(importItem.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Why Import External Stories?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-green-700">Gap Analysis</h4>
              <p className="text-sm text-gray-600">
                Compare interview results with existing requirements to identify missing features
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-700">Reference Templates</h4>
              <p className="text-sm text-gray-600">
                Use existing stories as templates for consistent formatting and structure
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-purple-700">Data Enrichment</h4>
              <p className="text-sm text-gray-600">
                Merge multiple sources into a comprehensive user story database
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-orange-700">Quality Assurance</h4>
              <p className="text-sm text-gray-600">
                Validate interview extraction against known good examples
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
