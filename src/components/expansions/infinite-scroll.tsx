"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfiniteScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  loader?: React.ReactNode;
  endMessage?: React.ReactNode;
  threshold?: number;
  children: React.ReactNode;
}

const InfiniteScroll = React.forwardRef<HTMLDivElement, InfiniteScrollProps>(
  ({
    className,
    children,
    hasMore,
    isLoading,
    onLoadMore,
    loader,
    endMessage,
    threshold = 100,
    ...props
  }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isFetching, setIsFetching] = React.useState(false);

    React.useImperativeHandle(ref, () => containerRef.current!);

    const handleScroll = React.useCallback(() => {
      if (!containerRef.current || !hasMore || isLoading || isFetching) return;

      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      
      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        setIsFetching(true);
        onLoadMore();
      }
    }, [hasMore, isLoading, isFetching, onLoadMore, threshold]);

    React.useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    React.useEffect(() => {
      if (!isLoading) {
        setIsFetching(false);
      }
    }, [isLoading]);

    const defaultLoader = (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );

    const defaultEndMessage = (
      <div className="py-4 text-center text-sm text-muted-foreground">
        No more items to load
      </div>
    );

    return (
      <div
        ref={containerRef}
        className={cn("overflow-auto", className)}
        {...props}
      >
        {children}
        {isLoading && (loader || defaultLoader)}
        {!hasMore && !isLoading && (endMessage || defaultEndMessage)}
      </div>
    );
  }
);

InfiniteScroll.displayName = "InfiniteScroll";

export { InfiniteScroll };