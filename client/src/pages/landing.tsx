import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Salad, BrainCircuit, BarChart3, Cookie } from "lucide-react";

export default function Landing() {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white overflow-hidden relative">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-pastel-pink/30 rounded-full blur-[100px] opacity-70" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-pastel-blue/30 rounded-full blur-[120px] opacity-70" />
      
      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-pastel-green p-2 rounded-xl text-pastel-green-dark">
            <Salad className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
            NutriCoach
          </span>
        </div>
        <a href="/api/login">
          <Button className="rounded-xl px-6 bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 transition-all shadow-lg shadow-slate-900/20">
            Login / Sign Up
          </Button>
        </a>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 pt-16 pb-24 md:pt-32 md:pb-40">
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-4xl mx-auto text-center"
        >
          <motion.h1 variants={item} className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-4">
            Your personal ai diet coach
          </motion.h1>
          
          <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 mb-8">
            <Sparkles className="w-4 h-4 text-pastel-yellow-dark" />
            <span className="text-sm font-medium text-slate-600">Powered by Gemini AI</span>
          </motion.div>
          
          <motion.p variants={item} className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            Tracking meals made simple and smart.
          </motion.p>
          
          <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/api/login">
              <Button size="lg" className="rounded-2xl px-8 h-14 text-lg bg-pastel-pink hover:bg-pastel-pink-dark text-slate-900 hover:text-white border border-transparent hover:border-white/20 shadow-xl shadow-pastel-pink/30 hover:shadow-pastel-pink/50 transition-all duration-300">
                Start Your Journey
              </Button>
            </a>
            <Button variant="outline" size="lg" className="rounded-2xl px-8 h-14 text-lg border-2 hover:bg-slate-50">
              Learn More <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: BrainCircuit,
              title: "AI Food Tracker",
              desc: "Snap a photo of your meal. Our AI identifies ingredients and calculates macros instantly.",
              color: "bg-pastel-blue",
              textColor: "text-pastel-blue-dark"
            },
            {
              icon: Cookie,
              title: "Cheat Meal Helper",
              desc: "Craving cake? We'll suggest a healthier alternative that hits the spot without the guilt.",
              color: "bg-pastel-pink",
              textColor: "text-pastel-pink-dark"
            },
            {
              icon: BarChart3,
              title: "Smart Analytics",
              desc: "Visualize your progress with beautiful charts. Watch your health improve day by day.",
              color: "bg-pastel-purple",
              textColor: "text-pastel-purple-dark"
            }
          ].map((feature, i) => (
            <div key={i} className="group p-8 bg-white rounded-[2rem] border border-slate-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-7 h-7 ${feature.textColor}`} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
