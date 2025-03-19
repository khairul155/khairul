import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Crop,
  Scale as Scaling, // Replaced Resize with Scaling
  Square, // Replaced BorderAll with Square
  Wand2 as Auto,
  Palette,
  Droplets as Saturation,
  Sun as Brightness,
  Contrast,
  Sun as Exposure, // Replaced BrightnessUp with Sun
  Mountain as Highlights,
  CloudSun as Shadows,
  Aperture as Monochrome,
  Focus as Sharpen,
  Glasses as Clarity,
  Sparkles as Clamour,
  Flower, // Replaced FlowerPetal with Flower
  Waves as Smooth,
  CloudFog as Blur, // Using CloudFog for Blur
  CloudSnow as Grain, // Using CloudSnow for Grain
  List,
  Save,
  Upload,
  User,
  Gem,
  Trash2 as Clear,
  Download as Export,
  Eye,
  Loader,
  Plus,
  Minus,
  Check,
  Folder,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: "basic" | "temperature" | "sharpening";
}

const BulkImageSizeIncreaser = () => {
  const { toast } = useToast();
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("basic");

  const tasks: Task[] = [
    { id: "crop", name: "Crop", icon: <Crop />, category: "basic" },
    { id: "resize", name: "Resize", icon: <Scaling />, category: "basic" },
    { id: "border", name: "Border", icon: <Square />, category: "basic" },
    { id: "auto", name: "Auto-adjust", icon: <Auto />, category: "basic" },
    { id: "vibrance", name: "Vibrance", icon: <Palette />, category: "basic" },
    { id: "saturation", name: "Saturation", icon: <Saturation />, category: "basic" },
    { id: "brightness", name: "Brightness", icon: <Brightness />, category: "basic" },
    
    { id: "tint", name: "Tint", icon: <Palette />, category: "temperature" },
    { id: "contrast", name: "Contrast", icon: <Contrast />, category: "temperature" },
    { id: "exposure", name: "Exposure", icon: <Exposure />, category: "temperature" },
    { id: "highlights", name: "Highlights", icon: <Highlights />, category: "temperature" },
    { id: "shadows", name: "Shadows", icon: <Shadows />, category: "temperature" },
    { id: "monochrome", name: "Monochrome", icon: <Monochrome />, category: "temperature" },
    
    { id: "sharpen", name: "Sharpen", icon: <Sharpen />, category: "sharpening" },
    { id: "clarity", name: "Clarity", icon: <Clarity />, category: "sharpening" },
    { id: "clamour", name: "Clamour", icon: <Clamour />, category: "sharpening" },
    { id: "bloom", name: "Bloom", icon: <Flower />, category: "sharpening" },
    { id: "smooth", name: "Smooth", icon: <Smooth />, category: "sharpening" },
    { id: "blur", name: "Blur", icon: <CloudFog />, category: "sharpening" },
    { id: "grain", name: "Grain", icon: <CloudSnow />, category: "sharpening" },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      if (fileArray.length > 100) {
        toast({
          title: "File limit exceeded",
          description: "Free users can only process up to 100 files at once. Upgrade to premium for more.",
          variant: "destructive",
        });
        return;
      }
      setUploadedFiles(fileArray);
      toast({
        title: "Files added",
        description: `${fileArray.length} file(s) added for processing`,
      });
    }
  };

  const toggleTask = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId) 
        : [...prev, taskId]
    );
  };

  const handleClear = () => {
    setSelectedTasks([]);
    setUploadedFiles([]);
    setProgress(0);
    toast({
      title: "Batch cleared",
      description: "All tasks and uploaded files have been cleared",
    });
  };

  const handleExport = () => {
    if (selectedTasks.length === 0) {
      toast({
        title: "No tasks selected",
        description: "Please select at least one editing task",
        variant: "destructive",
      });
      return;
    }

    if (uploadedFiles.length === 0) {
      toast({
        title: "No files uploaded",
        description: "Please upload at least one image to process",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    
    // Simulate processing
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        setProcessing(false);
        toast({
          title: "Processing complete",
          description: `Successfully processed ${uploadedFiles.length} images with ${selectedTasks.length} tasks`,
        });
      }
    }, 200);
  };

  const handleSaveMacro = () => {
    if (selectedTasks.length === 0) {
      toast({
        title: "No tasks selected",
        description: "Please select at least one task to save as a macro",
        variant: "destructive",
      });
      return;
    }

    // In a real implementation, this would save to a database
    toast({
      title: "Macro saved",
      description: "Your editing tasks have been saved as a macro",
    });
  };

  const handleOpenMacro = () => {
    // In a real implementation, this would open a dialog to select a saved macro
    setSelectedTasks(["resize", "brightness", "contrast"]);
    toast({
      title: "Macro loaded",
      description: "Sample macro has been loaded",
    });
  };

  const handleTryPremium = () => {
    toast({
      title: "Premium Features",
      description: "Upgrade to process unlimited files and access advanced editing features",
    });
  };
  
  const filteredTasks = tasks.filter(task => task.category === activeTab);

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen bg-background">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500 p-2 rounded-md">
            <span className="text-xl font-bold text-black">B</span>
          </div>
          <h1 className="text-2xl font-bold">Batch Editor</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="gap-1">
            <User size={16} />
            <span>Sign up / Log in</span>
          </Button>
          <Button size="sm" className="gap-1 bg-yellow-500 hover:bg-yellow-600 text-black" onClick={handleTryPremium}>
            <Gem size={16} />
            <span>Try premium</span>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-muted/30 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-center">Batch edit</h2>
            <div className="p-4 bg-muted/50 rounded-md">
              <p className="text-sm mb-4">
                Add editing tasks from below or open a previously saved macro (.pxm). Premium users can batch up to 100 files at a time.
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" className="text-blue-500" onClick={handleOpenMacro}>
                  <Folder size={16} className="mr-1" />
                  Open macro
                </Button>
                <span className="text-sm flex items-center">or</span>
                <Button variant="outline" size="sm" className="text-blue-500" onClick={handleSaveMacro}>
                  <Save size={16} className="mr-1" />
                  Save macro
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-center">Add task</h2>
            <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="temperature">Temperature</TabsTrigger>
                <TabsTrigger value="sharpening">Effects</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-0 space-y-1">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-muted/80 transition-colors ${
                      selectedTasks.includes(task.id) ? "bg-muted" : ""
                    }`}
                    onClick={() => toggleTask(task.id)}
                  >
                    <div className="text-muted-foreground">
                      {task.icon}
                    </div>
                    <span className="flex-grow">{task.name}</span>
                    <Checkbox
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={() => toggleTask(task.id)}
                    />
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-muted/30 rounded-lg p-6 min-h-[400px] flex flex-col">
            <div className="flex-grow flex flex-col items-center justify-center mb-6">
              {uploadedFiles.length === 0 ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-12 text-center w-full max-w-md">
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                      <Upload size={32} className="text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-2">Add photo(s)</p>
                    <Input 
                      id="file-upload" 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              ) : (
                <div className="w-full">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="aspect-square border rounded-md bg-muted/50 relative overflow-hidden">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`Preview ${index}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  {processing && (
                    <div className="mt-6">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Processing images...</span>
                        <span className="text-sm">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={handleClear}
                disabled={processing}
                className="gap-1"
              >
                <Clear size={16} />
                Clear
              </Button>
              <Button 
                onClick={handleExport} 
                disabled={processing || uploadedFiles.length === 0}
                className="gap-1 bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                <Export size={16} />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImageSizeIncreaser;
