'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { toast } from './ui/use-toast';
import { apiEndpoints } from '../lib/api';

interface FileUploadProps {
  construct: any;
  onUploadComplete: (jobData: any) => void;
  onBack: () => void;
}

export function FileUpload({ construct, onUploadComplete, onBack }: FileUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [jobData, setJobData] = useState<any>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'application/zip') {
      setUploadedFile(file);
      toast({
        title: "File selected",
        description: `${file.name} is ready for upload.`,
      });
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a ZIP file containing your interview transcripts.",
        variant: "destructive"
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip']
    },
    multiple: false
  });

  const handleUpload = async () => {
    if (!uploadedFile || !construct) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create job
      const jobResponse = await apiEndpoints.jobs.create({
        name: `Interview Processing - ${new Date().toLocaleDateString()}`,
        description: `Processing ${uploadedFile.name} with ${construct.name} construct`,
        custom_construct: construct
      });

      setJobData(jobResponse);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file to GCS
      await fetch(jobResponse.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/zip' },
        body: uploadedFile
      });

      // Mark upload complete
      await apiEndpoints.jobs.uploadComplete(jobResponse.id);

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast({
        title: "Upload successful!",
        description: "Your files are now being processed by our AI.",
      });

      // Wait a moment to show completion, then proceed
      setTimeout(() => {
        onUploadComplete(jobResponse);
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setJobData(null);
    setUploadProgress(0);
  };

  return (
    <div className="space-y-6">
      {/* Construct Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-blue-900">Using Construct: {construct?.name}</CardTitle>
          <CardDescription className="text-blue-700">
            {construct?.output_schema?.length || 0} output columns • {Object.keys(construct?.defaults || {}).length} default values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {construct?.output_schema?.slice(0, 5).map((column: string, index: number) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {column}
              </span>
            ))}
            {construct?.output_schema?.length > 5 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                +{construct.output_schema.length - 5} more
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card className="border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`text-center cursor-pointer transition-all duration-200 ${
              isDragActive ? 'scale-105' : ''
            }`}
          >
            <input {...getInputProps()} />
            
            {!uploadedFile ? (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-slate-900">
                    {isDragActive ? 'Drop your ZIP file here' : 'Upload Interview Transcripts'}
                  </h3>
                  <p className="text-slate-500 mt-2">
                    Drag and drop a ZIP file, or click to browse
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Supports TXT, DOCX, MD, and PDF files inside ZIP
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-slate-900">File Ready</h3>
                  <div className="flex items-center justify-center space-x-2 mt-2">
                    <File className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{uploadedFile.name}</span>
                    <span className="text-slate-400">
                      ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Uploading...</span>
                <span className="text-sm text-slate-500">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-slate-500 text-center">
                Please wait while we upload and process your files
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isUploading}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Structure
        </Button>

        <div className="flex space-x-3">
          {uploadedFile && (
            <Button
              variant="outline"
              onClick={removeFile}
              disabled={isUploading}
              className="flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              Remove File
            </Button>
          )}
          
          <Button
            onClick={handleUpload}
            disabled={!uploadedFile || isUploading}
            className="flex items-center space-x-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Start Processing
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Help Text */}
      <div className="text-center text-sm text-slate-500">
        <p>
          💡 <strong>Tip:</strong> Organize your interview files in a ZIP archive for faster processing. 
          We'll automatically detect and parse supported file formats.
        </p>
      </div>
    </div>
  );
}
