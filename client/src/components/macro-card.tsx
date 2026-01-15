import { cn } from "@/lib/utils";

interface MacroCardProps {
  label: string;
  value: number;
  total?: number;
  unit: string;
  color: "pink" | "blue" | "green" | "yellow" | "purple";
  icon?: React.ReactNode;
}

export function MacroCard({ label, value, total, unit, color, icon }: MacroCardProps) {
  const colors = {
    pink: "bg-pastel-pink text-pastel-pink-dark",
    blue: "bg-pastel-blue text-pastel-blue-dark",
    green: "bg-pastel-green text-pastel-green-dark",
    yellow: "bg-pastel-yellow text-pastel-yellow-dark",
    purple: "bg-pastel-purple text-pastel-purple-dark",
  };

  const progress = total ? Math.min((value / total) * 100, 100) : 0;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-2xl", colors[color])}>
          {icon}
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-slate-800">{value}</span>
          <span className="text-sm text-slate-400 font-medium ml-1">/ {total} {unit}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-slate-600">{label}</span>
          <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-full text-slate-500">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all duration-1000 ease-out", colors[color].split(" ")[0])}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
