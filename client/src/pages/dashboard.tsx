import { useAuth } from "@/hooks/use-auth";
import { useMeals } from "@/hooks/use-meals";
import { useProfile } from "@/hooks/use-profile";
import LayoutShell from "@/components/layout-shell";
import { MacroCard } from "@/components/macro-card";
import { Flame, Beef, Wheat, Droplets, Loader2, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user } = useAuth();
  const { meals, isLoading: mealsLoading } = useMeals();
  const { profile, isLoading: profileLoading } = useProfile();

  if (mealsLoading || profileLoading) {
    return (
      <LayoutShell>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-pastel-blue-dark" />
        </div>
      </LayoutShell>
    );
  }

  // Calculate daily totals
  const today = new Date().toISOString().split('T')[0];
  const todaysMeals = meals?.filter(m => m.date && new Date(m.date).toISOString().startsWith(today)) || [];
  
  const totals = todaysMeals.reduce((acc, meal) => ({
    calories: acc.calories + meal.calories,
    protein: acc.protein + meal.protein,
    carbs: acc.carbs + meal.carbs,
    fats: acc.fats + meal.fats,
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  // Mock targets if profile not fully set up
  const targets = {
    calories: 2500,
    protein: (profile?.weight || 70) * 2, // 2g per kg
    carbs: 300,
    fats: 70
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <LayoutShell>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
        {/* Welcome Header */}
        <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Welcome back, {user?.firstName || "Friend"}! 👋
            </h1>
            <p className="text-slate-500 mt-1">
              Here's your nutritional breakdown for <span className="font-semibold text-slate-700">{format(new Date(), 'EEEE, MMMM do')}</span>.
            </p>
          </div>
          <Link href="/meals">
            <Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10">
              Log Meal <ArrowUpRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Macro Cards Grid */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MacroCard 
            label="Calories" 
            value={totals.calories} 
            total={targets.calories} 
            unit="kcal" 
            color="pink"
            icon={<Flame className="w-6 h-6" />}
          />
          <MacroCard 
            label="Protein" 
            value={totals.protein} 
            total={Math.round(targets.protein)} 
            unit="g" 
            color="blue"
            icon={<Beef className="w-6 h-6" />}
          />
          <MacroCard 
            label="Carbs" 
            value={totals.carbs} 
            total={targets.carbs} 
            unit="g" 
            color="green"
            icon={<Wheat className="w-6 h-6" />}
          />
          <MacroCard 
            label="Fats" 
            value={totals.fats} 
            total={targets.fats} 
            unit="g" 
            color="yellow"
            icon={<Droplets className="w-6 h-6" />}
          />
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={item} className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Today's Meals</h3>
              <Link href="/meals" className="text-sm font-medium text-pastel-blue-dark hover:underline">
                View All
              </Link>
            </div>
            
            {todaysMeals.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-500 mb-4">No meals logged yet today.</p>
                <Link href="/meals">
                  <Button variant="outline" className="rounded-xl">Start Logging</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysMeals.map((meal) => (
                  <div key={meal.id} className="flex items-center p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm mr-4">
                      🥗
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800">{meal.description}</h4>
                      <div className="flex gap-3 text-xs text-slate-500 mt-1">
                        <span>{meal.calories} kcal</span>
                        <span>•</span>
                        <span>{meal.protein}g P</span>
                        <span>{meal.carbs}g C</span>
                        <span>{meal.fats}g F</span>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-400">
                      {meal.date && format(new Date(meal.date), 'h:mm a')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-pastel-purple/10 rounded-[2rem] border border-pastel-purple/20 p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-pastel-purple rounded-2xl flex items-center justify-center mb-4 text-pastel-purple-dark shadow-sm">
              <Flame className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Daily Streak</h3>
            <p className="text-4xl font-extrabold text-pastel-purple-dark mb-2">3</p>
            <p className="text-sm text-slate-500">days in a row!</p>
          </div>
        </motion.div>
      </motion.div>
    </LayoutShell>
  );
}
