
import React, { useState, useEffect } from "react";

interface TypingEffectProps {
  text: string;
  typingSpeed?: number;
}

const TypingEffect: React.FC<TypingEffectProps> = ({ 
  text, 
  typingSpeed = 3000 // Set to 3 seconds total animation time
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText("");
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  useEffect(() => {
    if (text.length === 0) return;
    
    // Calculate time per character based on total animation time
    const timePerChar = typingSpeed / text.length;
    
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, timePerChar);
      
      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, text, typingSpeed]);

  return (
    <p className="whitespace-pre-wrap">
      {displayedText}
      {!isComplete && (
        <span className="inline-block w-1 h-4 ml-1 bg-[#FAF7F0] animate-pulse"></span>
      )}
    </p>
  );
};

export default TypingEffect;
