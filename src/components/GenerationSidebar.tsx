
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
  History,
  Gem,
  Sparkles
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
  negativePrompt?: string;
}

interface GenerationSidebarProps {
  settings: GenerationSettings;
  onSettingsChange: (settings: Partial<GenerationSettings>) => void;
}

const GenerationSidebar = ({ settings, onSettingsChange }: GenerationSidebarProps) => {
  // Manage collapsible sections
  const [isGeneralOpen, setIsGeneralOpen] = useState(true);
  const [isQualityEnhancerOpen, setIsQualityEnhancerOpen] = useState(true);
  const [isCompositionOpen, setIsCompositionOpen] = useState(true);
  
  // Default negative prompt example
  const negativePromptExample = "blurry, low quality, poorly drawn, unclear details, cut-off";
  
  // Aspect ratios
  const aspectRatios = [
    { id: "1:1", label: "Square (1:1)", width: 1024, height: 1024 },
    { id: "4:3", label: "4:3", width: 1024, height: 768 },
    { id: "3:4", label: "3:4", width: 768, height: 1024 },
    { id: "16:9", label: "16:9", width: 1024, height: 576 },
    { id: "9:16", label: "9:16", width: 576, height: 1024 },
  ];

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

  // Handle negative prompt change
  const handleNegativePromptChange = (value: string) => {
    onSettingsChange({ negativePrompt: value });
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

            {/* Generation Mode Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label className="text-sm text-gray-400">Generation mode</Label>
                  <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full p-0">
                    <Info className="h-3 w-3 text-gray-500" />
                  </Button>
                </div>
              </div>
              
              <RadioGroup 
                className="grid grid-cols-3 gap-2"
                value={settings.mode}
                onValueChange={(value) => handleModeChange(value as "fast" | "quality" | "ultra")}
              >
                <div>
                  <RadioGroupItem value="fast" id="mode-fast" className="peer sr-only" />
                  <Label 
                    htmlFor="mode-fast" 
                    className="flex flex-col items-center justify-center gap-1 rounded-md border border-gray-700 p-2 hover:bg-gray-800 hover:text-gray-50 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-950/30 peer-data-[state=checked]:text-blue-500 cursor-pointer text-center"
                  >
                    <Zap className="h-5 w-5" />
                    <span className="text-xs">Fast</span>
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem value="quality" id="mode-quality" className="peer sr-only" />
                  <Label 
                    htmlFor="mode-quality" 
                    className="flex flex-col items-center justify-center gap-1 rounded-md border border-gray-700 p-2 hover:bg-gray-800 hover:text-gray-50 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-950/30 peer-data-[state=checked]:text-blue-500 cursor-pointer text-center"
                  >
                    <Star className="h-5 w-5" />
                    <span className="text-xs">Quality</span>
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem value="ultra" id="mode-ultra" className="peer sr-only" />
                  <Label 
                    htmlFor="mode-ultra" 
                    className="flex flex-col items-center justify-center gap-1 rounded-md border border-gray-700 p-2 hover:bg-gray-800 hover:text-gray-50 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-950/30 peer-data-[state=checked]:text-blue-500 cursor-pointer text-center"
                  >
                    <Gem className="h-5 w-5" />
                    <span className="text-xs">Ultra</span>
                  </Label>
                </div>
              </RadioGroup>
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
        
        {/* Quality Enhancer */}
        <Collapsible 
          open={isQualityEnhancerOpen} 
          onOpenChange={setIsQualityEnhancerOpen}
          className="border border-gray-800 rounded-lg overflow-hidden"
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left focus:outline-none">
            <div className="flex items-center gap-2">
              <ChevronDown className={`h-4 w-4 transition-transform ${isQualityEnhancerOpen ? 'transform rotate-180' : ''}`} />
              <span className="font-medium">Quality Enhancer ✨</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-400">Negative Prompt</Label>
                <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full p-0">
                  <Info className="h-3 w-3 text-gray-500" />
                </Button>
              </div>
              
              <Textarea 
                placeholder={negativePromptExample}
                className="bg-[#0F0F0F] border-gray-700 min-h-[80px] resize-none text-sm"
                value={settings.negativePrompt || ""}
                onChange={(e) => handleNegativePromptChange(e.target.value)}
              />
              
              <div className="flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-gray-400 hover:text-white"
                  onClick={() => handleNegativePromptChange("")}
                >
                  Reset
                </Button>
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
