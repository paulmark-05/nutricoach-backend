import React, { useState } from "react";
import LayoutShell from "@/components/layout-shell";
import { useRecipes } from "@/hooks/use-recipes";
import { useMeals } from "@/hooks/use-meals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, ChefHat, Sparkles, Plus, Trash2, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Recipes() {
  const { recipes, isLoading, generateRecipes, isGenerating, saveRecipe, deleteRecipe } = useRecipes();
  const { createMeal } = useMeals();
  
  const [ingredients, setIngredients] = useState("");
  const [generated, setGenerated] = useState<any[]>([]);

  const handleGenerate = async () => {
    if (!ingredients) return;
    try {
      const ingredientList = ingredients.split(",").map(i => i.trim()).filter(Boolean);
      const result = await generateRecipes({ ingredients: ingredientList });
      setGenerated(result);
    } catch (err) {
      // toast handled in hook
    }
  };

  const handleSave = (recipe: any) => {
    saveRecipe({
      title: recipe.title,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      macros: recipe.macros,
      isSaved: true
    });
  };

  const handleMadeThis = (recipe: any) => {
    createMeal({
      description: recipe.title,
      calories: recipe.macros.calories,
      protein: recipe.macros.protein,
      carbs: recipe.macros.carbs,
      fats: recipe.macros.fats,
    });
  };

  return (
    <LayoutShell>
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">AI Chef</h1>
        <p className="text-slate-500 mb-8">Got ingredients? Let our AI invent a recipe for you.</p>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <Input 
              placeholder="Enter ingredients (e.g., eggs, spinach, feta)" 
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              className="rounded-xl border-slate-200 h-12"
            />
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !ingredients}
            className="rounded-xl bg-pastel-purple text-pastel-purple-dark hover:bg-pastel-purple-dark hover:text-white h-12 px-8 w-full md:w-auto"
          >
            {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 w-4 h-4" />}
            Generate Recipes
          </Button>
        </div>
      </div>

      {/* Generated Recipes Section */}
      <AnimatePresence>
        {generated.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-12"
          >
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="text-pastel-purple-dark w-5 h-5" /> Generated for you
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generated.map((recipe, i) => (
                <RecipeCard 
                  key={i} 
                  recipe={recipe} 
                  onSave={() => handleSave(recipe)}
                  onMade={() => handleMadeThis(recipe)}
                  isGenerated
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved Recipes */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BookOpen className="text-pastel-blue-dark w-5 h-5" /> Saved Collection
        </h2>
        
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300" /></div>
        ) : recipes?.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
            <p className="text-slate-400">No saved recipes yet. Try generating some!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes?.map((recipe) => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                onDelete={() => deleteRecipe(recipe.id)}
                onMade={() => handleMadeThis(recipe)}
              />
            ))}
          </div>
        )}
      </div>
    </LayoutShell>
  );
}

function RecipeCard({ recipe, onSave, onDelete, onMade, isGenerated }: any) {
  return (
    <Card className="rounded-3xl border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full group bg-white">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold text-slate-800 line-clamp-2">{recipe.title}</CardTitle>
          <div className="bg-slate-50 p-2 rounded-full">
            <ChefHat className="w-5 h-5 text-slate-400" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {recipe.ingredients.slice(0, 3).map((ing: string, i: number) => (
            <Badge key={i} variant="secondary" className="bg-slate-50 text-slate-500 font-normal rounded-lg">
              {ing}
            </Badge>
          ))}
          {recipe.ingredients.length > 3 && (
            <span className="text-xs text-slate-400 self-center">+{recipe.ingredients.length - 3} more</span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="grid grid-cols-4 gap-2 text-center text-xs p-3 bg-slate-50 rounded-2xl">
          <div><div className="font-bold text-slate-800">{recipe.macros.calories}</div><div className="text-slate-400">kcal</div></div>
          <div><div className="font-bold text-slate-800">{recipe.macros.protein}g</div><div className="text-slate-400">Prot</div></div>
          <div><div className="font-bold text-slate-800">{recipe.macros.carbs}g</div><div className="text-slate-400">Carb</div></div>
          <div><div className="font-bold text-slate-800">{recipe.macros.fats}g</div><div className="text-slate-400">Fat</div></div>
        </div>
      </CardContent>

      <CardFooter className="gap-2 pt-2 pb-6 px-6">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1 rounded-xl border-slate-200">View</Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold mb-4">{recipe.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Ingredients</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  {recipe.ingredients.map((ing: string, i: number) => <li key={i}>{ing}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Instructions</h4>
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{recipe.instructions}</p>
              </div>
              <Button onClick={onMade} className="w-full rounded-xl bg-slate-900 text-white">I Made This!</Button>
            </div>
          </DialogContent>
        </Dialog>

        {isGenerated && onSave && (
          <Button onClick={onSave} className="flex-1 rounded-xl bg-pastel-purple text-pastel-purple-dark hover:bg-pastel-purple-dark hover:text-white border-0">
            Save
          </Button>
        )}
        
        {!isGenerated && onDelete && (
          <Button variant="ghost" size="icon" onClick={onDelete} className="rounded-xl hover:bg-red-50 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
