import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Send, Pencil, X, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCreatePdiComment } from "@/hooks/useCreatePdiComment";
import { useUpdatePdiComment } from "@/hooks/useUpdatePdiComment";
import { useAuth } from "@/hooks/useAuth";

interface EditHistoryItem {
  content: string;
  edited_at: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
  edit_history: EditHistoryItem[] | unknown;
  user: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

interface PdiCommentsSectionProps {
  pdiId: string;
  comments: Comment[];
}

export const PdiCommentsSection = ({ pdiId, comments }: PdiCommentsSectionProps) => {
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const createComment = useCreatePdiComment();
  const updateComment = useUpdatePdiComment();
  const { user } = useAuth();

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    createComment.mutate(
      { pdiId, content: newComment },
      { onSuccess: () => setNewComment("") }
    );
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleSaveEdit = (comment: Comment) => {
    if (!editContent.trim() || editContent === comment.content) {
      handleCancelEdit();
      return;
    }
    updateComment.mutate(
      {
        commentId: comment.id,
        pdiId,
        content: editContent,
        previousContent: comment.content,
        editHistory: (comment.edit_history as EditHistoryItem[]) || [],
      },
      { onSuccess: handleCancelEdit }
    );
  };

  const sortedComments = [...(comments || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comentários</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New comment input */}
        <div className="flex gap-2">
          <Textarea
            placeholder="Adicionar um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!newComment.trim() || createComment.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Comments list */}
        <ScrollArea className="h-[300px]">
          {sortedComments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
          ) : (
            <div className="space-y-4">
              {sortedComments.map((comment) => (
                <div key={comment.id} className="border-b border-border pb-3 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-sm">
                        {comment.user?.full_name || comment.user?.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                      {user?.id === comment.user?.id && editingId !== comment.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleStartEdit(comment)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {comment.updated_at && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-muted-foreground cursor-help">
                          (editado)
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <div className="text-xs space-y-1">
                          <p className="font-medium">Histórico de edições:</p>
                          {(comment.edit_history as EditHistoryItem[])?.map((edit, idx) => (
                            <div key={idx} className="border-t border-border pt-1">
                              <p className="text-muted-foreground">
                                {format(new Date(edit.edited_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </p>
                              <p className="truncate">{edit.content}</p>
                            </div>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {editingId === comment.id ? (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[60px] resize-none"
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(comment)}
                          disabled={updateComment.isPending}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
