
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings, X } from "lucide-react";
import AspectRatioSelector, { AspectRatio } from "./AspectRatioSelector";
import NumberSelector from "./NumberSelector";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface ImageGeneratorSettings {
  aspectRatio: AspectRatio;
  numImages: number;
  negativePrompt: string;
  displayCredits: boolean;
  privateMode: boolean;
}

interface ImageGeneratorSettingsProps {
  settings: ImageGeneratorSettings;
  onSettingsChange: (settings: Partial<ImageGeneratorSettings>) => void;
}

const ASPECT_RATIOS: AspectRatio[] = [
  { id: "1:1", label: "1:1", width: 1024, height: 1024 },
  { id: "4:3", label: "4:3", width: 1024, height: 768 },
  { id: "3:4", label: "3:4", width: 768, height: 1024 },
  { id: "16:9", label: "16:9", width: 1024, height: 576 },
  { id: "9:16", label: "9:16", width: 576, height: 1024 },
];

const NUM_IMAGES_OPTIONS = [1, 2, 3, 4];

const ImageGeneratorSettingsPanel: React.FC<ImageGeneratorSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] bg-background/95 backdrop-blur-md">
        <div className="flex flex-col gap-6 py-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Settings</h2>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <AspectRatioSelector
            aspectRatios={ASPECT_RATIOS}
            selectedRatio={settings.aspectRatio.id}
            onSelect={(ratioId) => {
              const newRatio = ASPECT_RATIOS.find((r) => r.id === ratioId);
              if (newRatio) {
                onSettingsChange({ aspectRatio: newRatio });
              }
            }}
          />

          <NumberSelector
            title="Number of Images"
            options={NUM_IMAGES_OPTIONS}
            selectedValue={settings.numImages}
            onSelect={(value) => onSettingsChange({ numImages: value })}
          />

          <div className="space-y-2">
            <Label htmlFor="negative-prompt" className="text-sm font-medium">Negative Prompts</Label>
            <Textarea
              id="negative-prompt"
              placeholder="Enter things to exclude from the image..."
              className="h-20 resize-none"
              value={settings.negativePrompt}
              onChange={(e) => onSettingsChange({ negativePrompt: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="display-credits" className="text-sm font-medium">Display Credits Consumption</Label>
              <Switch
                id="display-credits"
                checked={settings.displayCredits}
                onCheckedChange={(checked) => onSettingsChange({ displayCredits: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="private-mode" className="text-sm font-medium">Private Mode</Label>
                <div className="flex items-center justify-center rounded-full bg-muted w-4 h-4 text-xs">?</div>
              </div>
              <Switch
                id="private-mode"
                checked={settings.privateMode}
                onCheckedChange={(checked) => onSettingsChange({ privateMode: checked })}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ImageGeneratorSettingsPanel;
