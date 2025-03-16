
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
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import Papa from "papaparse";

interface MetadataResult {
  fileName: string;
  title: string;
  description: string;
  keywords: string;
}

const MetadataGenerator = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [results, setResults] = useState<MetadataResult[]>([]);
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
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if file is an image
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: "Please select an image file (JPEG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Create and set preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateMetadata = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an image file first",
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
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 90));
    }, 300);

    try {
      // Convert image to base64
      const imageBase64 = await fileToBase64(selectedFile);
      const base64Data = imageBase64.split(",")[1]; // Remove data URL prefix

      // Prepare the request payload for Gemini
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`;
      
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

      console.log("Sending request to Gemini API...");
      
      const response = await fetch(apiUrl, {
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

      const data = await response.json();
      console.log("Gemini API response:", data);

      // Extract the text from the Gemini response
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!responseText) {
        throw new Error("Empty or invalid response from Gemini API");
      }

      console.log("Raw text from Gemini:", responseText);

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
        fileName: selectedFile.name,
        title: extractedJson.title || "No title generated",
        description: extractedJson.description || "No description generated",
        keywords: extractedJson.keywords || "No keywords generated"
      };

      // Add to results
      setResults(prev => [...prev, newResult]);

      toast({
        title: "Success",
        description: "Metadata generated successfully!",
      });
    } catch (error: any) {
      console.error("Error generating metadata:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate metadata. Please try again.",
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
          <div className="space-y-4">
            <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
                disabled={isLoading}
              />
              <div className="flex flex-col items-center justify-center gap-2 py-4">
                <Upload className="w-10 h-10 text-gray-400" />
                <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  {selectedFile ? selectedFile.name : "Click to upload an image"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  JPG, PNG or GIF (max 10MB)
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
                disabled={isLoading || !selectedFile || !apiKey}
                className="w-full sm:w-auto h-12 px-6 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-5 w-5" />
                    Generate Metadata
                  </>
                )}
              </Button>
            </div>

            {isLoading && (
              <div className="space-y-3">
                <Progress 
                  value={progress} 
                  className="h-2 bg-gray-200 dark:bg-gray-700"
                />
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 animate-pulse">
                  Analyzing image and generating metadata... {progress}%
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
                  <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-lg p-4 shadow-lg space-y-4">
                    {results.map((result, index) => (
                      <div key={index} className="space-y-2">
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
            <li>Upload an image you want to generate metadata for</li>
            <li>Enter your Gemini API key (get a free key from Google AI Studio)</li>
            <li>Click "Generate Metadata" and wait a few seconds</li>
            <li>Review the AI-generated title, description, and keywords</li>
            <li>Download the results as a CSV file for easy use</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default MetadataGenerator;
