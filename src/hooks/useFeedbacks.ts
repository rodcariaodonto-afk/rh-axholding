import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mockFeedbacks } from "@/mocks/feedbacksData";

export interface Feedback {
  id: string;
  sender_id: string;
  receiver_id: string;
  feedback_type: "positive" | "neutral" | "negative";
  message: string | null;
  created_at: string;
  sender?: { full_name: string | null; email: string };
  receiver?: { full_name: string | null; email: string };
}

export const useFeedbacks = (userId?: string) => {
  return useQuery({
    queryKey: ["feedbacks", userId],
    queryFn: async () => {
      if (!userId) return { sent: [], received: [] };

      // Fetch sent feedbacks
      const { data: sentData, error: sentError } = await supabase
        .from("feedbacks")
        .select(`
          id, sender_id, receiver_id, feedback_type, message, created_at,
          receiver:employees!feedbacks_receiver_id_fkey(full_name, email)
        `)
        .eq("sender_id", userId)
        .order("created_at", { ascending: false });

      if (sentError) throw sentError;

      // Fetch received feedbacks
      const { data: receivedData, error: receivedError } = await supabase
        .from("feedbacks")
        .select(`
          id, sender_id, receiver_id, feedback_type, message, created_at,
          sender:employees!feedbacks_sender_id_fkey(full_name, email)
        `)
        .eq("receiver_id", userId)
        .order("created_at", { ascending: false });

      if (receivedError) throw receivedError;

      return {
        sent: sentData as Feedback[],
        received: receivedData as Feedback[],
      };
    },
    enabled: !!userId,
  });
};

export const useAllFeedbacks = (isDemoMode = false) => {
  return useQuery({
    queryKey: ["all-feedbacks", isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        return mockFeedbacks;
      }

      const { data, error } = await supabase
        .from("feedbacks")
        .select(`
          id, sender_id, receiver_id, feedback_type, message, created_at,
          sender:employees!feedbacks_sender_id_fkey(full_name, email),
          receiver:employees!feedbacks_receiver_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Feedback[];
    },
  });
};

export const getFeedbackScore = (type: "positive" | "neutral" | "negative"): number => {
  switch (type) {
    case "positive": return 10;
    case "neutral": return 5;
    case "negative": return 0;
  }
};

export const calculateAverageScore = (feedbacks: Feedback[]): number | null => {
  if (feedbacks.length === 0) return null;
  const total = feedbacks.reduce((sum, f) => sum + getFeedbackScore(f.feedback_type), 0);
  return total / feedbacks.length;
};
