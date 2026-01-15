import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertProfile } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: [api.profile.get.path],
    queryFn: async () => {
      const res = await fetch(api.profile.get.path, { credentials: "include" });
      if (res.status === 404) return null;
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return api.profile.get.responses[200].parse(await res.json());
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (data: InsertProfile) => {
      const res = await fetch(api.profile.update.path, {
        method: api.profile.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update profile");
      }
      return api.profile.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.profile.get.path] });
      toast({
        title: "Success",
        description: "Profile updated successfully!",
        className: "bg-pastel-green border-pastel-green-dark text-slate-800",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const shareCard = useQuery({
    queryKey: [api.social.shareCard.path],
    queryFn: async () => {
      const res = await fetch(api.social.shareCard.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to generate share card");
      return api.social.shareCard.responses[200].parse(await res.json());
    },
    enabled: false, // Don't run automatically
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfile.mutate,
    isUpdating: updateProfile.isPending,
    generateShareCard: shareCard.refetch,
    isGeneratingCard: shareCard.isLoading,
  };
}
