import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertCheatMeal } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useCheatMeals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cheatMeals, isLoading } = useQuery({
    queryKey: [api.cheatMeals.list.path],
    queryFn: async () => {
      const res = await fetch(api.cheatMeals.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch cheat meals");
      return api.cheatMeals.list.responses[200].parse(await res.json());
    },
  });

  const suggestAlternative = useMutation({
    mutationFn: async (data: { craving: string }) => {
      const res = await fetch(api.cheatMeals.suggestAlternative.path, {
        method: api.cheatMeals.suggestAlternative.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to get suggestion");
      return api.cheatMeals.suggestAlternative.responses[200].parse(await res.json());
    },
  });

  const logCheatMeal = useMutation({
    mutationFn: async (data: InsertCheatMeal) => {
      const res = await fetch(api.cheatMeals.create.path, {
        method: api.cheatMeals.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to log cheat meal");
      return api.cheatMeals.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.cheatMeals.list.path] });
      toast({
        title: "Logged",
        description: "Cheat meal tracked. Don't worry, balance is key!",
        className: "bg-pastel-pink border-pastel-pink-dark text-slate-800",
      });
    },
  });

  const deleteCheatMeal = useMutation({
    mutationFn: async (id: number) => {
      const url = api.cheatMeals.delete.path.replace(":id", String(id));
      const res = await fetch(url, { method: api.cheatMeals.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete cheat meal");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.cheatMeals.list.path] });
    },
  });

  return {
    cheatMeals,
    isLoading,
    suggestAlternative: suggestAlternative.mutateAsync,
    isSuggesting: suggestAlternative.isPending,
    logCheatMeal: logCheatMeal.mutate,
    isLogging: logCheatMeal.isPending,
    deleteCheatMeal: deleteCheatMeal.mutate,
  };
}
