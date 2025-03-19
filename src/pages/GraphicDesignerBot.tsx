
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sparkles, 
  SendHorizontal, 
  Image as ImageIcon, 
  Wand2, 
  Palette, 
  BrainCircuit, 
  ChevronRight,
  MoveUp,
  Trash2,
  Bot
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import TypingEffect from "@/components/TypingEffect";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  role: 'user' | 'bot';
  content: string;
  isTyping?: boolean;
}

const GraphicDesignerBot = () => {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Add welcome message
    if (!messages.length) {
      setMessages([
        {
          role: 'bot',
          content: "Hey Designer! 👋\nHow can I help you?"
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
    
    const userMessage = { role: 'user' as const, content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setPrompt("");
    setIsLoading(true);

    try {
      // First add a temporary "typing" message
      setMessages(prev => [...prev, { role: 'bot', content: "", isTyping: true }]);

      const { data, error } = await supabase.functions.invoke('graphic-designer-bot', {
        body: { prompt: prompt }
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
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestionText: string) => {
    setMessages(prev => [...prev, { role: 'user', content: suggestionText }]);
    
    setIsLoading(true);
    // First add a temporary "typing" message
    setMessages(prev => [...prev, { role: 'bot', content: "", isTyping: true }]);

    supabase.functions.invoke('graphic-designer-bot', {
      body: { prompt: suggestionText }
    }).then(({ data, error }) => {
      if (error) throw error;
      
      // Remove the typing message and add the actual response
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages.pop(); // Remove the typing indicator
        return [...newMessages, { role: 'bot', content: data.generatedText }];
      });
    }).catch(error => {
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
    }).finally(() => {
      setIsLoading(false);
    });
  };

  const handleClearChat = () => {
    setMessages([{
      role: 'bot',
      content: "Hey Designer! 👋\nHow can I help you?"
    }]);
  };

  const suggestions = [
    {
      title: "Detailed Vector Prompts",
      description: "I need 15 long, detailed, unique, and popular vector-style image prompts for stock sales. Isolated transparent background, Single object only, No symbols in prompts",
      icon: <ImageIcon className="text-blue-500" />
    },
    {
      title: "Top Microstock Ideas",
      description: "Give me Top 10 rankable ideas which are hot, Trending topics for Microstock.",
      icon: <BrainCircuit className="text-green-500" />
    },
    {
      title: "Trending Topics",
      description: "Want the top 10 trending Microstock topics?",
      icon: <Sparkles className="text-amber-500" />
    },
    {
      title: "2025 Trending Prompts",
      description: "Give me the 2025 best prompts which are trending now",
      icon: <Wand2 className="text-purple-500" />
    }
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 -left-48 -top-48 bg-blue-500/20 rounded-full mix-blend-overlay filter blur-3xl"></div>
        <div className="absolute w-96 h-96 -right-48 top-1/4 bg-purple-500/20 rounded-full mix-blend-overlay filter blur-3xl"></div>
        <div className="absolute w-96 h-96 left-1/3 -bottom-48 bg-teal-500/20 rounded-full mix-blend-overlay filter blur-3xl"></div>
      </div>

      <div className="flex flex-col w-full h-full px-4 py-6 relative z-10">
        {/* Header - Removed the text, just kept the theme toggle */}
        <div className="flex justify-end items-center mb-6 px-4">
          <ThemeToggle />
        </div>

        {/* Main chat area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-xl">
          <div className="flex-1 overflow-y-auto p-6 space-y-6" id="chat-container">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "bot" && !message.isTyping && (
                  <div className="mr-3 mt-1">
                    <Avatar className="h-8 w-8 bg-blue-600">
                      <AvatarFallback className="bg-blue-700">
                        <Bot className="h-5 w-5 text-white" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-100"
                  }`}
                >
                  {message.isTyping ? (
                    <div className="flex space-x-2 items-center h-6">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{animationDelay: '300ms'}}></div>
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

          {/* Input area - Fix the footer space issue */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me about design ideas, prompts, or trends..."
                  className="resize-none min-h-[60px] pr-12 bg-gray-800/70 border-gray-700 placeholder:text-gray-500 text-white"
                />
                <Button
                  size="icon"
                  className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleSend}
                  disabled={isLoading || !prompt.trim()}
                >
                  {isLoading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <SendHorizontal className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleClearChat}
                className="bg-transparent border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Suggestion chips */}
        {messages.length <= 2 && (
          <div className="mt-6 mb-4">
            <p className="text-gray-400 mb-3 flex items-center px-4">
              <Sparkles className="w-4 h-4 mr-2 text-blue-400" />
              Try these suggestions:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.description)}
                  className="group p-4 bg-gray-800/60 hover:bg-gray-800 border border-gray-700 rounded-xl transition-all duration-300 text-left flex flex-col h-full hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:-translate-y-1"
                >
                  <div className="flex items-center mb-2">
                    <div className="mr-3 p-2 rounded-lg bg-gray-900/50">
                      {suggestion.icon}
                    </div>
                    <h3 className="font-medium text-white">{suggestion.title}</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                    {suggestion.description}
                  </p>
                  <div className="mt-auto flex items-center text-blue-400 text-sm font-medium">
                    Try this
                    <ChevronRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scroll to top button */}
        {messages.length > 4 && (
          <Button
            size="icon"
            onClick={() => document.getElementById('chat-container')?.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            <MoveUp className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default GraphicDesignerBot;
