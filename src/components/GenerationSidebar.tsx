
import { useState } from "react";
import { Info, Zap, Diamond, Star, Square, Maximize2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface GenerationMode {
  id: string;
  name: string;
  steps: number;
  icon: React.ReactNode;
  isNew?: boolean;
  isPro?: boolean;
}

export interface ImageDimension {
  id: string;
  name: string;
  aspectRatio: string;
  width: number;
  height: number;
  icon?: React.ReactNode;
}

export interface GenerationSettings {
  mode: string;
  steps: number;
  dimensionId: string;
  width: number;
  height: number;
}

interface GenerationSidebarProps {
  settings: GenerationSettings;
  onSettingsChange: (settings: Partial<GenerationSettings>) => void;
}

const GenerationSidebar: React.FC<GenerationSidebarProps> = ({
  settings,
  onSettingsChange,
}) => {
  const [sliderValue, setSliderValue] = useState([settings.steps]);
  
  // Available generation modes
  const generationModes: GenerationMode[] = [
    { id: "fast", name: "Fast", steps: 8, icon: <Zap className="h-4 w-4" /> },
    { id: "quality", name: "Quality", steps: 12, icon: <Diamond className="h-4 w-4" />, isPro: true },
    { id: "ultra", name: "Ultra", steps: 16, icon: <Star className="h-4 w-4" />, isNew: true },
  ];

  // Available image dimensions
  const imageDimensions: ImageDimension[] = [
    { id: "2:3", name: "2:3", aspectRatio: "2:3", width: 736, height: 1120 },
    { id: "1:1", name: "1:1", aspectRatio: "1:1", width: 832, height: 832 },
    { id: "16:9", name: "16:9", aspectRatio: "16:9", width: 832, height: 468 },
    { id: "more", name: "More", aspectRatio: "", width: 0, height: 0, icon: <Maximize2 className="h-4 w-4" /> },
  ];

  const imageSizes = [
    { id: "small", name: "Small", width: 736, height: 1120 },
    { id: "medium", name: "Medium", width: 832, height: 1248 },
    { id: "large", name: "Large", width: 896, height: 1344, isPro: true },
  ];

  const handleModeChange = (modeId: string) => {
    const mode = generationModes.find(m => m.id === modeId);
    if (mode) {
      onSettingsChange({ mode: modeId, steps: mode.steps });
      setSliderValue([mode.steps]);
    }
  };

  const handleStepsChange = (value: number[]) => {
    setSliderValue(value);
    onSettingsChange({ steps: value[0] });
    
    // Update mode based on steps value
    if (value[0] <= 8) {
      onSettingsChange({ mode: "fast" });
    } else if (value[0] <= 12) {
      onSettingsChange({ mode: "quality" });
    } else {
      onSettingsChange({ mode: "ultra" });
    }
  };

  const handleDimensionChange = (dimensionId: string) => {
    const dimension = imageDimensions.find(d => d.id === dimensionId);
    if (dimension && dimension.id !== "more") {
      onSettingsChange({ 
        dimensionId: dimensionId,
        width: dimension.width,
        height: dimension.height 
      });
    }
  };

  const handleSizeChange = (sizeId: string) => {
    const size = imageSizes.find(s => s.id === sizeId);
    if (size) {
      onSettingsChange({ 
        width: size.width,
        height: size.height 
      });
    }
  };

  return (
    <div className="w-64 bg-gray-900 text-white h-full flex flex-col p-4 space-y-6 border-r border-gray-800">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-md font-medium">Generation Mode</h3>
            <Info className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {generationModes.map((mode) => (
            <Button
              key={mode.id}
              variant="outline"
              className={cn(
                "relative flex-col h-14 p-2 border border-purple-700/20 bg-gray-800 hover:bg-gray-700",
                settings.mode === mode.id && "border-purple-600 bg-gray-800"
              )}
              onClick={() => handleModeChange(mode.id)}
            >
              <div className="flex items-center justify-center gap-1">
                {mode.icon}
                <span className="text-sm">{mode.name}</span>
              </div>
              {mode.isPro && (
                <Badge className="absolute -top-2 -right-2 bg-purple-600 text-[10px] px-1 py-0">PRO</Badge>
              )}
              {mode.isNew && (
                <Badge className="absolute -top-2 -right-2 bg-blue-600 text-[10px] px-1 py-0">NEW</Badge>
              )}
            </Button>
          ))}
        </div>

        <div className="pt-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Interface Steps: {sliderValue[0]}</span>
            <span>
              {sliderValue[0] <= 8 ? "Fast" : sliderValue[0] <= 12 ? "Quality" : "Ultra"}
            </span>
          </div>
          <Slider
            value={sliderValue}
            min={4}
            max={20}
            step={1}
            onValueChange={handleStepsChange}
            className="w-full"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-md font-medium">Image Dimensions</h3>
            <Info className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {imageDimensions.map((dimension) => (
            <Button
              key={dimension.id}
              variant="outline"
              className={cn(
                "relative h-16 p-2 border border-purple-700/20 bg-gray-800 hover:bg-gray-700",
                settings.dimensionId === dimension.id && "border-purple-600 bg-gray-800"
              )}
              onClick={() => handleDimensionChange(dimension.id)}
            >
              {dimension.id === "more" ? (
                <div className="flex items-center justify-center">
                  {dimension.icon}
                  <span className="text-xs ml-1">More</span>
                </div>
              ) : dimension.id === "2:3" ? (
                <div className="h-8 w-5 border border-gray-500 mx-auto"></div>
              ) : dimension.id === "1:1" ? (
                <div className="h-6 w-6 border border-gray-500 mx-auto"></div>
              ) : (
                <div className="h-4 w-8 border border-gray-500 mx-auto"></div>
              )}
              <span className="text-xs mt-1">{dimension.aspectRatio}</span>
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">
          {imageSizes.map((size) => (
            <Button
              key={size.id}
              variant="outline"
              className={cn(
                "relative flex flex-col h-14 p-1 border border-purple-700/20 bg-gray-800 hover:bg-gray-700",
                settings.width === size.width && settings.height === size.height && "border-purple-600 bg-gray-800"
              )}
              onClick={() => handleSizeChange(size.id)}
            >
              <span className="text-sm capitalize">{size.name}</span>
              <span className="text-xs text-gray-400">{`${size.width}×${size.height}`}</span>
              {size.isPro && (
                <Badge className="absolute -top-2 -right-2 bg-purple-600 text-[10px] px-1 py-0">PRO</Badge>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GenerationSidebar;
