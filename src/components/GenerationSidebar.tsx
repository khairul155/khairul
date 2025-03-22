import { useState } from "react";
import { 
  ChevronDown, 
  Info, 
  Zap, 
  Check, 
  Star,
  ImageIcon,
  Paintbrush,
  Upload,
  FolderOpen,
  Camera,
  History
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import AspectRatioSelector from "./AspectRatioSelector";
import { cn } from "@/lib/utils";

export interface GenerationSettings {
  mode: "fast" | "quality" | "ultra";
  steps: number;
  dimensionId: string;
  width: number;
  height: number;
}

interface GenerationSidebarProps {
  settings: GenerationSettings;
  onSettingsChange: (settings: Partial<GenerationSettings>) => void;
}

const GenerationSidebar = ({ settings, onSettingsChange }: GenerationSidebarProps) => {
  // Manage collapsible sections
  const [isGeneralOpen, setIsGeneralOpen] = useState(true);
  const [isContentTypeOpen, setIsContentTypeOpen] = useState(true);
  const [isCompositionOpen, setIsCompositionOpen] = useState(true);
  
  // Content type selection
  const [contentType, setContentType] = useState("art");
  const [autoContentType, setAutoContentType] = useState(false);
  
  // Aspect ratios
  const aspectRatios = [
    { id: "1:1", label: "Square (1:1)", width: 1024, height: 1024 },
    { id: "4:3", label: "4:3", width: 1024, height: 768 },
    { id: "3:4", label: "3:4", width: 768, height: 1024 },
    { id: "16:9", label: "16:9", width: 1024, height: 576 },
    { id: "9:16", label: "9:16", width: 576, height: 1024 },
  ];

  // Negative prompt
  const [negativePrompt, setNegativePrompt] = useState("");

  // Set aspect ratio dimensions
  const handleAspectRatioChange = (ratioId: string) => {
    const selectedRatio = aspectRatios.find(ratio => ratio.id === ratioId);
    if (selectedRatio) {
      onSettingsChange({
        dimensionId: ratioId,
        width: selectedRatio.width,
        height: selectedRatio.height
      });
    }
  };

  // Handle generation mode change
  const handleModeChange = (mode: "fast" | "quality" | "ultra") => {
    const steps = mode === "fast" ? 11 : mode === "quality" ? 13 : 16;
    onSettingsChange({ mode, steps });
  };

  return (
    <div className="w-80 bg-[#1A1A1A] border-r border-gray-800 flex flex-col h-screen overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex items-center space-x-2">
        <div className="flex-1">
          <h2 className="font-medium text-white">Settings</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* General Settings */}
        <Collapsible 
          open={isGeneralOpen} 
          onOpenChange={setIsGeneralOpen}
          className="border border-gray-800 rounded-lg overflow-hidden"
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left focus:outline-none">
            <div className="flex items-center gap-2">
              <ChevronDown className={`h-4 w-4 transition-transform ${isGeneralOpen ? 'transform rotate-180' : ''}`} />
              <span className="font-medium">General settings</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4 space-y-4">
            {/* Model Selection */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Model</Label>
              <div className="flex items-center space-x-3 border border-gray-800 rounded-md p-2">
                <div className="h-8 w-8 rounded overflow-hidden">
                  <img 
                    src="/placeholder.svg" 
                    alt="Model" 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <Select defaultValue="firefly">
                    <SelectTrigger className="border-0 h-8 p-0 bg-transparent focus:ring-0">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="firefly">Firefly Image 3</SelectItem>
                      <SelectItem value="stable">Stable Diffusion</SelectItem>
                      <SelectItem value="dall-e">DALL-E 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Fast Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label className="text-sm text-gray-400">Fast mode</Label>
                <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full p-0">
                  <Info className="h-3 w-3 text-gray-500" />
                </Button>
              </div>
              <Switch 
                checked={settings.mode === "fast"}
                onCheckedChange={(checked) => 
                  handleModeChange(checked ? "fast" : "quality")
                }
              />
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Aspect ratio</Label>
              <Select 
                value={settings.dimensionId}
                onValueChange={handleAspectRatioChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select aspect ratio" />
                </SelectTrigger>
                <SelectContent>
                  {aspectRatios.map(ratio => (
                    <SelectItem key={ratio.id} value={ratio.id}>
                      <div className="flex items-center">
                        <div className={cn(
                          "mr-2 h-4 w-4 border border-gray-600 overflow-hidden relative",
                          ratio.id === "1:1" && "aspect-square",
                          ratio.id === "4:3" && "aspect-[4/3]",
                          ratio.id === "3:4" && "aspect-[3/4]",
                          ratio.id === "16:9" && "aspect-[16/9]",
                          ratio.id === "9:16" && "aspect-[9/16]",
                        )} />
                        {ratio.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Content Type */}
        <Collapsible 
          open={isContentTypeOpen} 
          onOpenChange={setIsContentTypeOpen}
          className="border border-gray-800 rounded-lg overflow-hidden"
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left focus:outline-none">
            <div className="flex items-center gap-2">
              <ChevronDown className={`h-4 w-4 transition-transform ${isContentTypeOpen ? 'transform rotate-180' : ''}`} />
              <span className="font-medium">Content type</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <Button 
                  variant={contentType === "art" ? "default" : "outline"}
                  size="sm" 
                  className={cn(
                    "rounded-full h-8",
                    contentType === "art" ? "bg-[#2776FF] hover:bg-[#1665F2]" : ""
                  )}
                  onClick={() => setContentType("art")}
                >
                  <Paintbrush className="h-4 w-4 mr-1" />
                  Art
                </Button>
                <Button 
                  variant={contentType === "photo" ? "default" : "outline"}
                  size="sm" 
                  className={cn(
                    "rounded-full h-8",
                    contentType === "photo" ? "bg-[#2776FF] hover:bg-[#1665F2]" : ""
                  )}
                  onClick={() => setContentType("photo")}
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Photo
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">Auto</span>
                <Switch 
                  checked={autoContentType}
                  onCheckedChange={setAutoContentType}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Composition */}
        <Collapsible 
          open={isCompositionOpen} 
          onOpenChange={setIsCompositionOpen}
          className="border border-gray-800 rounded-lg overflow-hidden"
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left focus:outline-none">
            <div className="flex items-center gap-2">
              <ChevronDown className={`h-4 w-4 transition-transform ${isCompositionOpen ? 'transform rotate-180' : ''}`} />
              <span className="font-medium">Composition</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-400">Reference</Label>
                <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full p-0">
                  <Info className="h-3 w-3 text-gray-500" />
                </Button>
              </div>
              
              <div className="border border-dashed border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                <div className="w-full flex flex-col gap-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload image
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Browse gallery
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="aspect-square bg-gray-800 rounded-md overflow-hidden">
                    {/* Sample image thumbnails could go here */}
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default GenerationSidebar;
