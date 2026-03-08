import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UpdateCommentParams {
  commentId: string;
  pdiId: string;
  content: string;
  previousContent: string;
  editHistory: Array<{ content: string; edited_at: string }>;
}

export const useUpdatePdiComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ commentId, content, previousContent, editHistory }: UpdateCommentParams) => {
      const newHistory = [
        ...editHistory,
        { content: previousContent, edited_at: new Date().toISOString() },
      ];

      const { data, error } = await supabase
        .from("pdi_comments")
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString(),
          edit_history: newHistory,
        })
        .eq("id", commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pdi", variables.pdiId] });
      toast({
        title: "Comentário atualizado",
        description: "Seu comentário foi editado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao editar comentário",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
