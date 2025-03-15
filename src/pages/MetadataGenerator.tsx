
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Upload, 
  FileText, 
  CheckCircle2, 
  X, 
  Download, 
  Copy,
  ImageIcon,
  ArrowLeft,
  Key
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Papa from 'papaparse';

const MetadataGenerator = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<{ fileName: string; title: string; description: string; keywords: string } | null>(null);
  const [results, setResults] = useState<Array<{ fileName: string; title: string; description: string; keywords: string }>>([]);
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load saved API key and results from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    } else {
      setShowApiKeyInput(true);
    }

    const savedResults = localStorage.getItem('metadata_results');
    if (savedResults) {
      try {
        setResults(JSON.parse(savedResults));
      } catch (error) {
        console.error("Error parsing saved results:", error);
      }
    }
  }, []);

  // Save results to localStorage whenever they change
  useEffect(() => {
    if (results.length > 0) {
      localStorage.setItem('metadata_results', JSON.stringify(results));
    }
  }, [results]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (!file.type.includes('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (jpg, png, etc.)",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Reset metadata
    setMetadata(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (!file.type.includes('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (jpg, png, etc.)",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Reset metadata
      setMetadata(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setMetadata(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('gemini_api_key', apiKey);
    setShowApiKeyInput(false);
    toast({
      title: "API Key Saved",
      description: "Your Gemini API key has been saved"
    });
  };

  const generateMetadata = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an image first",
        variant: "destructive"
      });
      return;
    }

    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key",
        variant: "destructive"
      });
      setShowApiKeyInput(true);
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setMetadata(null);
    
    // Start progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 500);

    try {
      // Convert the image to base64
      const base64String = await convertFileToBase64(selectedFile);
      
      console.log("Generating metadata for file:", selectedFile.name);
      
      // Prepare the request payload for Gemini
      const payload = {
        contents: [
          {
            parts: [
              {
                text: `Generate SEO metadata for this image with the filename "${selectedFile.name}". Provide the following in JSON format with these exact keys:
                  1. "title": A concise, SEO-friendly title
                  2. "description": A detailed description (2-3 sentences)
                  3. "keywords": A comma-separated list of relevant keywords (5-10 keywords)
                  
                  Return ONLY valid JSON without any other text, formatted like:
                  {
                    "title": "...",
                    "description": "...",
                    "keywords": "..."
                  }`
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64String
                }
              }
            ]
          }
        ]
      };

      // Call the Gemini API directly
      const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent";
      const apiUrlWithKey = `${apiUrl}?key=${apiKey}`;
      
      const response = await fetch(apiUrlWithKey, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error response:", errorText);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      // Parse API response
      const data = await response.json();
      console.log("Gemini API response:", JSON.stringify(data));

      // Extract the text from the Gemini response
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!responseText) {
        console.error("Empty or invalid response from Gemini API");
        throw new Error("Empty or invalid response from Gemini API");
      }

      console.log("Raw text from Gemini:", responseText);

      // Extract the JSON part from the response text (in case there's extra text)
      let extractedJson;
      try {
        // Try to parse the response directly first
        extractedJson = JSON.parse(responseText);
        console.log("Successfully parsed JSON directly");
      } catch (error) {
        console.log("Direct JSON parsing failed, attempting to extract JSON from text");
        
        // Try to find JSON within the text
        const jsonMatch = responseText.match(/{[\s\S]*?}/);
        if (jsonMatch) {
          try {
            extractedJson = JSON.parse(jsonMatch[0]);
            console.log("Successfully extracted and parsed JSON from text");
          } catch (extractError) {
            console.error("Failed to parse extracted JSON:", extractError);
            throw new Error("Failed to parse metadata from API response");
          }
        } else {
          console.error("No JSON found in response text");
          throw new Error("No metadata found in API response");
        }
      }

      // Validate the extracted JSON
      if (!extractedJson.title || !extractedJson.description || !extractedJson.keywords) {
        console.error("Missing required fields in extracted JSON:", JSON.stringify(extractedJson));
        throw new Error("Missing required metadata fields in API response");
      }

      // Prepare the final response
      const result = {
        fileName: selectedFile.name,
        title: extractedJson.title,
        description: extractedJson.description,
        keywords: extractedJson.keywords
      };

      // Set the metadata result
      setMetadata(result);
      
      // Add to results list
      setResults(prev => [result, ...prev]);
      
      toast({
        title: "Success",
        description: "Metadata generated successfully!",
      });
    } catch (error) {
      console.error("Error generating metadata:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate metadata. Please try again.",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setProgress(0);
        setIsLoading(false);
      }, 500);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error("Failed to convert file to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const downloadCsv = () => {
    if (results.length === 0) {
      toast({
        title: "No results",
        description: "Generate metadata for at least one image first",
        variant: "destructive"
      });
      return;
    }

    // Convert results to CSV
    const csv = Papa.unparse(results);
    
    // Create a blob and download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'image-metadata.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: "Your CSV file is being downloaded",
    });
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${type} copied to clipboard`,
    });
  };

  const clearResults = () => {
    setResults([]);
    localStorage.removeItem('metadata_results');
    toast({
      title: "Results Cleared",
      description: "All metadata results have been cleared",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto p-4 space-y-8 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-64 h-64 -left-32 -top-32 bg-green-300 dark:bg-green-900 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute w-64 h-64 -right-32 -top-32 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute w-64 h-64 -left-32 -bottom-32 bg-teal-300 dark:bg-teal-900 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="flex justify-between items-center pt-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="flex items-center gap-1 text-xs"
            >
              <Key className="h-3 w-3" />
              API Key
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {showApiKeyInput && (
          <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-800/70 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Gemini API Key</h3>
              <div className="flex gap-2">
                <Input 
                  type="text" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="flex-1"
                />
                <Button onClick={saveApiKey}>Save Key</Button>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Get your free API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">Google AI Studio</a>
              </div>
            </div>
          </div>
        )}

        <div className="text-center space-y-6 py-8 relative">
          <div className="relative inline-block animate-float">
            <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 opacity-20 animate-pulse"></div>
            <h1 className="text-5xl md:text-6xl font-bold relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400">
                Metadata Generator
              </span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Upload your image and get AI-generated metadata including title, description, and keywords.
            Perfect for SEO optimization and content management.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6 backdrop-blur-lg bg-white/30 dark:bg-gray-800/30 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl">
            <div 
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
                previewUrl ? 'border-green-400 bg-green-50/30 dark:bg-green-900/10' : 'border-gray-300 hover:border-gray-400 bg-gray-50/50 dark:bg-gray-800/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {previewUrl ? (
                <div className="relative w-full">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-[300px] mx-auto rounded-lg shadow-md"
                  />
                  <button 
                    onClick={removeFile}
                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4 flex flex-col items-center text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-medium">Drag and drop image here</p>
                    <p>or</p>
                    <label htmlFor="file-upload" className="cursor-pointer rounded-md bg-white/50 dark:bg-gray-700/50 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600">
                      Select file
                    </label>
                  </div>
                  <Input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    JPG, PNG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>

            <Button 
              onClick={generateMetadata} 
              disabled={isLoading || !selectedFile}
              className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Generate Metadata
                </>
              )}
            </Button>

            {isLoading && (
              <div className="space-y-3">
                <Progress 
                  value={progress} 
                  className="h-2 bg-gray-200 dark:bg-gray-700"
                />
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 animate-pulse">
                  Analyzing image... {progress}%
                </p>
              </div>
            )}
          </div>

          <div className="backdrop-blur-lg bg-white/30 dark:bg-gray-800/30 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Results</h2>
              <div className="flex gap-2">
                <Button 
                  onClick={downloadCsv}
                  variant="outline"
                  className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 text-xs"
                >
                  <Download className="w-3 h-3" />
                  CSV
                </Button>
                {results.length > 0 && (
                  <Button 
                    onClick={clearResults}
                    variant="outline"
                    className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 text-xs text-red-500 dark:text-red-400"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {metadata ? (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Title</h3>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="h-8 p-2"
                      onClick={() => copyToClipboard(metadata.title, 'Title')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-3 bg-white/70 dark:bg-gray-700/70 rounded-lg">
                    <p className="text-gray-800 dark:text-gray-200">{metadata.title}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="h-8 p-2"
                      onClick={() => copyToClipboard(metadata.description, 'Description')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-3 bg-white/70 dark:bg-gray-700/70 rounded-lg">
                    <p className="text-gray-800 dark:text-gray-200">{metadata.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Keywords</h3>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="h-8 p-2"
                      onClick={() => copyToClipboard(metadata.keywords, 'Keywords')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-3 bg-white/70 dark:bg-gray-700/70 rounded-lg">
                    <div className="flex flex-wrap gap-2">
                      {metadata.keywords.split(',').map((keyword, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 rounded-full text-xs font-medium"
                        >
                          {keyword.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-4">
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden md:table-cell">Keywords</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium truncate max-w-[100px]">
                            {result.fileName}
                          </TableCell>
                          <TableCell className="truncate max-w-[150px]">{result.title}</TableCell>
                          <TableCell className="hidden md:table-cell truncate max-w-[200px]">
                            {result.keywords}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center flex-col gap-4 text-gray-500 dark:text-gray-400">
                <FileText className="h-16 w-16 opacity-20" />
                <p>No metadata generated yet</p>
                <p className="text-sm">Upload an image and click "Generate Metadata"</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center space-y-4 pt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Powered by Google Gemini • Generate accurate metadata instantly
          </p>
          <div className="relative inline-block group">
            <div className="absolute inset-0 blur-xl bg-gradient-to-r from-green-400 via-teal-500 to-blue-600 opacity-75 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
            <h3 className="relative text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 animate-sparkle" />
              Created by Khairul
              <CheckCircle2 className="w-5 h-5 text-green-500 animate-sparkle" />
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetadataGenerator;
