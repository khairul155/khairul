
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
  Sparkles,
  Hash
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AspectRatioSelector from "./AspectRatioSelector";
import { cn } from "@/lib/utils";

export interface GenerationSettings {
  mode: "fast" | "quality" | "ultra";
  steps: number;
  dimensionId: string;
  width: number;
  height: number;
  negativePrompt?: string;
  seed?: number;
  useSeed?: boolean;
}

interface GenerationSidebarProps {
  settings: GenerationSettings;
  onSettingsChange: (settings: Partial<GenerationSettings>) => void;
}

const GenerationSidebar = ({ settings, onSettingsChange }: GenerationSidebarProps) => {
  // Manage collapsible sections
  const [isGeneralOpen, setIsGeneralOpen] = useState(true);
  const [isQualityEnhancerOpen, setIsQualityEnhancerOpen] = useState(true);
  const [isSeedOpen, setIsSeedOpen] = useState(true);
  
  // Default negative prompt example
  const negativePromptExample = "Blurry, Low-Quality, Poorly Drawn, Unclear Details, Cut-Off..";
  
  // Aspect ratios
  const aspectRatios = [
    { id: "1:1", label: "Square (1:1)", width: 1024, height: 1024 },
    { id: "4:3", label: "Landscape (4:3)", width: 1024, height: 768 },
    { id: "3:4", label: "Portrait (3:4)", width: 768, height: 1024 },
    { id: "16:9", label: "Widescreen (16:9)", width: 1024, height: 576 },
    { id: "9:16", label: "Portrait (9:16)", width: 576, height: 1024 },
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

  // Handle generation mode change with updated steps values
  const handleModeChange = (mode: "fast" | "quality" | "ultra") => {
    // Map each mode to the correct number of inference steps
    const steps = mode === "fast" ? 7 : mode === "quality" ? 10 : 16;
    onSettingsChange({ mode, steps });
  };

  // Handle negative prompt change
  const handleNegativePromptChange = (value: string) => {
    onSettingsChange({ negativePrompt: value });
  };

  // Handle seed number change
  const handleSeedChange = (value: string) => {
    const seedValue = parseInt(value) || -1;
    onSettingsChange({ seed: seedValue });
  };

  // Handle seed toggle
  const handleSeedToggle = (checked: boolean) => {
    onSettingsChange({ useSeed: checked });
  };

  // Generate random seed
  const generateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 1000000);
    onSettingsChange({ seed: randomSeed });
  };

  // Render the aspect ratio icons
  const renderAspectRatioIcon = (ratioId: string) => {
    return (
      <div className="flex items-center">
        <div 
          className={cn(
            "mr-2 h-5 w-5 border border-gray-600 flex items-center justify-center bg-transparent overflow-hidden",
            settings.dimensionId === ratioId && "border-blue-500 bg-blue-950/30"
          )}
        >
          {settings.dimensionId === ratioId && (
            <Check className="h-3 w-3 text-blue-500" />
          )}
        </div>
        {aspectRatios.find(r => r.id === ratioId)?.label || ratioId}
      </div>
    );
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
                <div className="h-8 w-8 rounded overflow-hidden bg-[#3C3D37] flex items-center justify-center">
                  <span className="text-[#FFA725] text-xs font-bold">AI</span>
                </div>
                <div className="flex-1">
                  <Select defaultValue="pixcraftai">
                    <SelectTrigger className="border-0 h-8 p-0 bg-transparent focus:ring-0">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pixcraftai">Pixcraftai 1</SelectItem>
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full p-0">
                          <Info className="h-3 w-3 text-[#FFA725]" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#3C3D37] text-[#FFA725] border-[#3C3D37]">
                        <p>Controls speed and quality balance</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                    className="flex flex-col items-center justify-center gap-1 rounded-md border border-gray-700 p-2 hover:bg-gray-800 hover:text-gray-50 peer-data-[state=checked]:border-[#FFA725] peer-data-[state=checked]:bg-[#3C3D37]/30 peer-data-[state=checked]:text-[#FFA725] cursor-pointer text-center"
                  >
                    <Zap className="h-5 w-5" />
                    <span className="text-xs">Fast</span>
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem value="quality" id="mode-quality" className="peer sr-only" />
                  <Label 
                    htmlFor="mode-quality" 
                    className="flex flex-col items-center justify-center gap-1 rounded-md border border-gray-700 p-2 hover:bg-gray-800 hover:text-gray-50 peer-data-[state=checked]:border-[#FFA725] peer-data-[state=checked]:bg-[#3C3D37]/30 peer-data-[state=checked]:text-[#FFA725] cursor-pointer text-center"
                  >
                    <Star className="h-5 w-5" />
                    <span className="text-xs">Quality</span>
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem value="ultra" id="mode-ultra" className="peer sr-only" />
                  <Label 
                    htmlFor="mode-ultra" 
                    className="flex flex-col items-center justify-center gap-1 rounded-md border border-gray-700 p-2 hover:bg-gray-800 hover:text-gray-50 peer-data-[state=checked]:border-[#FFA725] peer-data-[state=checked]:bg-[#3C3D37]/30 peer-data-[state=checked]:text-[#FFA725] cursor-pointer text-center"
                  >
                    <Gem className="h-5 w-5" />
                    <span className="text-xs">Ultra</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Image Dimensions */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Image dimensions</Label>
              <Select 
                value={settings.dimensionId}
                onValueChange={handleAspectRatioChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select dimensions" />
                </SelectTrigger>
                <SelectContent>
                  {aspectRatios.map(ratio => (
                    <SelectItem key={ratio.id} value={ratio.id}>
                      {renderAspectRatioIcon(ratio.id)}
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
                <Label className="text-sm text-gray-400">Keep This Out</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full p-0">
                        <Info className="h-3 w-3 text-[#FFA725]" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#3C3D37] text-[#FFA725] border-[#3C3D37]">
                      <p>Optimizes images for better results</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
        
        {/* Seed Number (replaced Composition) */}
        <Collapsible 
          open={isSeedOpen} 
          onOpenChange={setIsSeedOpen}
          className="border border-gray-800 rounded-lg overflow-hidden"
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left focus:outline-none">
            <div className="flex items-center gap-2">
              <ChevronDown className={`h-4 w-4 transition-transform ${isSeedOpen ? 'transform rotate-180' : ''}`} />
              <span className="font-medium">Seed Number</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label className="text-sm text-gray-400">Use Seed</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full p-0">
                          <Info className="h-3 w-3 text-[#FFA725]" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#3C3D37] text-[#FFA725] border-[#3C3D37]">
                        <p>Enable to use a specific seed for consistent results</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Switch 
                  checked={settings.useSeed || false}
                  onCheckedChange={handleSeedToggle}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-gray-400">Seed Value</Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input 
                      type="number"
                      placeholder="Seed number"
                      className="pl-9 bg-[#0F0F0F] border-gray-700"
                      value={settings.seed === -1 ? "" : settings.seed}
                      onChange={(e) => handleSeedChange(e.target.value)}
                      disabled={!settings.useSeed}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-[#0F0F0F] border-gray-700"
                    onClick={generateRandomSeed}
                    disabled={!settings.useSeed}
                  >
                    <Hash className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  {settings.useSeed 
                    ? "Using the same seed will create similar results with the same prompt." 
                    : "Random seed will be used (different results each time)."}
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default GenerationSidebar;
