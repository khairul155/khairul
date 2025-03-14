
import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, Upload, Info, Eye, EyeOff, Download, Copy, Sparkles, Settings, Save, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { Progress } from '@/components/ui/progress';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserMenu } from '@/components/UserMenu';
import { supabase } from '@/integrations/supabase/client';

interface ImageFile extends File {
  preview: string;
  id: string;
  processing?: boolean;
  error?: string;
  metadata?: ImageMetadata;
}

interface ImageMetadata {
  filename: string;
  title: string;
  description: string;
  keywords: string[];
}

const MetadataGenerator: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [savedApiKey, setSavedApiKey] = useState(false);
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [maxKeywords, setMaxKeywords] = useState<number>(10);
  const [processingBatch, setProcessingBatch] = useState(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(-1);
  const [downloadFormat, setDownloadFormat] = useState<'csv' | 'json'>('csv');
  const { toast } = useToast();
  const { session } = useAuth();
  const apiKeyRef = useRef<HTMLInputElement>(null);

  // Save API key to localStorage
  const saveApiKey = () => {
    if (apiKey) {
      localStorage.setItem('gemini-api-key', apiKey);
      setSavedApiKey(true);
      toast({
        title: "API Key Saved",
        description: "Your Gemini API key has been securely saved in your browser",
      });
    }
  };

  // Load API key from localStorage on component mount
  React.useEffect(() => {
    const savedKey = localStorage.getItem('gemini-api-key');
    if (savedKey) {
      setApiKey(savedKey);
      setSavedApiKey(true);
    }
  }, []);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => 
      Object.assign(file, {
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substring(2),
      })
    ) as ImageFile[];
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 10485760, // 10MB
    maxFiles: 10,
  });

  // Process a single image
  const processImage = async (file: ImageFile) => {
    try {
      // Convert the image to base64
      return new Promise<ImageMetadata>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const base64 = event.target?.result as string;
            
            // Call the Supabase edge function
            const { data, error } = await supabase.functions.invoke('generate-metadata', {
              body: {
                image: base64,
                apiKey: apiKey,
                maxKeywords,
                originalname: file.name
              }
            });

            console.log("Function call response:", data, error);

            if (error) {
              throw new Error(error.message || 'Error calling Gemini API');
            }

            if (data.error) {
              throw new Error(data.error);
            }

            resolve(data as ImageMetadata);
          } catch (error) {
            console.error("Error in processing:", error);
            reject(error);
          }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
      throw error;
    }
  };

  // Process all images
  const processAllImages = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key first",
        variant: "destructive",
      });
      if (apiKeyRef.current) {
        apiKeyRef.current.focus();
      }
      return;
    }

    setProcessingBatch(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Skip already processed files
      if (file.metadata) continue;
      
      setCurrentProcessingIndex(i);
      
      // Update file status to processing
      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, processing: true, error: undefined } : f
      ));
      
      try {
        const metadata = await processImage(file);
        
        // Update file with metadata
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, processing: false, metadata } : f
        ));
        
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        
        // Mark file as failed
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, processing: false, error: error instanceof Error ? error.message : 'Unknown error' } : f
        ));
        
        toast({
          title: "Processing Error",
          description: `Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
    }
    
    setCurrentProcessingIndex(-1);
    setProcessingBatch(false);
    
    toast({
      title: "Processing Complete",
      description: "All images have been processed",
    });
  };

  // Remove a file
  const removeFile = (id: string) => {
    setFiles(prev => {
      const newFiles = prev.filter(file => file.id !== id);
      // Revoke object URL to avoid memory leaks
      const fileToRemove = prev.find(file => file.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return newFiles;
    });
  };

  // Clear all files
  const clearAllFiles = () => {
    files.forEach(file => {
      URL.revokeObjectURL(file.preview);
    });
    setFiles([]);
  };

  // Download all metadata
  const downloadMetadata = () => {
    const processedFiles = files.filter(file => file.metadata);
    
    if (processedFiles.length === 0) {
      toast({
        title: "No Data to Download",
        description: "Process some images first to get metadata",
        variant: "destructive",
      });
      return;
    }
    
    let content: string;
    let fileExtension: string;
    let mimeType: string;
    
    if (downloadFormat === 'csv') {
      // Generate CSV
      const headers = "Filename,Title,Description,Keywords\n";
      const rows = processedFiles.map(file => {
        const metadata = file.metadata!;
        return `"${metadata.filename.replace(/"/g, '""')}","${metadata.title.replace(/"/g, '""')}","${metadata.description.replace(/"/g, '""')}","${metadata.keywords.join(', ').replace(/"/g, '""')}"`;
      }).join('\n');
      
      content = headers + rows;
      fileExtension = 'csv';
      mimeType = 'text/csv';
    } else {
      // Generate JSON
      const data = processedFiles.map(file => file.metadata);
      content = JSON.stringify(data, null, 2);
      fileExtension = 'json';
      mimeType = 'application/json';
    }
    
    // Create download link
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `image-metadata.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: `Your metadata has been downloaded as a ${fileExtension.toUpperCase()} file`,
    });
  };

  // Copy metadata to clipboard
  const copyMetadata = (metadata: ImageMetadata) => {
    const text = `Filename: ${metadata.filename}\nTitle: ${metadata.title}\nDescription: ${metadata.description}\nKeywords: ${metadata.keywords.join(', ')}`;
    navigator.clipboard.writeText(text);
    
    toast({
      title: "Copied to Clipboard",
      description: "Image metadata has been copied to your clipboard",
    });
  };

  // Calculate overall progress
  const overallProgress = files.length > 0
    ? (files.filter(file => file.metadata || file.error).length / files.length) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-4 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center pt-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-blue-500" />
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
              Photo Metadata Helper
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <UserMenu />
            <ThemeToggle />
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* API Key Section */}
          <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 shadow-xl">
            <CardHeader className="space-y-1">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 w-8 h-8 rounded-full flex items-center justify-center mr-2">01</span>
                  Enter your Gemini API Key
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}>
                  <Info className="h-5 w-5" />
                </Button>
              </div>
              <CardDescription>
                Your API key is stored locally in your browser and never sent to our servers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Input
                    ref={apiKeyRef}
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setSavedApiKey(false);
                    }}
                    placeholder="Enter your Gemini API key"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showApiKey ? (
                      <EyeOff className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
                <Button onClick={saveApiKey} disabled={!apiKey || savedApiKey}>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
              <div className="mt-4 text-sm flex items-center text-gray-600 dark:text-gray-400">
                <span>Generate your </span>
                <span className="font-semibold mx-1">FREE API key</span>
                <span>from</span>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-blue-600 dark:text-blue-400 font-medium mx-1"
                  onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
                >
                  Google Gemini AI
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Keyword Options */}
          <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
                Keyword Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Number of keywords to generate (max):</label>
                    <span className="text-sm font-bold">{maxKeywords}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs">1</span>
                    <Slider
                      value={[maxKeywords]}
                      min={1}
                      max={50}
                      step={1}
                      onValueChange={(vals) => setMaxKeywords(vals[0])}
                      className="flex-1"
                    />
                    <span className="text-xs">50</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Section */}
          <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl flex items-center">
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 w-8 h-8 rounded-full flex items-center justify-center mr-2">02</span>
                Upload Images and Process
              </CardTitle>
              <CardDescription>
                Upload JPG/PNG images to generate metadata (max 10MB each)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragActive 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'}`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Upload className="h-10 w-10 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">
                      Drag and drop up to 10 images here
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      or click to upload (JPEG/PNG up to 10MB each)
                    </p>
                  </div>
                </div>
              </div>

              {files.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Uploaded Images ({files.length})</h3>
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={clearAllFiles} disabled={processingBatch}>
                        Clear All
                      </Button>
                      <Button 
                        onClick={processAllImages} 
                        disabled={processingBatch || !apiKey || files.length === 0}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      >
                        {processingBatch ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate Metadata
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {(processingBatch || overallProgress > 0) && (
                    <div className="space-y-1">
                      <Progress value={overallProgress} className="h-2" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                        {files.filter(file => file.metadata || file.error).length} of {files.length} processed
                      </p>
                    </div>
                  )}

                  {/* Image grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((file, index) => (
                      <Card key={file.id} className="overflow-hidden bg-white dark:bg-gray-800 relative group">
                        {/* Processing overlay */}
                        {file.processing && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                            <div className="text-center">
                              <Loader2 className="h-8 w-8 animate-spin text-white mx-auto" />
                              <p className="text-white mt-2">Processing...</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Error overlay */}
                        {file.error && (
                          <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center z-10">
                            <div className="text-center p-4">
                              <p className="text-white font-medium">Error</p>
                              <p className="text-red-200 text-sm mt-1">{file.error}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Image */}
                        <div className="aspect-square relative">
                          <img
                            src={file.preview}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            onLoad={() => { URL.revokeObjectURL(file.preview) }}
                          />
                          
                          {/* Success badge */}
                          {file.metadata && (
                            <Badge className="absolute top-2 right-2 bg-green-500">
                              Processed
                            </Badge>
                          )}
                          
                          {/* File controls */}
                          <div className="absolute top-2 left-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 w-7 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeFile(file.id)}
                              disabled={file.processing}
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                        
                        {/* Image info */}
                        <div className="p-3">
                          <p className="font-medium text-sm truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        
                        {/* Metadata if available */}
                        {file.metadata && (
                          <div className="p-3 pt-0">
                            <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Title:</p>
                              <p className="text-sm mb-1">{file.metadata.title}</p>
                              
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Description:</p>
                              <p className="text-sm mb-1 line-clamp-2">{file.metadata.description}</p>
                              
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Keywords:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {file.metadata.keywords.slice(0, 5).map((keyword, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                                {file.metadata.keywords.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{file.metadata.keywords.length - 5} more
                                  </Badge>
                                )}
                              </div>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyMetadata(file.metadata!)}
                                className="mt-2 h-8 text-xs w-full"
                              >
                                <Copy className="h-3 w-3 mr-1" /> Copy All Metadata
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Table */}
          {files.some(file => file.metadata) && (
            <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
              <CardHeader className="space-y-1">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl flex items-center">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 w-8 h-8 rounded-full flex items-center justify-center mr-2">03</span>
                    Metadata Results
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="flex border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                      <Button
                        variant={downloadFormat === 'csv' ? 'default' : 'outline'}
                        onClick={() => setDownloadFormat('csv')}
                        className="rounded-none text-xs h-8"
                      >
                        CSV
                      </Button>
                      <Button
                        variant={downloadFormat === 'json' ? 'default' : 'outline'}
                        onClick={() => setDownloadFormat('json')}
                        className="rounded-none text-xs h-8"
                      >
                        JSON
                      </Button>
                    </div>
                    <Button onClick={downloadMetadata} className="text-sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Image</TableHead>
                      <TableHead className="w-[180px]">Filename</TableHead>
                      <TableHead className="w-[250px]">Title</TableHead>
                      <TableHead className="w-[250px]">Description</TableHead>
                      <TableHead>Keywords</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files
                      .filter(file => file.metadata)
                      .map(file => (
                        <TableRow key={file.id}>
                          <TableCell>
                            <div className="w-16 h-16 rounded overflow-hidden">
                              <img 
                                src={file.preview} 
                                alt={file.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <p className="text-sm font-medium truncate max-w-[160px]" title={file.name}>
                              {file.name}
                            </p>
                          </TableCell>
                          <TableCell className="align-top">
                            <p className="text-sm">{file.metadata!.title}</p>
                          </TableCell>
                          <TableCell className="align-top">
                            <p className="text-sm">{file.metadata!.description}</p>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="flex flex-wrap gap-1">
                              {file.metadata!.keywords.map((keyword, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </div>

        {/* Footer */}
        <footer className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Photo Metadata Helper - An AI-powered tool for generating metadata from images
          </p>
          <div className="flex justify-center items-center mt-2 space-x-1">
            <span>Built with</span>
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span>by Khairul</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MetadataGenerator;
