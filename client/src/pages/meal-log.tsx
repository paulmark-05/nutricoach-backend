import React, { useState } from "react";
import LayoutShell from "@/components/layout-shell";
import { useMeals } from "@/hooks/use-meals";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Camera, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function MealLog() {
  const { meals, isLoading, createMeal, isCreating, deleteMeal, analyzeMeal, isAnalyzing } = useMeals();
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!description && !image) return;
    try {
      const result = await analyzeMeal({ 
        text: description, 
        image: image?.split(',')[1] // remove data:image/jpeg;base64, prefix
      });
      setAnalysis(result);
    } catch (err) {
      // toast handled in hook
    }
  };

  const handleSave = () => {
    if (!analysis) return;
    createMeal({
      description: analysis.foodName,
      calories: analysis.calories,
      protein: analysis.protein,
      carbs: analysis.carbs,
      fats: analysis.fats,
      imageUrl: image || undefined,
    }, {
      onSuccess: () => {
        setIsOpen(false);
        resetForm();
      }
    });
  };

  const resetForm = () => {
    setDescription("");
    setImage(null);
    setAnalysis(null);
  };

  const sortedMeals = meals?.sort((a, b) => 
    new Date(b.date || "").getTime() - new Date(a.date || "").getTime()
  );

  return (
    <LayoutShell>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Meal Log</h1>
          <p className="text-slate-500">Track what you eat, let AI handle the math.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-pastel-green text-pastel-green-dark hover:bg-pastel-green-dark hover:text-white border-0 shadow-lg shadow-pastel-green/30">
              <Plus className="mr-2 h-4 w-4" /> Add Meal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">Log a Meal</DialogTitle>
            </DialogHeader>
            
            {!analysis ? (
              <div className="space-y-6 py-4">
                {/* Image Upload */}
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors relative overflow-hidden",
                    image ? "border-pastel-green" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  {image ? (
                    <img src={image} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <Camera className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">Click to upload photo</span>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-100" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400">Or describe it</span>
                  </div>
                </div>

                <Textarea 
                  placeholder="e.g., Grilled chicken salad with avocado" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl border-slate-200 focus:border-pastel-green focus:ring-pastel-green min-h-[100px]"
                />
                
                <Button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing || (!description && !image)}
                  className="w-full rounded-xl bg-slate-900 h-12 text-lg"
                >
                  {isAnalyzing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4 text-pastel-yellow" /> Analyze Macros</>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6 py-4 animate-in fade-in zoom-in-95">
                <div className="text-center">
                  <div className="w-16 h-16 bg-pastel-green rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-pastel-green-dark" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{analysis.foodName}</h3>
                  <p className="text-slate-500">Here's what we found:</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl text-center">
                    <span className="block text-2xl font-bold text-slate-800">{analysis.calories}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Calories</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Protein</span>
                      <span className="font-bold text-slate-700">{analysis.protein}g</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Carbs</span>
                      <span className="font-bold text-slate-700">{analysis.carbs}g</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Fats</span>
                      <span className="font-bold text-slate-700">{analysis.fats}g</span>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="ghost" onClick={() => setAnalysis(null)} className="rounded-xl">Back</Button>
                  <Button onClick={handleSave} disabled={isCreating} className="rounded-xl bg-pastel-green text-pastel-green-dark hover:bg-pastel-green-dark hover:text-white w-full">
                    {isCreating ? "Saving..." : "Add to Log"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300" /></div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {sortedMeals?.map((meal, index) => (
              <motion.div
                key={meal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-white rounded-2xl p-4 md:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-4 md:gap-6"
              >
                {/* Image or Icon */}
                <div className="w-full md:w-20 h-20 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0">
                  {meal.imageUrl ? (
                    <img src={meal.imageUrl} alt={meal.description} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800">{meal.description}</h3>
                  <p className="text-sm text-slate-400 mb-2">
                    {format(new Date(meal.date || ""), "MMM d, h:mm a")}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 md:gap-4">
                    <span className="px-3 py-1 bg-pastel-pink/20 text-pastel-pink-dark rounded-full text-xs font-bold">
                      {meal.calories} kcal
                    </span>
                    <span className="px-3 py-1 bg-pastel-blue/20 text-pastel-blue-dark rounded-full text-xs font-bold">
                      P: {meal.protein}g
                    </span>
                    <span className="px-3 py-1 bg-pastel-green/20 text-pastel-green-dark rounded-full text-xs font-bold">
                      C: {meal.carbs}g
                    </span>
                    <span className="px-3 py-1 bg-pastel-yellow/20 text-pastel-yellow-dark rounded-full text-xs font-bold">
                      F: {meal.fats}g
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteMeal(meal.id)}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {sortedMeals?.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                🥥
              </div>
              <h3 className="text-lg font-bold text-slate-800">No meals yet</h3>
              <p className="text-slate-500">Log your first meal to start tracking!</p>
            </div>
          )}
        </div>
      )}
    </LayoutShell>
  );
}
