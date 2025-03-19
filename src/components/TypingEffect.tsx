
import React, { useState, useEffect } from "react";

interface TypingEffectProps {
  text: string;
  typingSpeed?: number;
}

const TypingEffect: React.FC<TypingEffectProps> = ({ 
  text, 
  typingSpeed = 15 // Changed from 30 to 15 to make it faster
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
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, typingSpeed);
      
      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, text, typingSpeed]);

  return (
    <p className="whitespace-pre-wrap">
      {displayedText}
      {!isComplete && (
        <span className="inline-block w-1 h-4 ml-1 bg-blue-400 animate-pulse"></span>
      )}
    </p>
  );
};

export default TypingEffect;
