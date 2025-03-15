
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, FileText, Download } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/ThemeToggle";

interface MetadataResult {
  filename: string;
  title: string;
  description: string;
  keywords: string[];
}

const MetadataGenerator = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [results, setResults] = useState<MetadataResult | null>(null);
  const [saveApiKey, setSaveApiKey] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.includes("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPEG, PNG)",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an image file first",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey || apiKey.trim() === "") {
      toast({
        title: "API Key required",
        description: "Please enter your Gemini API key",
        variant: "destructive",
      });
      return;
    }

    // Save API key to localStorage if option is checked
    if (saveApiKey) {
      localStorage.setItem("gemini_api_key", apiKey);
    }

    setIsLoading(true);
    setResults(null);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64Image = reader.result?.toString().split(",")[1]; // Remove data URL prefix
        
        if (!base64Image) {
          throw new Error("Failed to convert image to base64");
        }
        
        const response = await fetch(`${window.location.origin}/api/generate-metadata`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: base64Image,
            apiKey: apiKey,
            filename: file.name
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate metadata");
        }

        const data = await response.json();
        
        setResults(data);
        toast({
          title: "Success!",
          description: "Metadata generated successfully",
        });
      };
    } catch (error) {
      console.error("Error generating metadata:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate metadata",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!results) return;
    
    const csvContent = [
      ["Filename", "Title", "Description", "Keywords"].join(","),
      [
        `"${results.filename}"`,
        `"${results.title}"`,
        `"${results.description}"`,
        `"${results.keywords.join(", ")}"`,
      ].join(","),
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${results.filename.split(".")[0]}_metadata.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Check for saved API key on component mount
  useState(() => {
    const savedApiKey = localStorage.getItem("gemini_api_key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setSaveApiKey(true);
    }
  });

  return (
    <div className="container py-8 px-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
          Image Metadata Generator
        </h1>
        <ThemeToggle />
      </div>
      
      <Card className="glass-effect hover-card mb-8">
        <CardHeader>
          <CardTitle>Extract Metadata from Your Images</CardTitle>
          <CardDescription>
            Upload an image and get AI-generated title, description, and keywords for your content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="result" disabled={!results}>Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-6">
              <div className="grid gap-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">Gemini API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your Gemini API key"
                    value={apiKey}
                    onChange={handleApiKeyChange}
                  />
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch 
                      id="save-api-key" 
                      checked={saveApiKey} 
                      onCheckedChange={setSaveApiKey} 
                    />
                    <Label htmlFor="save-api-key">Save API key for future sessions</Label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="image">Upload Image</Label>
                  <div 
                    className="border-2 border-dashed rounded-xl border-gray-300 dark:border-gray-600 p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/png, image/jpeg"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    
                    {preview ? (
                      <div className="w-full flex flex-col items-center">
                        <img 
                          src={preview} 
                          alt="Preview" 
                          className="max-h-64 max-w-full rounded-lg shadow-md object-contain mb-4 animate-fade-in" 
                        />
                        <p className="text-sm font-medium">{file?.name}</p>
                        <p className="text-xs text-gray-500">Click to change</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="p-4 bg-muted rounded-full mb-4">
                          <Upload size={24} className="text-primary" />
                        </div>
                        <p className="font-medium mb-1">Upload an image</p>
                        <p className="text-sm text-muted-foreground">PNG or JPG (max 5MB)</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  className="sparkle-button"
                  onClick={handleSubmit} 
                  disabled={isLoading || !file || !apiKey}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Generate Metadata
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="result" className="space-y-6">
              {results && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid md:grid-cols-5 gap-6">
                    <div className="md:col-span-2">
                      {preview && (
                        <div className="relative overflow-hidden rounded-lg shadow-lg mb-4">
                          <img 
                            src={preview} 
                            alt="Preview" 
                            className="w-full object-contain max-h-80" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-50"></div>
                        </div>
                      )}
                      <div className="text-sm font-medium">
                        <span className="text-muted-foreground">Filename:</span> {results.filename}
                      </div>
                    </div>
                    
                    <div className="md:col-span-3 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" value={results.title} readOnly />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea 
                          id="description" 
                          value={results.description} 
                          readOnly 
                          className="resize-none min-h-[100px]"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="keywords">Keywords</Label>
                        <div className="flex flex-wrap gap-2">
                          {results.keywords.map((keyword, index) => (
                            <div 
                              key={index}
                              className="px-3 py-1 rounded-full bg-primary/10 text-sm font-medium"
                            >
                              {keyword}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Button onClick={downloadCSV} className="w-full mt-4">
                        <Download className="h-4 w-4 mr-2" />
                        Download CSV
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-3 text-sm">
            <li>Upload your JPG or PNG image to our secure service</li>
            <li>Provide your Gemini API key (your key is used only for your request)</li>
            <li>Our AI analyzes your image and generates meaningful metadata</li>
            <li>Download the results as a CSV for easy import into your asset management system</li>
          </ol>
          <div className="mt-6 bg-muted p-4 rounded-lg text-sm">
            <p className="font-medium">🔒 Privacy Note:</p>
            <p>Your images and API key remain private. Processing happens securely and no data is stored on our servers.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetadataGenerator;
