
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Array of stock photography prompts (base themes)
const stockPrompts = [
  "Background", "Text effect", "Happy birthday", "Easter", "Texture",
  "Paper texture", "White background", "Eid mubarak", "Business card", "Pattern",
  "Heart", "Flower", "Banner", "Easter background", "Instagram logo png",
  "Fire", "4k wallpaper gaming", "Arrow", "Mockup", "Spring background",
  "Text", "Black background", "Spring", "Kawaii coloring page", "Happy spring",
  "Instagram logo", "Blue background", "Logo mockup", "Poster mockup", "Desktop wallpaper",
  "Nature", "Poster", "Sky", "Coffee", "Instagram mockup",
  "Logo", "Coloring pages", "Flyer", "Gold", "Zoom background",
  "Png", "Iphone mockup", "Book mockup", "Down syndrome awareness day 2025", "Grunge texture",
  "Water", "Woods", "Hello spring", "Book", "Torn paper",
  "Tree", "T shirt", "Easter wallpaper", "Paper", "Pizza",
  "Car", "T shirt mockup", "Social media", "World down syndrome day", "Old paper",
  "Travel", "Phone", "Happy easter", "Business", "Certificate",
  "Mockup phone", "Cross", "Windows 11 wallpaper", "Frame", "Eid",
  "First day of spring", "Happy nowruz", "Butterfly", "Welcome spring", "Instagram",
  "Business card mockup", "World map", "Light", "Wood texture", "Crown",
  "Gradient background", "Cute ipad wallpaper", "Leaf", "Jesus", "Iphone",
  "Wedding invitation", "Green background", "Menu", "Grass texture", "Earth",
  "Red background", "Thank you", "Star", "American flag", "Ai",
  "Club flyer", "Cat", "House", "Wallpaper", "Wedding",
  "Birthday", "Ramadan", "Happy spring clip art", "Abstract background", "Gold text effect",
  "Ice cream", "Cloud", "Grass", "Beach", "Anime wallpaper",
  "Mountain", "Grain texture", "Website mockup", "Basketball", "Hello spring clip art",
  "Strawberry", "Border", "Flyer mockup", "Canada flag", "3d text",
  "Facebook logo", "Clock", "Brush", "Moon", "Smoke",
  "Golf", "Technology background", "Music", "Canada", "Cute aesthetic wallpapers",
  "Spring clip art", "Money", "Office", "Magazine mockup", "Facebook logo png",
  "Laptop", "Frame mockup", "Flower png", "Burger", "Living room",
  "Church flyer", "Facebook"
];

// Descriptive adjectives to expand prompts
const adjectives = [
  "beautiful", "stunning", "vibrant", "professional", "elegant", 
  "minimalist", "colorful", "modern", "vintage", "artistic",
  "creative", "detailed", "realistic", "abstract", "dynamic",
  "glossy", "matte", "sleek", "rustic", "futuristic",
  "natural", "fantastic", "magical", "dreamy", "bold",
  "subtle", "clean", "textured", "shiny", "dramatic"
];

// Context words to expand prompts
const contexts = [
  "with soft lighting", "in high resolution", "with gradient effect",
  "with shadow effects", "in pastel colors", "with bright colors",
  "with dark tones", "with blurred background", "in flat design",
  "with 3D effects", "with reflection", "with golden accents",
  "on dark background", "on white background", "with bokeh effect",
  "in photorealistic style", "in watercolor style", "in digital art style",
  "with neon colors", "in monochrome", "with motion blur",
  "with geometric patterns", "in landscape orientation", "in portrait orientation",
  "with subtle gradients", "with retro vibe", "in Nordic style",
  "with minimalist composition", "with vintage filter", "with symmetrical layout"
];

// Generate an expanded prompt with 8-16 words
const expandPrompt = (basePrompt: string): string => {
  // Start with the base prompt
  let words = basePrompt.split(' ');
  
  // Add 1-2 random adjectives
  const numAdjectives = Math.random() > 0.5 ? 2 : 1;
  for (let i = 0; i < numAdjectives; i++) {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    if (!words.includes(adjective)) {
      words.unshift(adjective);
    }
  }
  
  // Add 1-2 context phrases
  const numContexts = Math.random() > 0.3 ? 2 : 1;
  for (let i = 0; i < numContexts; i++) {
    const context = contexts[Math.floor(Math.random() * contexts.length)];
    words.push(...context.split(' '));
  }
  
  // Ensure the prompt has 8-16 words by adding or removing context words
  while (words.length > 16) {
    // Remove from the end (likely context words)
    words.pop();
  }
  
  while (words.length < 8) {
    // Add another adjective or context word
    if (Math.random() > 0.5) {
      const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      if (!words.includes(adjective)) {
        words.unshift(adjective);
      }
    } else {
      const contextParts = contexts[Math.floor(Math.random() * contexts.length)].split(' ');
      words.push(contextParts[0]);
    }
  }
  
  return words.join(' ');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Generating expanded prompt from stock photography list')
    
    // Pick a random base prompt from the array
    const randomIndex = Math.floor(Math.random() * stockPrompts.length);
    const basePrompt = stockPrompts[randomIndex];
    
    // Generate an expanded prompt
    const generatedPrompt = expandPrompt(basePrompt);
    
    console.log(`Selected base theme: ${basePrompt}`);
    console.log(`Expanded prompt: ${generatedPrompt}`);
    
    return new Response(JSON.stringify({ prompt: generatedPrompt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
