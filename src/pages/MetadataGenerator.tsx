
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { 
  Upload, 
  Download, 
  Loader2, 
  Image as ImageIcon, 
  Key as KeyIcon,
  ArrowLeft,
  FileCheck,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Star,
  Users,
  CheckCircle,
  HelpCircle,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import Papa from "papaparse";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface MetadataResult {
  fileName: string;
  title: string;
  description: string;
  keywords: string;
}

interface ImageReference {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  keywords: string[];
}

// New reference images from user uploads
const KEYWORD_EXAMPLES: ImageReference[] = [
  {
    id: 1,
    title: "Girl in Flower Field with Butterfly",
    description: "A beautiful young girl with long red hair stands in a vibrant field of wildflowers, gently holding a butterfly. The sunlit scene evokes a sense of peace and natural beauty.",
    imageUrl: "/lovable-uploads/efbaf0ec-bfd1-4475-b015-3f52c495b8ed.png",
    keywords: ["girl", "flower field", "wildflowers", "butterfly", "red hair", "summer", "spring", "nature", "child", "beautiful", "pretty", "outdoors", "sunlight", "sunshine", "landscape", "idyllic", "peaceful"]
  },
  {
    id: 2,
    title: "Family Picnic by the Creek",
    description: "A heartwarming image of a multigenerational family enjoying a delightful picnic lunch by a creek. The scene is filled with delicious food, laughter, and the beauty of nature.",
    imageUrl: "/lovable-uploads/77a0c942-d56d-4275-a274-340bae22f3ad.png",
    keywords: ["picnic", "family", "summer", "outdoor", "creek", "nature", "food", "lunch", "gathering", "multigenerational", "grandparents", "children", "parents", "happiness", "joy"]
  },
  {
    id: 3,
    title: "Tropical Fruit Abundance",
    description: "A vibrant display of fresh tropical fruits, including ripe mangoes, juicy papayas, pineapple, and exotic yellow fruits, bathed in sunlight on a rustic wooden table.",
    imageUrl: "/lovable-uploads/1a8d6ca9-56ef-4abb-b531-9ea5edfd2dfb.png",
    keywords: ["mangoes", "papayas", "pineapple", "tropical fruits", "exotic fruits", "yellow fruits", "fruit bowl", "wooden table", "sunlight", "summer", "healthy eating"]
  },
  {
    id: 4,
    title: "Old Farmer with Dog on Porch",
    description: "A heartwarming image of an elderly farmer sitting on his porch with his loyal dog, enjoying the peaceful mountain view. The scene evokes a sense of tranquility and connection with nature.",
    imageUrl: "/lovable-uploads/3d10f3cf-b927-46f0-a05a-fe0b27dbca7e.png",
    keywords: ["old farmer", "dog", "porch", "mountains", "countryside", "rural", "landscape", "senior", "man", "pet", "animal", "nature", "peaceful", "tranquility"]
  },
  {
    id: 5,
    title: "Adorable 5-Year-Old Boy Building Sandcastle",
    description: "A charming illustration of a cute five-year-old boy with chubby cheeks, wearing a straw hat and overalls, joyfully building a sandcastle at a playground. The vibrant scene includes a slide, blooming trees, and cheerful springtime colors.",
    imageUrl: "/lovable-uploads/19291550-78ea-4aca-8f69-fd20f36d1191.png",
    keywords: ["cute boy", "chubby cheeks", "five year old", "sandcastle", "playground", "illustration", "child", "kids", "toddler", "boy", "hat", "straw hat", "overalls"]
  }
];

const TESTIMONIALS = [
  {
    name: "Sarah Johnson",
    role: "Digital Marketing Specialist",
    rating: 5,
    comment: "This tool has completely transformed how I optimize images for SEO. The keyword suggestions are incredibly accurate and have improved our search rankings significantly."
  },
  {
    name: "Michael Chen",
    role: "E-commerce Shop Owner",
    rating: 4,
    comment: "Processing multiple images at once has saved me countless hours of work. The metadata generated helps my product images rank much better in search results."
  },
  {
    name: "Jessica Williams",
    role: "Content Creator",
    rating: 5,
    comment: "The keyword limit selection is perfect for my needs. I can customize how detailed I want the metadata to be based on the platform I'm posting to."
  }
];

const FAQ_ITEMS = [
  {
    question: "What is image metadata and why is it important?",
    answer: "Image metadata includes information like titles, descriptions, and keywords that help search engines understand what your images contain. Good metadata improves SEO, makes your images more discoverable, and provides context for users with visual impairments."
  },
  {
    question: "How many images can I process at once?",
    answer: "You can select and process multiple images at once. However, due to the Gemini API's rate limit of 15 requests per minute, we process images sequentially with a 5-second delay between each image to avoid hitting these limits."
  },
  {
    question: "Is my data secure when using this tool?",
    answer: "Yes, your images are processed locally in your browser and then sent securely to the Gemini API. We don't store your images or the generated metadata on our servers. Your API key is stored only in your browser's local storage."
  },
  {
    question: "How accurate is the generated metadata?",
    answer: "The metadata is generated using Google's advanced Gemini AI model, which provides high-quality, contextually relevant descriptions and keywords. For most images, the accuracy is excellent, but you can always edit the results if needed."
  },
  {
    question: "Do I need to pay for using this tool?",
    answer: "The tool itself is free to use, but you need a Google Gemini API key. Google offers free credits when you sign up for a Gemini API key, which is typically sufficient for processing hundreds of images."
  }
];

const MetadataGenerator = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [results, setResults] = useState<MetadataResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [keywordLimit, setKeywordLimit] = useState(30);
  const [currentReferenceIndex, setCurrentReferenceIndex] = useState(0);
  const [saveApiKey, setSaveApiKey] = useState(true);
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

  // Auto-rotate through reference images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentReferenceIndex((prevIndex) => 
        prevIndex === KEYWORD_EXAMPLES.length - 1 ? 0 : prevIndex + 1
      );
    }, 10000); // Change every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

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

    // Save API key if option is enabled
    if (saveApiKey) {
      localStorage.setItem("geminiApiKey", apiKey);
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
                3. "keywords": A comma-separated list of relevant keywords (exactly ${keywordLimit} keywords)
                
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
  };

  const renderKeywordBadges = (keywordsString: string) => {
    return keywordsString.split(",").map((keyword, index) => (
      <span 
        key={index}
        className="inline-block px-3 py-1 m-1 rounded-full bg-blue-500 text-white text-xs font-medium"
      >
        {keyword.trim()}
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-[#0C0C0C] text-[#FDFAF6]">
      <div className="max-w-6xl mx-auto p-4 space-y-8 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-64 h-64 -left-32 -top-32 bg-[#E9762B] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute w-64 h-64 -right-32 -top-32 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute w-64 h-64 -left-32 -bottom-32 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="flex justify-between items-center pt-4">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[#FDFAF6] border-[#FDFAF6] hover:bg-[#FDFAF6]/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <ThemeToggle />
        </div>

        <div className="text-center space-y-6 py-8 relative">
          <h1 className="text-5xl md:text-6xl font-bold text-[#EC5228]">
            Metadata Generator
          </h1>
          <p className="text-xl max-w-2xl mx-auto leading-relaxed text-[#FAF1E6]">
            PixCraftai Provides You, Unlimited Image process at Realtime With SEO title, Rankable tags And Keyword Booster.✨
          </p>
        </div>

        <div className="space-y-8 backdrop-blur-lg bg-[#0C0C0C]/90 p-8 rounded-2xl border border-[#E9762B]/30 shadow-xl">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-6">
            <div className="p-6 border border-dashed border-[#FDFAF6]/50 rounded-xl bg-[#0C0C0C]/50 text-center cursor-pointer hover:bg-[#0C0C0C]/70 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                multiple
                ref={fileInputRef}
                className="hidden"
                disabled={isLoading}
              />
              <div className="flex flex-col items-center justify-center gap-3 py-6">
                <Upload className="w-12 h-12 text-[#FDFAF6]" />
                <p className="text-xl font-medium text-[#FDFAF6]">
                  {selectedFiles.length > 0 
                    ? `${selectedFiles.length} image${selectedFiles.length !== 1 ? 's' : ''} selected` 
                    : "Click to upload images (multiple allowed)"}
                </p>
                <p className="text-sm text-[#FDFAF6]/80">
                  JPG, PNG or GIF (max 10MB each)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="keywordSlider" className="block text-lg font-medium mb-2 text-[#FDFAF6]">
                  Keyword Limit: {keywordLimit}
                </label>
                <div className="px-2">
                  <Slider
                    id="keywordSlider"
                    min={1}
                    max={50}
                    step={1}
                    value={[keywordLimit]}
                    onValueChange={(values) => setKeywordLimit(values[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-1 text-xs text-[#FDFAF6]/70">
                    <span>1</span>
                    <span>25</span>
                    <span>50</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <KeyIcon className="w-5 h-5 text-[#FDFAF6]" />
                  <Input
                    type="password"
                    placeholder="Enter your Gemini API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={isLoading}
                    className="flex-1 h-12 text-lg backdrop-blur-sm bg-[#0C0C0C]/80 border-2 border-[#FDFAF6]/30 focus:border-[#FDFAF6] text-white placeholder:text-[#FDFAF6]/50"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="saveApiKey"
                      checked={saveApiKey}
                      onChange={(e) => setSaveApiKey(e.target.checked)}
                      className="w-4 h-4 accent-[#FDFAF6]"
                    />
                    <label htmlFor="saveApiKey" className="text-sm text-[#FDFAF6]/80 flex items-center gap-1">
                      <Save className="w-4 h-4" /> Save API key for future use
                    </label>
                  </div>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:underline"
                  >
                    Get a free Gemini API key
                  </a>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={generateMetadata} 
                disabled={isLoading || selectedFiles.length === 0 || !apiKey}
                className="w-full sm:w-auto h-12 px-8 bg-[#FFA725] hover:bg-[#FFA725]/90 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                <div className="flex justify-between text-sm text-[#FDFAF6]/80">
                  <span>Processing image {currentFileIndex + 1} of {selectedFiles.length}</span>
                  <span>{progress}%</span>
                </div>
                <Progress 
                  value={progress} 
                  className="h-2 bg-[#1A1A1A] dark:bg-[#1A1A1A]"
                />
                <p className="text-sm text-center text-[#FDFAF6]/80 animate-pulse">
                  {isLoading ? `Analyzing image and generating metadata...` : ''}
                </p>
              </div>
            )}
          </div>

          {imagePreview && (
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/2">
                <h3 className="text-xl font-semibold mb-3 text-[#FDFAF6]">Image Preview</h3>
                <div className="relative group overflow-hidden rounded-lg">
                  <img
                    src={imagePreview}
                    alt="Selected image preview"
                    className="w-full h-auto rounded-lg object-cover"
                  />
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-sm text-[#FDFAF6]/80">
                      {selectedFiles.length > 1 ? (
                        `${currentFileIndex + 1} of ${selectedFiles.length} images`
                      ) : (
                        selectedFiles[0].name
                      )}
                    </span>
                    {selectedFiles.length > 1 && (
                      <div className="flex items-center gap-1">
                        <FileCheck className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-[#FDFAF6]/80">
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
                    <h3 className="text-xl font-semibold text-[#FDFAF6]">Generated Metadata</h3>
                    <Button 
                      onClick={downloadCSV}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-[#FDFAF6] border-[#FDFAF6] hover:bg-[#FDFAF6]/10"
                    >
                      <Download className="w-4 h-4" />
                      Download CSV
                    </Button>
                  </div>
                  <div className="bg-[#0C0C0C]/70 backdrop-blur-md rounded-lg p-4 shadow-lg space-y-4 max-h-[500px] overflow-y-auto">
                    {results.map((result, index) => (
                      <div key={index} className="space-y-2 border-b border-[#FDFAF6]/20 pb-3 mb-3 last:border-0 last:mb-0 last:pb-0">
                        <div>
                          <span className="text-sm font-semibold text-[#FDFAF6]/70">Filename:</span>
                          <p className="text-white">{result.fileName}</p>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-[#FDFAF6]/70">Title:</span>
                          <p className="text-white">{result.title}</p>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-[#FDFAF6]/70">Description:</span>
                          <p className="text-white">{result.description}</p>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-[#FDFAF6]/70">Keywords:</span>
                          <div className="mt-2 flex flex-wrap">
                            {renderKeywordBadges(result.keywords)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Example Image Reference Section */}
        <div className="overflow-hidden bg-[#0C0C0C]/80 backdrop-blur-lg rounded-2xl border border-[#FDFAF6]/30 shadow-xl">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-center text-[#FDFAF6]">Example Keywords</h2>
            
            <div className="relative">
              {KEYWORD_EXAMPLES.map((example, index) => (
                <div 
                  key={example.id}
                  className={`transition-all duration-1000 ${
                    index === currentReferenceIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 absolute top-0 left-0 right-0'
                  }`}
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/2 relative group overflow-hidden rounded-lg">
                      <img 
                        src={example.imageUrl} 
                        alt={example.title} 
                        className="w-full h-auto rounded-lg object-cover"
                      />
                    </div>
                    <div className="md:w-1/2">
                      <h3 className="text-xl font-bold mb-2 text-[#FDFAF6]">{example.title}</h3>
                      <p className="text-white mb-4">{example.description}</p>
                      <div className="flex flex-wrap">
                        {example.keywords.map((keyword, idx) => (
                          <span 
                            key={idx}
                            className="inline-block px-3 py-1 m-1 rounded-full bg-blue-500 text-white text-xs font-medium"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center mt-6 space-x-2">
              {KEYWORD_EXAMPLES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentReferenceIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentReferenceIndex ? 'bg-[#FDFAF6]' : 'bg-[#FDFAF6]/30'
                  }`}
                  aria-label={`View example ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="p-6 bg-[#0C0C0C]/80 backdrop-blur-sm rounded-xl border border-[#FDFAF6]/30 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-[#FDFAF6]">How It Works</h3>
          <ol className="space-y-4 list-decimal list-inside text-[#FDFAF6]">
            <li className="flex items-start">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FFA725] text-white font-bold text-xs mr-2 mt-0.5">1</span>
              <span>Upload one or multiple images you want to generate metadata for</span>
            </li>
            <li className="flex items-start">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FFA725] text-white font-bold text-xs mr-2 mt-0.5">2</span>
              <span>Set your desired keyword limit (1-50 keywords)</span>
            </li>
            <li className="flex items-start">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FFA725] text-white font-bold text-xs mr-2 mt-0.5">3</span>
              <span>Enter your Gemini API key (get a free key from Google AI Studio)</span>
            </li>
            <li className="flex items-start">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FFA725] text-white font-bold text-xs mr-2 mt-0.5">4</span>
              <span>Click "Generate Metadata" and wait as each image is processed</span>
            </li>
            <li className="flex items-start">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FFA725] text-white font-bold text-xs mr-2 mt-0.5">5</span>
              <span>Download your metadata as a CSV file or copy individual results</span>
            </li>
          </ol>
        </div>

        {/* Testimonials Section */}
        <div className="p-8 bg-[#0C0C0C]/80 backdrop-blur-lg rounded-xl border border-[#FDFAF6]/30 shadow-lg">
          <h3 className="text-2xl font-semibold mb-6 text-center text-[#FDFAF6]">What Users Are Saying</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, index) => (
              <div key={index} className="bg-[#111111] p-6 rounded-lg shadow-lg border border-[#FDFAF6]/10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-[#FDFAF6]">{testimonial.name}</h4>
                    <p className="text-sm text-[#FDFAF6]/70">{testimonial.role}</p>
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[#FDFAF6]/90 italic">"{testimonial.comment}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="p-8 bg-[#0C0C0C]/80 backdrop-blur-lg rounded-xl border border-[#FDFAF6]/30 shadow-lg">
          <h3 className="text-2xl font-semibold mb-6 text-center text-[#FDFAF6]">Frequently Asked Questions</h3>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-[#111111] rounded-lg overflow-hidden border border-[#FDFAF6]/10"
              >
                <AccordionTrigger className="px-6 py-4 text-left text-[#FDFAF6] hover:no-underline hover:bg-[#222222]">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="min-w-5 h-5 text-[#FFA725]" />
                    <span>{item.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 pt-2 text-[#FDFAF6]/90">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Footer */}
        <div className="border-t border-[#FDFAF6]/20 pt-6 text-center">
          <p className="text-[#FDFAF6]/70 text-sm">
            © 2024 PixCraftai Metadata Generator. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MetadataGenerator;
