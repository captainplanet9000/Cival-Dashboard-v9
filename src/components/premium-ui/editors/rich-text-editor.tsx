'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Editor, EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'

import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  CheckSquare,
  Undo,
  Redo,
  Type,
  TrendingUp,
  DollarSign,
  Calendar,
  Hash,
  Save,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content?: string
  onUpdate?: (content: string) => void
  placeholder?: string
  className?: string
  editable?: boolean
  minimal?: boolean
  tradingMode?: boolean
  autosave?: boolean
  autosaveDelay?: number
  onSave?: (content: string) => void
}

export function RichTextEditor({
  content = '',
  onUpdate,
  placeholder = 'Start writing...',
  className,
  editable = true,
  minimal = false,
  tradingMode = false,
  autosave = false,
  autosaveDelay = 2000,
  onSave
}: RichTextEditorProps) {
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [lastSaved, setLastSaved] = useState<Date>()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-2 hover:text-primary/80',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML()
      onUpdate?.(newContent)
      setHasUnsavedChanges(true)
    },
  })

  // Auto-save functionality
  useEffect(() => {
    if (autosave && hasUnsavedChanges && editor) {
      const timer = setTimeout(() => {
        const content = editor.getHTML()
        onSave?.(content)
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
      }, autosaveDelay)

      return () => clearTimeout(timer)
    }
  }, [editor, hasUnsavedChanges, autosave, autosaveDelay, onSave])

  const handleSave = useCallback(() => {
    if (editor) {
      const content = editor.getHTML()
      onSave?.(content)
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    }
  }, [editor, onSave])

  const setLink = useCallback(() => {
    if (!editor) return

    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    }

    setLinkUrl('')
    setIsLinkPopoverOpen(false)
  }, [editor, linkUrl])

  const addTable = useCallback(() => {
    if (!editor) return
    
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  // Trading-specific quick inserts
  const insertTradingSymbol = useCallback((symbol: string) => {
    if (!editor) return
    editor.chain().focus().insertContent(`<strong>${symbol}</strong> `).run()
  }, [editor])

  const insertPrice = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertContent('<strong>$0.00</strong> ').run()
  }, [editor])

  const insertDate = useCallback(() => {
    if (!editor) return
    const today = new Date().toLocaleDateString()
    editor.chain().focus().insertContent(`<em>${today}</em> `).run()
  }, [editor])

  if (!editor) {
    return null
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false, 
    children, 
    tooltip 
  }: {
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    children: React.ReactNode
    tooltip?: string
  }) => (
    <Toggle
      size="sm"
      pressed={isActive}
      onPressedChange={onClick}
      disabled={disabled}
      className="h-8 w-8 p-0"
      title={tooltip}
    >
      {children}
    </Toggle>
  )

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Toolbar */}
      {!minimal && (
        <div className="border-b p-2">
          <div className="flex flex-wrap items-center gap-1">
            {/* Text Formatting */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                tooltip="Bold"
              >
                <Bold className="h-4 w-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                tooltip="Italic"
              >
                <Italic className="h-4 w-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive('strike')}
                tooltip="Strikethrough"
              >
                <Strikethrough className="h-4 w-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleCode().run()}
                isActive={editor.isActive('code')}
                tooltip="Code"
              >
                <Code className="h-4 w-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                isActive={editor.isActive('highlight')}
                tooltip="Highlight"
              >
                <Highlighter className="h-4 w-4" />
              </ToolbarButton>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Headings */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                isActive={editor.isActive('heading', { level: 1 })}
                tooltip="Heading 1"
              >
                <Heading1 className="h-4 w-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive('heading', { level: 2 })}
                tooltip="Heading 2"
              >
                <Heading2 className="h-4 w-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                isActive={editor.isActive('heading', { level: 3 })}
                tooltip="Heading 3"
              >
                <Heading3 className="h-4 w-4" />
              </ToolbarButton>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Lists */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                tooltip="Bullet List"
              >
                <List className="h-4 w-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                tooltip="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                isActive={editor.isActive('taskList')}
                tooltip="Task List"
              >
                <CheckSquare className="h-4 w-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                tooltip="Quote"
              >
                <Quote className="h-4 w-4" />
              </ToolbarButton>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Alignment */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                isActive={editor.isActive({ textAlign: 'left' })}
                tooltip="Align Left"
              >
                <AlignLeft className="h-4 w-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                isActive={editor.isActive({ textAlign: 'center' })}
                tooltip="Align Center"
              >
                <AlignCenter className="h-4 w-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                isActive={editor.isActive({ textAlign: 'right' })}
                tooltip="Align Right"
              >
                <AlignRight className="h-4 w-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                isActive={editor.isActive({ textAlign: 'justify' })}
                tooltip="Justify"
              >
                <AlignJustify className="h-4 w-4" />
              </ToolbarButton>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Link & Table */}
            <div className="flex items-center gap-1">
              <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
                <PopoverTrigger asChild>
                  <Toggle
                    size="sm"
                    pressed={editor.isActive('link')}
                    className="h-8 w-8 p-0"
                    title="Link"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Toggle>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <Label htmlFor="link-url">URL</Label>
                    <Input
                      id="link-url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setLink()
                        }
                      }}
                    />
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          editor.chain().focus().unsetLink().run()
                          setIsLinkPopoverOpen(false)
                        }}
                      >
                        <Unlink className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                      <Button size="sm" onClick={setLink}>
                        Set Link
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <ToolbarButton
                onClick={addTable}
                tooltip="Insert Table"
              >
                <TableIcon className="h-4 w-4" />
              </ToolbarButton>
            </div>

            {/* Trading-specific tools */}
            {tradingMode && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-1">
                  <ToolbarButton
                    onClick={() => insertTradingSymbol('BTCUSD')}
                    tooltip="Insert Symbol"
                  >
                    <Hash className="h-4 w-4" />
                  </ToolbarButton>
                  
                  <ToolbarButton
                    onClick={insertPrice}
                    tooltip="Insert Price"
                  >
                    <DollarSign className="h-4 w-4" />
                  </ToolbarButton>
                  
                  <ToolbarButton
                    onClick={insertDate}
                    tooltip="Insert Date"
                  >
                    <Calendar className="h-4 w-4" />
                  </ToolbarButton>
                </div>
              </>
            )}

            <Separator orientation="vertical" className="h-6" />

            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                tooltip="Undo"
              >
                <Undo className="h-4 w-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                tooltip="Redo"
              >
                <Redo className="h-4 w-4" />
              </ToolbarButton>
            </div>

            {/* Save Button */}
            {onSave && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  size="sm"
                  variant={hasUnsavedChanges ? "default" : "outline"}
                  onClick={handleSave}
                  className="h-8"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </>
            )}
          </div>

          {/* Save Status */}
          {(autosave || onSave) && (
            <div className="mt-2 text-xs text-muted-foreground">
              {hasUnsavedChanges && autosave && (
                <span>Auto-saving...</span>
              )}
              {lastSaved && !hasUnsavedChanges && (
                <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Editor */}
      <CardContent className="p-4">
        <EditorContent 
          editor={editor} 
          className={cn(
            'prose prose-sm max-w-none focus:outline-none',
            'prose-headings:scroll-m-20 prose-headings:tracking-tight',
            'prose-h1:text-2xl prose-h1:font-bold',
            'prose-h2:text-xl prose-h2:font-semibold',
            'prose-h3:text-lg prose-h3:font-semibold',
            'prose-p:leading-7',
            'prose-blockquote:border-l-4 prose-blockquote:border-muted prose-blockquote:pl-6 prose-blockquote:italic',
            'prose-ul:my-6 prose-ul:ml-6 prose-ul:list-disc',
            'prose-ol:my-6 prose-ol:ml-6 prose-ol:list-decimal',
            'prose-li:mt-2',
            'prose-table:border-collapse prose-table:border prose-table:w-full',
            'prose-th:border prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-bold prose-th:bg-muted',
            'prose-td:border prose-td:px-4 prose-td:py-2',
            '[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[200px]',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0'
          )}
        />
      </CardContent>
    </Card>
  )
}

// Trading-specific rich text editor
export function TradingNotesEditor(props: Omit<RichTextEditorProps, 'tradingMode'>) {
  return (
    <RichTextEditor
      {...props}
      tradingMode={true}
      placeholder="Add your trading notes, analysis, and observations..."
    />
  )
}

// Minimal editor for quick notes
export function MinimalEditor(props: Omit<RichTextEditorProps, 'minimal'>) {
  return (
    <RichTextEditor
      {...props}
      minimal={true}
      placeholder="Quick note..."
    />
  )
}

export default RichTextEditor