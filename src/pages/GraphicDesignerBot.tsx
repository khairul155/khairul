
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
  Bot,
  Upload,
  FileText,
  X
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import TypingEffect from "@/components/TypingEffect";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  role: 'user' | 'bot';
  content: string;
  isTyping?: boolean;
  attachments?: string[];
}

const GraphicDesignerBot = () => {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedFilePreviews, setUploadedFilePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

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
    if (!prompt.trim() && uploadedFiles.length === 0) return;
    
    const fileAttachments = uploadedFiles.length > 0 
      ? uploadedFilePreviews.map(url => `Attached file: ${url}`) 
      : [];
      
    const userMessage = { 
      role: 'user' as const, 
      content: prompt,
      attachments: uploadedFilePreviews 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setPrompt("");
    setIsLoading(true);
    
    // Clear file uploads after sending
    setUploadedFiles([]);
    setUploadedFilePreviews([]);

    try {
      // First add a temporary "typing" message
      setMessages(prev => [...prev, { role: 'bot', content: "", isTyping: true }]);

      // Create enhanced prompt that includes file references if any
      const enhancedPrompt = uploadedFiles.length > 0
        ? `${prompt}\n\n[User has attached ${uploadedFiles.length} reference file(s) to consider]`
        : prompt;

      const { data, error } = await supabase.functions.invoke('graphic-designer-bot', {
        body: { prompt: enhancedPrompt }
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      // Create object URLs for previews
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setUploadedFilePreviews(prev => [...prev, ...newPreviews]);
      
      toast.success(`${newFiles.length} file(s) added`);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
    
    setUploadedFilePreviews(prev => {
      const newPreviews = [...prev];
      // Revoke object URL to avoid memory leaks
      URL.revokeObjectURL(newPreviews[index]);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
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
      content: "Hey Designer! 👋\nHow can I help you today with graphic design ideas and prompts?"
    }]);
  };

  const suggestions = [
    {
      title: "Detailed Vector Prompts",
      description: "I need 15 long, detailed, unique, and popular vector-style image prompts for stock sales. Isolated transparent background, Single object only, No symbols in prompts",
      icon: <ImageIcon className="text-[#E9762B]" />
    },
    {
      title: "Top Microstock Ideas",
      description: "Give me Top 10 rankable ideas which are hot, Trending topics for Microstock.",
      icon: <BrainCircuit className="text-[#E9762B]" />
    },
    {
      title: "Trending Topics",
      description: "Want the top 10 trending Microstock topics?",
      icon: <Sparkles className="text-[#E9762B]" />
    },
    {
      title: "2025 Trending Prompts",
      description: "Give me the 2025 best prompts which are trending now",
      icon: <Wand2 className="text-[#E9762B]" />
    }
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0C0C0C] text-[#E9762B] relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 -left-48 -top-48 bg-[#E9762B]/5 rounded-full mix-blend-overlay filter blur-3xl"></div>
        <div className="absolute w-96 h-96 -right-48 top-1/4 bg-[#E9762B]/10 rounded-full mix-blend-overlay filter blur-3xl"></div>
        <div className="absolute w-96 h-96 left-1/3 -bottom-48 bg-[#E9762B]/5 rounded-full mix-blend-overlay filter blur-3xl"></div>
      </div>

      <div className="flex flex-col w-full h-full px-4 py-6 relative z-10">
        {/* Header - now just with the title, no theme toggle */}
        <div className="flex justify-center items-center mb-6 px-4">
          <h1 className="text-2xl font-bold text-[#E9762B]">Graphic Designer Bot</h1>
        </div>

        {/* Main chat area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-[#0C0C0C]/90 backdrop-blur-lg border border-[#E9762B]/20 rounded-xl">
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
                    <Avatar className="h-8 w-8 bg-[#0C0C0C] border border-[#E9762B]/30">
                      <AvatarFallback className="bg-[#1A1A1A]">
                        <Bot className="h-5 w-5 text-[#E9762B]" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-[#E9762B]/10 border border-[#E9762B]/20 text-[#E9762B]"
                      : "bg-[#1A1A1A] border border-[#E9762B]/10 text-[#E9762B]"
                  }`}
                >
                  {message.isTyping ? (
                    <div className="flex space-x-2 items-center h-6">
                      <div className="w-2 h-2 rounded-full bg-[#E9762B] animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 rounded-full bg-[#E9762B] animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 rounded-full bg-[#E9762B] animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  ) : message.role === 'bot' ? (
                    <TypingEffect text={message.content} />
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.attachments.map((url, i) => (
                            <div key={i} className="relative">
                              {url.toLowerCase().endsWith('.pdf') ? (
                                <div className="flex items-center justify-center w-16 h-16 bg-[#E9762B]/5 rounded-md border border-[#E9762B]/20">
                                  <FileText className="h-8 w-8 text-[#E9762B]" />
                                </div>
                              ) : (
                                <img 
                                  src={url} 
                                  alt="Attachment" 
                                  className="w-16 h-16 object-cover rounded-md border border-[#E9762B]/20" 
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area - Fix the footer space issue */}
          <div className="p-4 border-t border-[#E9762B]/20">
            {uploadedFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {uploadedFilePreviews.map((url, index) => (
                  <div key={index} className="relative group">
                    {url.endsWith('.pdf') ? (
                      <div className="h-14 w-14 flex items-center justify-center bg-[#E9762B]/5 rounded-md border border-[#E9762B]/20">
                        <FileText className="h-6 w-6 text-[#E9762B]" />
                      </div>
                    ) : (
                      <img 
                        src={url} 
                        alt={`Preview ${index}`} 
                        className="h-14 w-14 object-cover rounded-md border border-[#E9762B]/20" 
                      />
                    )}
                    <button 
                      onClick={() => removeFile(index)}
                      className="absolute -top-1 -right-1 bg-[#0C0C0C] rounded-full p-0.5 border border-[#E9762B]/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-[#E9762B]" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me about design ideas, prompts, or trends..."
                  className="resize-none min-h-[60px] pr-12 bg-[#1A1A1A] border-[#E9762B]/20 placeholder:text-[#E9762B]/50 text-[#E9762B]"
                />
                <Button
                  size="icon"
                  className="absolute bottom-1 right-1 bg-[#E9762B] hover:bg-[#E9762B]/80 text-[#0C0C0C]"
                  onClick={handleSend}
                  disabled={isLoading || (!prompt.trim() && uploadedFiles.length === 0)}
                >
                  {isLoading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-[#0C0C0C] border-t-transparent rounded-full"></div>
                  ) : (
                    <SendHorizontal className="h-5 w-5" />
                  )}
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="bg-transparent border-[#E9762B]/20 text-[#E9762B] hover:text-[#E9762B] hover:bg-[#E9762B]/10"
                title="Upload reference files"
              >
                <Upload className="h-5 w-5" />
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  multiple 
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden" 
                />
              </Button>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleClearChat}
                className="bg-transparent border-[#E9762B]/20 text-[#E9762B] hover:text-[#E9762B] hover:bg-[#E9762B]/10"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Suggestion chips - now centered */}
        <div className="mx-auto max-w-4xl w-full mt-6 mb-4">
          <p className="text-[#E9762B]/80 mb-3 flex items-center justify-center">
            <Sparkles className="w-4 h-4 mr-2 text-[#E9762B]" />
            Try these suggestions:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion.description)}
                className="group p-4 bg-[#1A1A1A] hover:bg-[#1A1A1A]/80 border border-[#E9762B]/20 rounded-xl transition-all duration-300 text-left flex flex-col h-full hover:shadow-[0_0_15px_rgba(233,118,43,0.2)] hover:-translate-y-1"
              >
                <div className="flex items-center mb-2">
                  <div className="mr-3 p-2 rounded-lg bg-[#E9762B]/5">
                    {suggestion.icon}
                  </div>
                  <h3 className="font-medium text-[#E9762B]">{suggestion.title}</h3>
                </div>
                <p className="text-sm text-[#E9762B]/70 mb-3 line-clamp-2">
                  {suggestion.description}
                </p>
                <div className="mt-auto flex items-center text-[#E9762B] text-sm font-medium">
                  Try this
                  <ChevronRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Scroll to top button */}
        {messages.length > 4 && (
          <Button
            size="icon"
            onClick={() => document.getElementById('chat-container')?.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 rounded-full bg-[#E9762B] hover:bg-[#E9762B]/80 text-[#0C0C0C] shadow-lg"
          >
            <MoveUp className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default GraphicDesignerBot;
