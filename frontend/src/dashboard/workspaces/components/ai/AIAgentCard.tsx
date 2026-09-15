import { useState } from 'react';
import { Bot, Sparkles, Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  fullDescription: string;
  category: string;
  isPremium: boolean;
  icon: string;
  enabled: boolean;
}

interface AIAgentCardProps {
  agent: AIAgent;
  onToggle: (id: string) => void;
}

export function AIAgentCard({ agent, onToggle }: AIAgentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`relative bg-white/80 dark:bg-[#111111]/90 backdrop-blur-xl rounded-2xl p-5 border transition-all cursor-pointer text-slate-900 dark:text-white ${
        agent.isPremium
          ? 'border-amber-400/40 shadow-lg dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]'
          : 'border-black/[0.06] dark:border-white/10 shadow-sm hover:shadow-md hover:border-[#20C997]/30'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {/* Premium Shimmer Effect */}
      {agent.isPremium && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent rounded-2xl animate-shimmer pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            agent.isPremium
              ? 'bg-[#20C997] text-slate-950'
              : 'bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20'
          }`}>
            <Bot className={`w-5 h-5 ${agent.isPremium ? 'text-slate-950 font-bold' : 'text-[#20C997]'}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
              {agent.name}
              {agent.isPremium && (
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              )}
            </h3>
            <Badge
              variant={agent.isPremium ? 'default' : 'secondary'}
              className={agent.isPremium ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-xs mt-1 border-none' : 'bg-black/[0.05] dark:bg-white/10 text-slate-700 dark:text-slate-300 border-none text-xs mt-1'}
            >
              {agent.isPremium ? 'Premium' : 'Basic'}
            </Badge>
          </div>
        </div>
        <Switch checked={agent.enabled} onCheckedChange={() => onToggle(agent.id)} />
      </div>

      {/* Description */}
      <p className={`text-sm text-slate-600 dark:text-slate-300 leading-relaxed transition-all ${
        isHovered ? 'line-clamp-none' : 'line-clamp-2'
      }`}>
        {isHovered ? agent.fullDescription : agent.description}
      </p>

      {/* Configure Button (shown on hover) */}
      {isHovered && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#20C997] hover:bg-[#1db587] text-slate-950 rounded-xl text-sm font-bold shadow-md transition-all"
        >
          <Settings className="w-4 h-4" />
          Configure
        </motion.button>
      )}
    </motion.div>
  );
}
