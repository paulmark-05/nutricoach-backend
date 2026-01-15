import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertMeal } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useMeals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: meals, isLoading } = useQuery({
    queryKey: [api.meals.list.path],
    queryFn: async () => {
      const res = await fetch(api.meals.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch meals");
      return api.meals.list.responses[200].parse(await res.json());
    },
  });

  const createMeal = useMutation({
    mutationFn: async (data: InsertMeal) => {
      const res = await fetch(api.meals.create.path, {
        method: api.meals.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to log meal");
      return api.meals.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      toast({
        title: "Yummy!",
        description: "Meal logged successfully.",
        className: "bg-pastel-blue border-pastel-blue-dark text-slate-800",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMeal = useMutation({
    mutationFn: async (id: number) => {
      const url = api.meals.delete.path.replace(":id", String(id));
      const res = await fetch(url, { method: api.meals.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete meal");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      toast({ title: "Deleted", description: "Meal removed from log." });
    },
  });

  const analyzeMeal = useMutation({
    mutationFn: async (data: { text?: string; image?: string }) => {
      const res = await fetch(api.meals.analyze.path, {
        method: api.meals.analyze.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to analyze meal");
      return api.meals.analyze.responses[200].parse(await res.json());
    },
  });

  return {
    meals,
    isLoading,
    createMeal: createMeal.mutate,
    isCreating: createMeal.isPending,
    deleteMeal: deleteMeal.mutate,
    isDeleting: deleteMeal.isPending,
    analyzeMeal: analyzeMeal.mutateAsync,
    isAnalyzing: analyzeMeal.isPending,
  };
}
