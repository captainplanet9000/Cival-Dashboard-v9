"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TypewriterProps {
  text: string | string[];
  delay?: number;
  speed?: number;
  loop?: boolean;
  cursor?: boolean;
  cursorClassName?: string;
  className?: string;
  onComplete?: () => void;
  onLoopComplete?: (loopCount: number) => void;
}

const Typewriter = ({
  text,
  delay = 0,
  speed = 50,
  loop = false,
  cursor = true,
  cursorClassName,
  className,
  onComplete,
  onLoopComplete,
}: TypewriterProps) => {
  const [displayText, setDisplayText] = React.useState("");
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [currentTextIndex, setCurrentTextIndex] = React.useState(0);
  const [isTyping, setIsTyping] = React.useState(false);
  const [showCursor, setShowCursor] = React.useState(true);
  const [loopCount, setLoopCount] = React.useState(0);

  const textArray = Array.isArray(text) ? text : [text];
  const currentText = textArray[currentTextIndex] || "";

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  React.useEffect(() => {
    if (!isTyping) return;

    if (currentIndex < currentText.length) {
      const timer = setTimeout(() => {
        setDisplayText(currentText.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else {
      // Text is complete
      if (textArray.length > 1 && loop) {
        // Multiple texts with loop
        const timer = setTimeout(() => {
          setCurrentIndex(0);
          setDisplayText("");
          setCurrentTextIndex((prevIndex) => {
            const nextIndex = (prevIndex + 1) % textArray.length;
            if (nextIndex === 0) {
              const newLoopCount = loopCount + 1;
              setLoopCount(newLoopCount);
              onLoopComplete?.(newLoopCount);
            }
            return nextIndex;
          });
        }, 1000);

        return () => clearTimeout(timer);
      } else if (textArray.length > 1) {
        // Multiple texts without loop
        if (currentTextIndex < textArray.length - 1) {
          const timer = setTimeout(() => {
            setCurrentIndex(0);
            setDisplayText("");
            setCurrentTextIndex(currentTextIndex + 1);
          }, 1000);

          return () => clearTimeout(timer);
        } else {
          onComplete?.();
        }
      } else {
        // Single text
        onComplete?.();
      }
    }
  }, [currentIndex, currentText, isTyping, speed, textArray.length, loop, currentTextIndex, loopCount, onComplete, onLoopComplete]);

  React.useEffect(() => {
    if (!cursor) return;

    const cursorTimer = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorTimer);
  }, [cursor]);

  return (
    <span className={cn("inline-block", className)}>
      {displayText}
      {cursor && (
        <span
          className={cn(
            "ml-0.5 inline-block h-[1em] w-0.5 bg-current animate-pulse",
            !showCursor && "opacity-0",
            cursorClassName
          )}
        />
      )}
    </span>
  );
};

export { Typewriter };