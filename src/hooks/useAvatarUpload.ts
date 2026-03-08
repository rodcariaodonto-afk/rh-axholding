import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const MAX_INPUT_SIZE = 10 * 1024 * 1024; // 10MB (será comprimido)
const MAX_OUTPUT_SIZE = 1024; // Max output dimension
const OUTPUT_QUALITY = 0.85;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface UseAvatarUploadOptions {
  userId: string;
  onSuccess?: (url: string) => void;
}

const resizeImage = (file: File, maxSize: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      let { width, height } = img;
      
      // Calculate new dimensions maintaining aspect ratio
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Erro ao criar contexto do canvas"));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Erro ao processar imagem"));
          }
        },
        "image/jpeg",
        OUTPUT_QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Erro ao carregar imagem"));
    };
    img.src = URL.createObjectURL(file);
  });
};

export function useAvatarUpload({ userId, onSuccess }: UseAvatarUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.");
      return false;
    }

    // Check file size (before resize)
    if (file.size > MAX_INPUT_SIZE) {
      toast.error("Arquivo muito grande. Tamanho máximo: 10MB.");
      return false;
    }

    return true;
  };

  const uploadAvatar = async (file: File) => {
    if (!userId) {
      toast.error("Usuário não autenticado.");
      return null;
    }

    if (!validateFile(file)) return null;

    setIsUploading(true);

    try {
      // Resize and compress image
      const resizedBlob = await resizeImage(file, MAX_OUTPUT_SIZE);
      
      // Generate unique filename (always .jpg since we convert to JPEG)
      const fileName = `${userId}/avatar.jpg`;

      // Delete existing avatar first (if any)
      await supabase.storage.from("avatars").remove([fileName]);

      // Upload resized avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, resizedBlob, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Erro ao fazer upload da foto.");
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update employee photo_url
      const { error: updateError } = await supabase
        .from("employees")
        .update({ photo_url: photoUrl })
        .eq("id", userId);

      if (updateError) {
        console.error("Update error:", updateError);
        toast.error("Erro ao atualizar foto no perfil.");
        return null;
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ["employee", userId] });
      await queryClient.invalidateQueries({ queryKey: ["employees"] });

      toast.success("Foto atualizada com sucesso!");
      onSuccess?.(photoUrl);
      return photoUrl;
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Erro inesperado ao fazer upload.");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!userId) return;

    setIsUploading(true);

    try {
      // List files in user's folder
      const { data: files } = await supabase.storage
        .from("avatars")
        .list(userId);

      if (files && files.length > 0) {
        const filePaths = files.map((f) => `${userId}/${f.name}`);
        await supabase.storage.from("avatars").remove(filePaths);
      }

      // Clear photo_url in employees table
      const { error: updateError } = await supabase
        .from("employees")
        .update({ photo_url: null })
        .eq("id", userId);

      if (updateError) {
        toast.error("Erro ao remover foto.");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["employee", userId] });
      await queryClient.invalidateQueries({ queryKey: ["employees"] });

      toast.success("Foto removida com sucesso!");
    } catch (error) {
      console.error("Remove avatar error:", error);
      toast.error("Erro ao remover foto.");
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadAvatar,
    removeAvatar,
    isUploading,
  };
}
