import React, { useState } from "react";
import LayoutShell from "@/components/layout-shell";
import { useCheatMeals } from "@/hooks/use-cheat-meals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Cookie, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function CheatMeals() {
  const { cheatMeals, isLoading, suggestAlternative, isSuggesting, logCheatMeal, deleteCheatMeal } = useCheatMeals();
  const [craving, setCraving] = useState("");
  const [suggestion, setSuggestion] = useState<any>(null);

  const handleSuggest = async () => {
    if (!craving) return;
    try {
      const result = await suggestAlternative({ craving });
      setSuggestion(result);
    } catch (err) {
      // toast handles error
    }
  };

  const handleAcceptAlternative = () => {
    logCheatMeal({
      description: suggestion.alternative,
      calories: suggestion.calories,
      alternative: craving, // Store original craving as "alternative" context
      alternativeMacros: { 
        calories: suggestion.calories, 
        protein: suggestion.protein, 
        carbs: suggestion.carbs, 
        fats: suggestion.fats 
      }
    }, {
      onSuccess: () => {
        setSuggestion(null);
        setCraving("");
      }
    });
  };

  const handleRejectAlternative = () => {
    logCheatMeal({
      description: craving,
      calories: 500, // Estimate since we don't have analysis for raw input
      alternative: suggestion.alternative,
      alternativeMacros: null
    }, {
      onSuccess: () => {
        setSuggestion(null);
        setCraving("");
      }
    });
  };

  // Count cheats this month
  const currentMonth = new Date().getMonth();
  const monthlyCheats = cheatMeals?.filter(m => new Date(m.date || "").getMonth() === currentMonth).length || 0;
  const limit = 4;

  return (
    <LayoutShell>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Cheat Meal Helper</h1>
            <p className="text-slate-500">Craving something naughty? Let's see if we can find a tasty compromise.</p>
          </div>

          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Cookie className="w-32 h-32 rotate-12" />
            </div>
            
            <div className="relative z-10 max-w-md">
              <h3 className="text-lg font-bold text-slate-800 mb-4">What are you craving?</h3>
              <div className="flex gap-4">
                <Input 
                  placeholder="e.g. Double Cheeseburger" 
                  value={craving}
                  onChange={(e) => setCraving(e.target.value)}
                  className="rounded-xl h-12 border-slate-200"
                />
                <Button 
                  onClick={handleSuggest} 
                  disabled={isSuggesting || !craving}
                  className="rounded-xl h-12 px-6 bg-pastel-pink text-pastel-pink-dark hover:bg-pastel-pink-dark hover:text-white"
                >
                  {isSuggesting ? <Loader2 className="animate-spin" /> : "Check"}
                </Button>
              </div>
            </div>
          </div>

          {/* History */}
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">History</h3>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" /></div>
              ) : cheatMeals?.length === 0 ? (
                <p className="text-slate-400">No cheat meals recorded. You're a saint! 😇</p>
              ) : (
                cheatMeals?.map((meal) => (
                  <div key={meal.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div>
                      <h4 className="font-bold text-slate-800">{meal.description}</h4>
                      <p className="text-xs text-slate-400">{format(new Date(meal.date || ""), "MMM d, yyyy")}</p>
                    </div>
                    {meal.alternativeMacros ? (
                      <span className="px-3 py-1 bg-pastel-green/20 text-pastel-green-dark rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Healthy Choice
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-pastel-pink/20 text-pastel-pink-dark rounded-full text-xs font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Indulgence
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <div className={cn(
            "rounded-[2rem] p-8 text-center border-2 transition-colors",
            monthlyCheats > limit 
              ? "bg-red-50 border-red-100" 
              : "bg-pastel-yellow/10 border-pastel-yellow/30"
          )}>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Monthly Allowance</h3>
            <div className="text-5xl font-extrabold text-slate-900 mb-2">
              {monthlyCheats}<span className="text-2xl text-slate-400">/{limit}</span>
            </div>
            <p className="text-sm text-slate-500">cheat meals used</p>
            
            {monthlyCheats > limit && (
              <div className="mt-4 flex items-center justify-center gap-2 text-red-500 text-sm font-bold bg-white/50 p-2 rounded-xl">
                <AlertCircle className="w-4 h-4" /> Limit Exceeded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suggestion Dialog */}
      <Dialog open={!!suggestion} onOpenChange={() => setSuggestion(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden">
          <div className="bg-pastel-pink p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Wait! 🛑</h2>
            <p className="text-slate-800/80">Before you eat that {craving}, consider this...</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Try: {suggestion?.alternative}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{suggestion?.reason}</p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-2xl grid grid-cols-4 gap-2 text-center text-xs">
              <div><div className="font-bold">{suggestion?.calories}</div><div className="text-slate-400">kcal</div></div>
              <div><div className="font-bold">{suggestion?.protein}g</div><div className="text-slate-400">Prot</div></div>
              <div><div className="font-bold">{suggestion?.carbs}g</div><div className="text-slate-400">Carb</div></div>
              <div><div className="font-bold">{suggestion?.fats}g</div><div className="text-slate-400">Fat</div></div>
            </div>

            <DialogFooter className="flex-col sm:flex-col gap-2">
              <Button onClick={handleAcceptAlternative} className="w-full rounded-xl bg-pastel-green text-pastel-green-dark hover:bg-pastel-green-dark hover:text-white h-12">
                I'll Eat the Alternative 🥗
              </Button>
              <Button onClick={handleRejectAlternative} variant="ghost" className="w-full rounded-xl text-slate-400 hover:text-slate-600">
                No thanks, I really need that {craving} 🍔
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </LayoutShell>
  );
}
