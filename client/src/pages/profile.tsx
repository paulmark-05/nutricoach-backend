import React, { useEffect } from "react";
import LayoutShell from "@/components/layout-shell";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Share2, Download, Instagram, Facebook, Twitter } from "lucide-react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function Profile() {
  const { user } = useAuth();
  const { profile, isLoading, updateProfile, isUpdating, generateShareCard } = useProfile();
  const [shareUrl, setShareUrl] = React.useState<string | null>(null);
  
  const { register, handleSubmit, setValue, watch } = useForm();

  // Populate form when data loads
  useEffect(() => {
    if (profile) {
      Object.keys(profile).forEach(key => {
        setValue(key, profile[key as keyof typeof profile]);
      });
    }
  }, [profile, setValue]);

  const onSubmit = (data: any) => {
    updateProfile({
      ...data,
      age: Number(data.age),
      height: Number(data.height),
      weight: Number(data.weight),
      targetWeight: Number(data.targetWeight)
    });
  };

  const handleShare = async () => {
    const res = await generateShareCard();
    if (res.data) setShareUrl(res.data.imageUrl);
  };

  if (isLoading) {
    return <LayoutShell><div className="flex justify-center h-full items-center"><Loader2 className="animate-spin" /></div></LayoutShell>;
  }

  return (
    <LayoutShell>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Your Profile</h1>
            <p className="text-slate-500">Manage your goals and personal details.</p>
          </div>
          
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={handleShare} className="rounded-xl bg-pastel-blue text-pastel-blue-dark hover:bg-pastel-blue-dark hover:text-white shadow-lg shadow-pastel-blue/20">
                  <Share2 className="mr-2 w-4 h-4" /> Share Progress
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden bg-white">
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold mb-4">Share Your Journey!</h3>
                  {shareUrl ? (
                    <img src={shareUrl} alt="Progress Card" className="w-full rounded-2xl shadow-lg mb-4" />
                  ) : (
                    <div className="h-64 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                      <Loader2 className="animate-spin text-slate-400" />
                    </div>
                  )}
                  <div className="flex justify-center gap-4">
                    <Button size="icon" className="rounded-full bg-pink-600 hover:bg-pink-700 text-white"><Instagram className="w-5 h-5" /></Button>
                    <Button size="icon" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"><Facebook className="w-5 h-5" /></Button>
                    <Button size="icon" className="rounded-full bg-sky-500 hover:bg-sky-600 text-white"><Twitter className="w-5 h-5" /></Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Physical Stats */}
          <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-pastel-yellow flex items-center justify-center text-pastel-yellow-dark">💪</span> 
              Physical Stats
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Age</Label>
                <Input type="number" {...register("age")} className="rounded-xl border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select onValueChange={(v) => setValue("gender", v)} defaultValue={profile?.gender || "female"}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input type="number" {...register("height")} className="rounded-xl border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label>Current Weight (kg)</Label>
                <Input type="number" {...register("weight")} className="rounded-xl border-slate-200" />
              </div>
            </div>
          </section>

          {/* Goals */}
          <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-pastel-pink flex items-center justify-center text-pastel-pink-dark">🎯</span> 
              Goals & Lifestyle
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Target Weight (kg)</Label>
                <Input type="number" {...register("targetWeight")} className="rounded-xl border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label>Main Goal</Label>
                <Select onValueChange={(v) => setValue("goal", v)} defaultValue={profile?.goal || "maintenance"}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight_loss">Weight Loss</SelectItem>
                    <SelectItem value="muscle_building">Muscle Building</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Activity Level</Label>
                <Select onValueChange={(v) => setValue("activityLevel", v)} defaultValue={profile?.activityLevel || "moderate"}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary (Office Job)</SelectItem>
                    <SelectItem value="light">Lightly Active</SelectItem>
                    <SelectItem value="moderate">Moderately Active</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="very_active">Very Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dietary Preferences</Label>
                <Input {...register("dietaryPreferences")} placeholder="e.g. Vegan, Keto, Gluten-free" className="rounded-xl border-slate-200" />
              </div>
            </div>
          </section>

          {/* Social */}
          <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
             <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-pastel-blue flex items-center justify-center text-pastel-blue-dark">🌐</span> 
              Social Handles
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
               <div className="space-y-2">
                <Label>Instagram</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input {...register("socialInstagram")} className="pl-10 rounded-xl border-slate-200" placeholder="@username" />
                </div>
              </div>
               <div className="space-y-2">
                <Label>Twitter</Label>
                <div className="relative">
                  <Twitter className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input {...register("socialTwitter")} className="pl-10 rounded-xl border-slate-200" placeholder="@username" />
                </div>
              </div>
               <div className="space-y-2">
                <Label>Facebook</Label>
                <div className="relative">
                  <Facebook className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input {...register("socialFacebook")} className="pl-10 rounded-xl border-slate-200" placeholder="username" />
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isUpdating} className="h-14 px-8 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/20 text-lg">
              {isUpdating ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-5 h-5" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </LayoutShell>
  );
}
