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
      className={`relative bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 transition-all cursor-pointer ${
        agent.isPremium
          ? 'border-brand-premium/30 shadow-lg hover:shadow-xl'
          : 'border-border-default shadow-sm hover:shadow-md'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {/* Premium Shimmer Effect */}
      {agent.isPremium && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-premium/10 to-transparent rounded-xl animate-shimmer" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            agent.isPremium
              ? 'bg-gradient-to-br from-brand-primary to-status-pending'
              : 'bg-brand-primary/10'
          }`}>
            <Bot className={`w-5 h-5 ${agent.isPremium ? 'text-white' : 'text-brand-primary'}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold flex items-center gap-2">
              {agent.name}
              {agent.isPremium && (
                <Sparkles className="w-3 h-3 text-brand-premium" />
              )}
            </h3>
            <Badge
              variant={agent.isPremium ? 'default' : 'secondary'}
              className={agent.isPremium ? 'bg-gradient-to-r from-brand-premium to-status-warning text-black text-xs mt-1' : 'text-xs mt-1'}
            >
              {agent.isPremium ? 'Premium' : 'Basic'}
            </Badge>
          </div>
        </div>
        <Switch checked={agent.enabled} onCheckedChange={() => onToggle(agent.id)} />
      </div>

      {/* Description */}
      <p className={`text-sm text-text-muted transition-all ${
        isHovered ? 'line-clamp-none' : 'line-clamp-2'
      }`}>
        {isHovered ? agent.fullDescription : agent.description}
      </p>

      {/* Configure Button (shown on hover) */}
      {isHovered && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors text-sm font-medium"
        >
          <Settings className="w-4 h-4" />
          Configure
        </motion.button>
      )}
    </motion.div>
  );
}
