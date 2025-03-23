
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Array of stock photography prompts
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Generating random prompt from stock photography list')
    
    // Pick a random prompt from the array
    const randomIndex = Math.floor(Math.random() * stockPrompts.length)
    const generatedPrompt = stockPrompts[randomIndex]
    
    console.log(`Selected prompt: ${generatedPrompt}`)
    
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
