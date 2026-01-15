import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertRecipe } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useRecipes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recipes, isLoading } = useQuery({
    queryKey: [api.recipes.list.path],
    queryFn: async () => {
      const res = await fetch(api.recipes.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch recipes");
      return api.recipes.list.responses[200].parse(await res.json());
    },
  });

  const generateRecipes = useMutation({
    mutationFn: async (data: { ingredients: string[]; dietaryPreferences?: string }) => {
      const res = await fetch(api.recipes.generate.path, {
        method: api.recipes.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate recipes");
      return api.recipes.generate.responses[200].parse(await res.json());
    },
  });

  const saveRecipe = useMutation({
    mutationFn: async (data: InsertRecipe) => {
      const res = await fetch(api.recipes.save.path, {
        method: api.recipes.save.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save recipe");
      return api.recipes.save.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.recipes.list.path] });
      toast({
        title: "Saved!",
        description: "Recipe added to your collection.",
        className: "bg-pastel-purple border-pastel-purple-dark text-slate-800",
      });
    },
  });

  const deleteRecipe = useMutation({
    mutationFn: async (id: number) => {
      const url = api.recipes.delete.path.replace(":id", String(id));
      const res = await fetch(url, { method: api.recipes.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete recipe");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.recipes.list.path] });
      toast({ title: "Deleted", description: "Recipe removed." });
    },
  });

  return {
    recipes,
    isLoading,
    generateRecipes: generateRecipes.mutateAsync,
    isGenerating: generateRecipes.isPending,
    saveRecipe: saveRecipe.mutate,
    isSaving: saveRecipe.isPending,
    deleteRecipe: deleteRecipe.mutate,
    isDeleting: deleteRecipe.isPending,
  };
}
