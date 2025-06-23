"use client";

import * as React from "react";
import { Save, MessageSquare, Clock, Tag, Search, Filter } from "lucide-react";
import { AutosizeTextarea } from "./autosize-textarea";
import { LoadingButton } from "./loading-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TradingNote {
  id: string;
  content: string;
  tags: string[];
  category: "trade" | "analysis" | "strategy" | "market" | "personal";
  priority: "low" | "medium" | "high";
  symbol?: string;
  createdAt: Date;
  updatedAt: Date;
  archived?: boolean;
}

interface TradingNotesProps {
  symbol?: string;
  onSave?: (note: Omit<TradingNote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onLoad?: () => Promise<TradingNote[]>;
  className?: string;
  autoSave?: boolean;
  maxLength?: number;
  showHistory?: boolean;
}

const TradingNotes = ({
  symbol,
  onSave,
  onLoad,
  className,
  autoSave = false,
  maxLength = 2000,
  showHistory = true,
}: TradingNotesProps) => {
  const [content, setContent] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [currentTag, setCurrentTag] = React.useState("");
  const [category, setCategory] = React.useState<TradingNote['category']>("trade");
  const [priority, setPriority] = React.useState<TradingNote['priority']>("medium");
  const [isLoading, setIsLoading] = React.useState(false);
  const [notes, setNotes] = React.useState<TradingNote[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterCategory, setFilterCategory] = React.useState<string>("all");
  const [filterPriority, setFilterPriority] = React.useState<string>("all");

  // Mock notes for demo
  const mockNotes: TradingNote[] = [
    {
      id: "1",
      content: "Strong bullish momentum on AAPL. Broke through resistance at $185. Consider increasing position size.",
      tags: ["bullish", "resistance", "momentum"],
      category: "analysis",
      priority: "high",
      symbol: "AAPL",
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: "2",
      content: "Market showing signs of consolidation. Watch for volume patterns before next move.",
      tags: ["consolidation", "volume", "market"],
      category: "market",
      priority: "medium",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      id: "3",
      content: "New strategy: RSI divergence + volume confirmation. Backtest shows 65% win rate.",
      tags: ["RSI", "divergence", "strategy"],
      category: "strategy",
      priority: "high",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    }
  ];

  React.useEffect(() => {
    if (showHistory) {
      loadNotes();
    }
  }, [showHistory]);

  const loadNotes = async () => {
    try {
      if (onLoad) {
        const loadedNotes = await onLoad();
        setNotes(loadedNotes);
      } else {
        // Use mock data
        setNotes(mockNotes);
      }
    } catch (error) {
      console.error("Failed to load notes:", error);
      setNotes(mockNotes);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      const note: Omit<TradingNote, 'id' | 'createdAt' | 'updatedAt'> = {
        content: content.trim(),
        tags,
        category,
        priority,
        symbol,
      };

      if (onSave) {
        await onSave(note);
      }

      // Add to local state for demo
      const newNote: TradingNote = {
        ...note,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setNotes(prev => [newNote, ...prev]);
      
      // Reset form
      setContent("");
      setTags([]);
      setCurrentTag("");
      setCategory("trade");
      setPriority("medium");
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags(prev => [...prev, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSave();
    } else if (e.key === "Enter" && e.target === e.currentTarget) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchQuery || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = filterCategory === "all" || note.category === filterCategory;
    const matchesPriority = filterPriority === "all" || note.priority === filterPriority;
    const matchesSymbol = !symbol || note.symbol === symbol;
    
    return matchesSearch && matchesCategory && matchesPriority && matchesSymbol;
  });

  const getCategoryColor = (cat: TradingNote['category']) => {
    const colors = {
      trade: "bg-blue-100 text-blue-800",
      analysis: "bg-green-100 text-green-800",
      strategy: "bg-purple-100 text-purple-800",
      market: "bg-orange-100 text-orange-800",
      personal: "bg-gray-100 text-gray-800",
    };
    return colors[cat];
  };

  const getPriorityColor = (pri: TradingNote['priority']) => {
    const colors = {
      low: "bg-gray-100 text-gray-600",
      medium: "bg-yellow-100 text-yellow-700",
      high: "bg-red-100 text-red-700",
    };
    return colors[pri];
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Note Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Trading Notes {symbol && `- ${symbol}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note-content">Note Content</Label>
            <AutosizeTextarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your trading note... (Ctrl+Enter to save)"
              maxLength={maxLength}
              minHeight={80}
              maxHeight={200}
              onKeyDown={handleKeyPress}
            />
            {maxLength && (
              <div className="text-xs text-muted-foreground text-right">
                {content.length}/{maxLength}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trade">Trade</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                  <SelectItem value="strategy">Strategy</SelectItem>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Add Tag</Label>
              <div className="flex gap-2">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  placeholder="Enter tag..."
                  onKeyDown={handleKeyPress}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!currentTag.trim()}
                >
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <LoadingButton
              loading={isLoading}
              loadingText="Saving..."
              onClick={handleSave}
              disabled={!content.trim()}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Note
            </LoadingButton>
          </div>
        </CardContent>
      </Card>

      {/* Notes History */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Note History ({filteredNotes.length})
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notes..."
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="trade">Trade</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                    <SelectItem value="strategy">Strategy</SelectItem>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Notes List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery || filterCategory !== "all" || filterPriority !== "all" 
                    ? "No notes match your filters" 
                    : "No notes yet. Create your first trading note above!"
                  }
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <div key={note.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(note.category)}>
                          {note.category}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(note.priority)}>
                          {note.priority}
                        </Badge>
                        {note.symbol && (
                          <Badge variant="outline">{note.symbol}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(note.createdAt, "MMM d, HH:mm")}
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed">{note.content}</p>

                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {note.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export { TradingNotes, type TradingNote };