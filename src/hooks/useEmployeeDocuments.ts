import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_FILE_SIZE = 1048576; // 1MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  category: string | null;
  description: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  uploader?: {
    full_name: string | null;
  };
}

interface UploadDocumentParams {
  file: File;
  category?: string;
  description?: string;
}

export function useEmployeeDocuments(employeeId: string | undefined) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  // Fetch documents for the employee
  const { data: documents, isLoading } = useQuery({
    queryKey: ["employee-documents", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];

      const { data, error } = await supabase
        .from("employee_documents")
        .select(`
          *,
          uploader:uploaded_by(full_name)
        `)
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching documents:", error);
        throw error;
      }

      return (data || []) as unknown as EmployeeDocument[];
    },
    enabled: !!employeeId,
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, category, description }: UploadDocumentParams) => {
      if (!employeeId) throw new Error("Employee ID is required");

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("Arquivo muito grande. Tamanho máximo: 1MB");
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error("Tipo de arquivo não permitido. Use PDF, JPEG, PNG ou Word.");
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Generate unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${employeeId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("employee-documents")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw new Error("Erro ao fazer upload do arquivo");
      }

      // Insert record in database - store only the path, not full URL
      const { error: dbError } = await supabase
        .from("employee_documents")
        .insert({
          employee_id: employeeId,
          file_name: file.name,
          file_url: filePath, // Store only the path for signed URL generation
          file_type: file.type,
          file_size: file.size,
          category: category || null,
          description: description || null,
          uploaded_by: user.id,
        });

      if (dbError) {
        // Try to clean up the uploaded file
        await supabase.storage.from("employee-documents").remove([filePath]);
        console.error("Database insert error:", dbError);
        throw new Error("Erro ao salvar informações do documento");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-documents", employeeId] });
      toast.success("Documento enviado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      // Get the document to find the file path
      const { data: doc, error: fetchError } = await supabase
        .from("employee_documents")
        .select("file_url, employee_id")
        .eq("id", documentId)
        .single();

      if (fetchError) throw fetchError;

      // Extract file path from URL
      const fileUrl = (doc as any)?.file_url as string;
      if (fileUrl) {
        const urlParts = fileUrl.split("/employee-documents/");
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          // Delete from storage
          await supabase.storage.from("employee-documents").remove([filePath]);
        }
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from("employee_documents")
        .delete()
        .eq("id", documentId);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-documents", employeeId] });
      toast.success("Documento excluído com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Delete error:", error);
      toast.error("Erro ao excluir documento");
    },
  });

  const uploadDocument = async (params: UploadDocumentParams) => {
    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync(params);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = (documentId: string) => {
    deleteMutation.mutate(documentId);
  };

  return {
    documents: documents || [],
    isLoading,
    isUploading,
    isDeleting: deleteMutation.isPending,
    uploadDocument,
    deleteDocument,
  };
}
