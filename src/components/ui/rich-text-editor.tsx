import { useEffect, useMemo, useState, useRef } from "react";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import "@blocknote/core/fonts/inter.css";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  contentClassName?: string;
}

// Convert markdown to BlockNote blocks
async function markdownToBlocks(
  editor: BlockNoteEditor,
  markdown: string
): Promise<PartialBlock[]> {
  try {
    return await editor.tryParseMarkdownToBlocks(markdown);
  } catch {
    return [];
  }
}

// Convert BlockNote blocks to markdown
async function blocksToMarkdown(editor: BlockNoteEditor): Promise<string> {
  try {
    return await editor.blocksToMarkdownLossy(editor.document);
  } catch {
    return "";
  }
}

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Digite aqui...",
  readOnly = false,
  className,
  contentClassName,
}: RichTextEditorProps) {
  const { resolvedTheme } = useTheme();
  const [isReady, setIsReady] = useState(false);
  const editorRef = useRef<BlockNoteEditor | null>(null);
  const lastExternalValueRef = useRef<string>(value);
  const isInternalChangeRef = useRef(false);

  // Create editor instance once
  const editor = useMemo(() => {
    const newEditor = BlockNoteEditor.create({
      domAttributes: {
        editor: {
          class: "blocknote-editor",
        },
      },
    });
    editorRef.current = newEditor;
    return newEditor;
  }, []);

  // Initialize content from markdown on mount
  useEffect(() => {
    let mounted = true;

    const initContent = async () => {
      if (!value) {
        if (mounted) {
          setIsReady(true);
        }
        return;
      }

      const blocks = await markdownToBlocks(editor, value);

      if (mounted && blocks.length > 0) {
        editor.replaceBlocks(editor.document, blocks);
      }

      if (mounted) {
        lastExternalValueRef.current = value;
        setIsReady(true);
      }
    };

    initContent();

    return () => {
      mounted = false;
    };
  }, []); // Only run once on mount

  // Handle external value changes (e.g., from form.setValue)
  useEffect(() => {
    // Skip if not ready, if it's an internal change, or if value hasn't changed
    if (!isReady || isInternalChangeRef.current || value === lastExternalValueRef.current) {
      isInternalChangeRef.current = false;
      return;
    }

    // Value changed externally - update editor content
    const updateEditorContent = async () => {
      if (!value) {
        // Clear editor if value is empty
        const emptyBlock = { type: "paragraph" as const, content: [] };
        editor.replaceBlocks(editor.document, [emptyBlock]);
        lastExternalValueRef.current = "";
        return;
      }

      const blocks = await markdownToBlocks(editor, value);

      if (blocks.length > 0) {
        editor.replaceBlocks(editor.document, blocks);
      }

      lastExternalValueRef.current = value;
    };

    updateEditorContent();
  }, [value, isReady, editor]);

  // Handle content changes from the editor
  const handleChange = async () => {
    if (!editor || !onChange || readOnly) return;

    const markdown = await blocksToMarkdown(editor);

    // Mark as internal change to prevent re-render loop
    isInternalChangeRef.current = true;
    lastExternalValueRef.current = markdown;

    onChange(markdown);
  };

  // Determine theme
  const blockNoteTheme = useMemo((): "dark" | "light" => {
    return resolvedTheme === "dark" ? "dark" : "light";
  }, [resolvedTheme]);

  if (!isReady) {
    return (
      <div className={cn(
        "min-h-[200px] rounded-md border border-input bg-background p-3 animate-pulse",
        className
      )}>
        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className={cn(
      "rich-text-editor rounded-md border border-input bg-background overflow-hidden min-h-[200px]",
      readOnly && "opacity-70",
      className
    )}>
      <div className={contentClassName}>
        <BlockNoteView
          editor={editor}
          theme={blockNoteTheme}
          editable={!readOnly}
          onChange={handleChange}
          data-placeholder={placeholder}
        />
      </div>
    </div>
  );
}
