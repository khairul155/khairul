
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Download, 
  Loader2, 
  Image as ImageIcon, 
  Key as KeyIcon,
  ArrowLeft,
  FileCheck,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import Papa from "papaparse";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface MetadataResult {
  fileName: string;
  title: string;
  description: string;
  keywords: string;
}

const MetadataGenerator = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [results, setResults] = useState<MetadataResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("geminiApiKey");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("geminiApiKey", apiKey);
    }
  }, [apiKey]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      
      // Filter to only include image files
      const imageFiles = filesArray.filter(file => file.type.startsWith("image/"));
      
      if (imageFiles.length === 0) {
        toast({
          title: "Invalid files",
          description: "Please select image files (JPEG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }
      
      if (imageFiles.length !== filesArray.length) {
        toast({
          title: "Some files ignored",
          description: `${filesArray.length - imageFiles.length} non-image files were ignored.`,
          variant: "default",
        });
      }
      
      setSelectedFiles(imageFiles);
      setError(null);
      
      // Create and set preview for the first image
      if (imageFiles.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(imageFiles[0]);
      }

      toast({
        title: "Files selected",
        description: `${imageFiles.length} image${imageFiles.length !== 1 ? 's' : ''} selected`,
      });
    }
  };

  const generateMetadata = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select image files first",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setError(null);
    setCurrentFileIndex(0);
    
    // Clear previous results if starting a new batch
    setResults([]);

    // Process files one by one
    await processNextFile(0);
  };

  const processNextFile = async (index: number) => {
    if (index >= selectedFiles.length) {
      // All files processed
      setIsLoading(false);
      setProgress(100);
      setTimeout(() => setProgress(0), 1000);
      toast({
        title: "Processing complete",
        description: `Processed ${selectedFiles.length} images successfully.`,
      });
      return;
    }

    setCurrentFileIndex(index);
    
    // Update progress based on how many files we've processed
    const progressValue = Math.floor((index / selectedFiles.length) * 100);
    setProgress(progressValue);
    
    // Update preview to current file
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFiles[index]);

    try {
      // Process current file
      await processFile(selectedFiles[index], index);
      
      // Wait for rate limiting (Gemini allows 15 RPM)
      // Wait 5 seconds between API calls to stay within rate limits
      if (index < selectedFiles.length - 1) {
        toast({
          title: "Rate limiting",
          description: `Waiting before processing next image to respect API limits...`,
        });
        
        setTimeout(() => {
          processNextFile(index + 1);
        }, 5000); // 5-second delay between images
      } else {
        // Last file processed
        setIsLoading(false);
        setProgress(100);
        setTimeout(() => setProgress(0), 1000);
      }
    } catch (error: any) {
      console.error(`Error processing file ${index + 1}:`, error);
      
      // Continue with next file after delay despite error
      toast({
        title: `Error with image ${index + 1}`,
        description: error.message || "Failed to generate metadata. Continuing with next image...",
        variant: "destructive",
      });
      
      setTimeout(() => {
        processNextFile(index + 1);
      }, 5000);
    }
  };

  const processFile = async (file: File, index: number) => {
    toast({
      title: "Processing image",
      description: `Processing ${index + 1} of ${selectedFiles.length}: ${file.name}`,
    });

    // Convert image to base64
    const imageBase64 = await fileToBase64(file);
    const base64Data = imageBase64.split(",")[1]; // Remove data URL prefix

    // Updated to use gemini-1.5-flash model instead of gemini-pro-vision
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Generate SEO metadata for this image with the filename "${file.name}". Provide the following in JSON format with these exact keys:
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
                mime_type: file.type,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096
      }
    };

    console.log(`Sending request to Gemini API for image ${index + 1}...`);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error response:", errorData);
      throw new Error(`Gemini API error: ${response.status} ${errorData?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log(`Gemini API response for image ${index + 1}:`, data);

    // Extract the text from the Gemini response
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error("Empty or invalid response from Gemini API");
    }

    console.log(`Raw text from Gemini for image ${index + 1}:`, responseText);

    // Parse the JSON from the response text
    let extractedJson;
    try {
      // Try to parse the response directly first
      extractedJson = JSON.parse(responseText);
    } catch (error) {
      console.log("Direct JSON parsing failed, attempting to extract JSON from text");
      
      // Try to find JSON within the text
      const jsonMatch = responseText.match(/{[\s\S]*?}/);
      if (jsonMatch) {
        extractedJson = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    }

    // Create a new result
    const newResult: MetadataResult = {
      fileName: file.name,
      title: extractedJson.title || "No title generated",
      description: extractedJson.description || "No description generated",
      keywords: extractedJson.keywords || "No keywords generated"
    };

    // Add to results
    setResults(prev => [...prev, newResult]);

    toast({
      title: "Success",
      description: `Metadata generated for image ${index + 1}: ${file.name}`,
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const downloadCSV = () => {
    if (results.length === 0) {
      toast({
        title: "No results",
        description: "Generate metadata first before downloading",
        variant: "destructive",
      });
      return;
    }

    const csv = Papa.unparse(results);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "image-metadata.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download started",
      description: "Your CSV file is being downloaded",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto p-4 space-y-8 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-64 h-64 -left-32 -top-32 bg-green-300 dark:bg-green-900 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute w-64 h-64 -right-32 -top-32 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute w-64 h-64 -left-32 -bottom-32 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="flex justify-between items-center pt-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <ThemeToggle />
        </div>

        <div className="text-center space-y-6 py-8 relative">
          <div className="relative inline-block animate-float">
            <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 opacity-20 animate-pulse"></div>
            <h1 className="text-5xl md:text-6xl font-bold relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400">
                Metadata Generator
              </span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Extract SEO-optimized metadata from your images using advanced AI technology.
            Generate titles, descriptions, and keywords for better search visibility.
          </p>
        </div>

        <div className="space-y-8 backdrop-blur-lg bg-white/30 dark:bg-gray-800/30 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                multiple  // Added multiple attribute
                ref={fileInputRef}
                className="hidden"
                disabled={isLoading}
              />
              <div className="flex flex-col items-center justify-center gap-2 py-4">
                <Upload className="w-10 h-10 text-gray-400" />
                <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  {selectedFiles.length > 0 
                    ? `${selectedFiles.length} image${selectedFiles.length !== 1 ? 's' : ''} selected` 
                    : "Click to upload images (multiple allowed)"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  JPG, PNG or GIF (max 10MB each)
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <KeyIcon className="w-5 h-5 text-gray-500" />
                <Input
                  type="password"
                  placeholder="Enter your Gemini API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 h-12 text-lg backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 transition-all duration-300"
                />
              </div>
              <div className="flex justify-end">
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Get a free Gemini API key
                </a>
              </div>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={generateMetadata} 
                disabled={isLoading || selectedFiles.length === 0 || !apiKey}
                className="w-full sm:w-auto h-12 px-6 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing {currentFileIndex + 1} of {selectedFiles.length}...
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-5 w-5" />
                    {selectedFiles.length > 1 ? "Generate Metadata for All Images" : "Generate Metadata"}
                  </>
                )}
              </Button>
            </div>

            {isLoading && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Processing image {currentFileIndex + 1} of {selectedFiles.length}</span>
                  <span>{progress}%</span>
                </div>
                <Progress 
                  value={progress} 
                  className="h-2 bg-gray-200 dark:bg-gray-700"
                />
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 animate-pulse">
                  {isLoading ? `Analyzing image and generating metadata...` : ''}
                </p>
              </div>
            )}
          </div>

          {imagePreview && (
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/2">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Image Preview</h3>
                <div className="relative group overflow-hidden rounded-lg">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Selected image preview"
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedFiles.length > 1 ? (
                        `${currentFileIndex + 1} of ${selectedFiles.length} images`
                      ) : (
                        selectedFiles[0].name
                      )}
                    </span>
                    {selectedFiles.length > 1 && (
                      <div className="flex items-center gap-1">
                        <FileCheck className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Multiple images selected
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {results.length > 0 && (
                <div className="md:w-1/2">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Generated Metadata</h3>
                    <Button 
                      onClick={downloadCSV}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download CSV
                    </Button>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-lg p-4 shadow-lg space-y-4 max-h-[500px] overflow-y-auto">
                    {results.map((result, index) => (
                      <div key={index} className="space-y-2 border-b border-gray-200 dark:border-gray-700 pb-3 mb-3 last:border-0 last:mb-0 last:pb-0">
                        <div>
                          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Filename:</span>
                          <p className="text-gray-800 dark:text-gray-200">{result.fileName}</p>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Title:</span>
                          <p className="text-gray-800 dark:text-gray-200">{result.title}</p>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Description:</span>
                          <p className="text-gray-800 dark:text-gray-200">{result.description}</p>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Keywords:</span>
                          <p className="text-gray-800 dark:text-gray-200">{result.keywords}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">How It Works</h3>
          <ol className="space-y-4 list-decimal list-inside text-gray-600 dark:text-gray-300">
            <li>Upload one or multiple images you want to generate metadata for</li>
            <li>Enter your Gemini API key (get a free key from Google AI Studio)</li>
            <li>Click "Generate Metadata" and wait as each image is processed</li>
            <li>Review the AI-generated title, description, and keywords for each image</li>
            <li>Download the results as a CSV file for easy use</li>
          </ol>
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Note: Gemini API has a rate limit of 15 requests per minute. When processing multiple images, 
                we automatically add a 5-second delay between each image to avoid hitting these limits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetadataGenerator;
