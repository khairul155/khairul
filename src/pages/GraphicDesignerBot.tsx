
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sparkles, 
  SendHorizontal, 
  Wand2, 
  Palette, 
  BrainCircuit, 
  ChevronRight,
  MoveUp,
  Trash2,
  Bot,
  Coins,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import TypingEffect from "@/components/TypingEffect";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCredits } from "@/hooks/use-credits";
import CreditsDisplay from "@/components/CreditsDisplay";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";

interface Message {
  role: 'user' | 'bot';
  content: string;
  isTyping?: boolean;
}

interface Suggestion {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const GraphicDesignerBot = () => {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSlowMode, setIsSlowMode] = useState(false);
  const [waitTime, setWaitTime] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { useToolCredits, credits } = useCredits();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsMounted(true);
    // Add welcome message
    if (!messages.length) {
      setMessages([
        {
          role: 'bot',
          content: "Hey Designer! 👋\nHow can I help you today with graphic design ideas and prompts?"
        }
      ]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!prompt.trim()) return;
    
    // Check if user is authenticated
    if (!user) {
      toast.error("Please sign in to use the Graphic Designer Bot");
      navigate("/auth");
      return;
    }
      
    const userMessage = { 
      role: 'user' as const, 
      content: prompt
    };
    
    setMessages(prev => [...prev, userMessage]);
    setPrompt("");
    setIsLoading(true);
    setShowSuggestions(false); // Hide suggestions when a prompt is sent
    
    try {
      // Check credits before proceeding
      const toolResult = await useToolCredits('graphic_designer_bot');
      if (!toolResult.success && !toolResult.canUse) {
        // If the user doesn't have enough credits and can't use the tool, return
        setIsLoading(false);
        return;
      }

      // Handle slow mode
      if (toolResult.status === 'slow_mode') {
        setIsSlowMode(true);
        // Wait 5 seconds in slow mode before generating
        setWaitTime(5);
        const countdownInterval = setInterval(() => {
          setWaitTime((prev) => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownInterval);
              return null;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Add a temporary message
        setMessages(prev => [...prev, { 
          role: 'bot', 
          content: "Running in slow mode due to credit limits. Please wait...",
          isTyping: false
        }]);
        
        // Wait for the countdown to complete
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        setIsSlowMode(false);
      }
      
      // First add a temporary "typing" message
      setMessages(prev => [...prev, { role: 'bot', content: "", isTyping: true }]);

      const { data, error } = await supabase.functions.invoke('graphic-designer-bot', {
        body: { prompt }
      });

      if (error) throw error;

      // Remove the typing message and add the actual response
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages.pop(); // Remove the typing indicator
        return [...newMessages, { role: 'bot', content: data.generatedText }];
      });
    } catch (error) {
      console.error('Error calling graphic-designer-bot function:', error);
      toast.error("Failed to get a response. Please try again.");
      
      // Remove the typing message and add error message
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1].isTyping) {
          newMessages.pop(); // Remove the typing indicator
        }
        return [...newMessages, { role: 'bot', content: "Sorry, I encountered an error. Please try again later." }];
      });
    } finally {
      setIsLoading(false);
      setWaitTime(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = async (suggestionText: string) => {
    // Check if user is authenticated
    if (!user) {
      toast.error("Please sign in to use the Graphic Designer Bot");
      navigate("/auth");
      return;
    }
    
    setMessages(prev => [...prev, { role: 'user', content: suggestionText }]);
    
    setIsLoading(true);
    setShowSuggestions(false); // Hide suggestions
    
    try {
      // Check credits before proceeding
      const toolResult = await useToolCredits('graphic_designer_bot');
      if (!toolResult.success && !toolResult.canUse) {
        // If the user doesn't have enough credits and can't use the tool, return
        setIsLoading(false);
        return;
      }

      // Handle slow mode
      if (toolResult.status === 'slow_mode') {
        setIsSlowMode(true);
        // Wait 5 seconds in slow mode before generating
        setWaitTime(5);
        const countdownInterval = setInterval(() => {
          setWaitTime((prev) => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownInterval);
              return null;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Add a temporary message
        setMessages(prev => [...prev, { 
          role: 'bot', 
          content: "Running in slow mode due to credit limits. Please wait...",
          isTyping: false
        }]);
        
        // Wait for the countdown to complete
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        setIsSlowMode(false);
      }
    
      // First add a temporary "typing" message
      setMessages(prev => [...prev, { role: 'bot', content: "", isTyping: true }]);

      const { data, error } = await supabase.functions.invoke('graphic-designer-bot', {
        body: { prompt: suggestionText }
      });

      if (error) throw error;
      
      // Remove the typing message and add the actual response
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages.pop(); // Remove the typing indicator
        return [...newMessages, { role: 'bot', content: data.generatedText }];
      });
    } catch (error) {
      console.error('Error calling graphic-designer-bot function:', error);
      toast.error("Failed to get a response. Please try again.");
      
      // Remove the typing message and add error message
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1].isTyping) {
          newMessages.pop(); // Remove the typing indicator
        }
        return [...newMessages, { role: 'bot', content: "Sorry, I encountered an error. Please try again later." }];
      });
    } finally {
      setIsLoading(false);
      setWaitTime(null);
    }
  };

  const handleClearChat = () => {
    setMessages([{
      role: 'bot',
      content: "Hey Designer! 👋\nHow can I help you today with graphic design ideas and prompts?"
    }]);
    setShowSuggestions(true); // Show suggestions when chat is cleared
  };

  const suggestions: Suggestion[] = [
    {
      title: "Detailed Vector Prompts",
      description: "I need 15 long, detailed, unique, and popular vector-style image prompts for stock sales. Isolated transparent background, Single object only, No symbols in prompts",
      icon: <Palette className="text-[#FAF7F0]" />
    },
    {
      title: "Top Microstock Ideas",
      description: "Give me Top 10 rankable ideas which are hot, Trending topics for Microstock.",
      icon: <BrainCircuit className="text-[#FAF7F0]" />
    },
    {
      title: "Trending Topics",
      description: "Want the top 10 trending Microstock topics?",
      icon: <Sparkles className="text-[#FAF7F0]" />
    },
    {
      title: "2025 Trending Prompts",
      description: "Give me the 2025 best prompts which are trending now",
      icon: <Wand2 className="text-[#FAF7F0]" />
    }
  ];

  // Function to render suggestion component between messages
  const renderSuggestions = () => {
    if (!showSuggestions) return null;
    
    return (
      <div className="mx-auto max-w-4xl w-full my-6 px-4">
        <p className="text-[#FAF7F0]/80 mb-3 flex items-center justify-center">
          <Sparkles className="w-4 h-4 mr-2 text-[#FAF7F0]" />
          Try these suggestions:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion.description)}
              className="group p-4 bg-[#1A1A1A] hover:bg-[#1A1A1A]/80 border border-[#FAF7F0]/20 rounded-xl transition-all duration-300 text-left flex flex-col h-full hover:shadow-[0_0_15px_rgba(250,247,240,0.2)] hover:-translate-y-1"
            >
              <div className="flex items-center mb-2">
                <div className="mr-3 p-2 rounded-lg bg-[#FAF7F0]/5">
                  {suggestion.icon}
                </div>
                <h3 className="font-medium text-[#FAF7F0]">{suggestion.title}</h3>
              </div>
              <p className="text-sm text-[#FAF7F0]/70 mb-3 line-clamp-2">
                {suggestion.description}
              </p>
              <div className="mt-auto flex items-center text-[#FAF7F0] text-sm font-medium">
                Try this
                <ChevronRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0C0C0C] text-[#FAF7F0] relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 -left-48 -top-48 bg-[#FAF7F0]/5 rounded-full mix-blend-overlay filter blur-3xl"></div>
        <div className="absolute w-96 h-96 -right-48 top-1/4 bg-[#FAF7F0]/10 rounded-full mix-blend-overlay filter blur-3xl"></div>
        <div className="absolute w-96 h-96 left-1/3 -bottom-48 bg-[#FAF7F0]/5 rounded-full mix-blend-overlay filter blur-3xl"></div>
      </div>

      <div className="flex flex-col w-full h-full relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center py-4 px-4 border-b border-[#FAF7F0]/10">
          <h1 className="text-2xl font-bold text-[#FAF7F0]">Graphic Designer Bot</h1>
          
          {user && (
            <div className="hidden md:block">
              <CreditsDisplay compact />
            </div>
          )}
        </div>

        {/* Main chat area - with full-screen layout */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-6" id="chat-container">
          <div className="max-w-5xl mx-auto">
            {user && (
              <div className="mb-6 md:hidden">
                <CreditsDisplay />
              </div>
            )}
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "bot" && !message.isTyping && (
                    <div className="mr-3 mt-1">
                      <Avatar className="h-8 w-8 bg-[#0C0C0C] border border-[#FAF7F0]/30">
                        <AvatarFallback className="bg-[#1A1A1A]">
                          <Bot className="h-5 w-5 text-[#FAF7F0]" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-[#FAF7F0]/10 border border-[#FAF7F0]/20 text-[#FAF7F0]"
                        : "bg-[#1A1A1A] border border-[#FAF7F0]/10 text-[#FAF7F0]"
                    }`}
                  >
                    {message.isTyping ? (
                      <div className="flex space-x-2 items-center h-6">
                        <div className="w-2 h-2 rounded-full bg-[#FAF7F0] animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 rounded-full bg-[#FAF7F0] animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2 h-2 rounded-full bg-[#FAF7F0] animate-bounce" style={{animationDelay: '300ms'}}></div>
                      </div>
                    ) : message.role === 'bot' ? (
                      <TypingEffect text={message.content} />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Credits display for desktop */}
            {user && (
              <div className="fixed top-20 right-6 z-10 w-64 hidden lg:block">
                <CreditsDisplay />
              </div>
            )}
            
            {/* Render suggestions after messages */}
            {renderSuggestions()}
          </div>
        </div>

        {/* Input area - Fixed at the bottom */}
        <div className="border-t border-[#FAF7F0]/10 bg-[#0C0C0C] px-4 md:px-6 lg:px-8 py-4">
          <div className="max-w-5xl mx-auto">
            {isSlowMode && waitTime !== null && (
              <div className="mb-3 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Slow mode active - Waiting {waitTime}s before processing
              </div>
            )}
          
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me about design ideas, prompts, or trends..."
                  className="resize-none min-h-[60px] pr-12 bg-[#1A1A1A] border-[#FAF7F0]/20 placeholder:text-[#FAF7F0]/50 text-[#FAF7F0]"
                />
                <Button
                  size="icon"
                  className="absolute bottom-1 right-1 bg-[#FAF7F0] hover:bg-[#FAF7F0]/80 text-[#0C0C0C]"
                  onClick={handleSend}
                  disabled={isLoading || !prompt.trim()}
                >
                  {isLoading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-[#0C0C0C] border-t-transparent rounded-full"></div>
                  ) : isSlowMode ? (
                    <Coins className="h-5 w-5" />
                  ) : (
                    <SendHorizontal className="h-5 w-5" />
                  )}
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleClearChat}
                className="bg-transparent border-[#FAF7F0]/20 text-[#FAF7F0] hover:text-[#FAF7F0] hover:bg-[#FAF7F0]/10"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll to top button */}
        {messages.length > 4 && (
          <Button
            size="icon"
            onClick={() => document.getElementById('chat-container')?.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-20 right-6 rounded-full bg-[#FAF7F0] hover:bg-[#FAF7F0]/80 text-[#0C0C0C] shadow-lg"
          >
            <MoveUp className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default GraphicDesignerBot;
