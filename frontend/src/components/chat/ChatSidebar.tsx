import {
  Globe,
  Users,
  BookOpen,
  HelpCircle,
  AlertCircle,
  Plus,
  Target,
  Star,
} from "lucide-react";
import { useState } from "react";

interface ChatSidebarProps {
  onClose?: () => void;
}

const ChatSidebar = ({ onClose }: ChatSidebarProps) => {
  const [startupName] = useState("MediConnect Africa");
  const [role] = useState("MVP");

  const hangoutItems = [
    { icon: Globe, label: "Global Pulse", count: 12, active: true },
    { icon: Users, label: "Your Tribe", count: 3, active: false },
    { icon: BookOpen, label: "Build Logs", count: 0, active: false },
    { icon: HelpCircle, label: "Questions", count: 5, active: false },
    { icon: AlertCircle, label: "Problem Signals", count: 2, active: false },
  ];

  const gsisMetrics = [
    { label: "GSIS", value: 68, color: "text-status-warning" },
    { label: "Decay", value: "0.91 ◀", color: "text-status-warning" },
    { label: "Progress", value: "42% to Beta", color: "text-text-disabled" },
  ];

  const shortcuts = [
    { icon: Target, label: "First paying customer", delta: "-14d" },
    { icon: Star, label: "Community Score", delta: "45/100" },
  ];

  const activeUsers = [
    { initials: "A", color: "bg-gradient-to-br from-status-pending to-status-pending" },
    { initials: "B", color: "bg-gradient-to-br from-cyan-400 to-cyan-500" },
    { initials: "C", color: "bg-gradient-to-br from-pink-400 to-pink-500" },
    { initials: "D", color: "bg-gradient-to-br from-lime-400 to-lime-500" },
  ];

  return (
    <aside className="sticky top-4 space-y-6 h-[calc(100vh-2rem)] overflow-y-auto hide-scrollbar">
      {/* My Startup Section */}
      <div className="bg-linear-to-b from-slate-900 to-slate-950 border border-border-inverse rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-text-disabled uppercase tracking-wider">
          My Startup
        </p>
        <h3 className="text-lg font-bold text-white">{startupName}</h3>
        <div className="inline-block px-3 py-1 bg-status-pending/20 text-status-pending text-xs font-semibold rounded-full">
          {role}
        </div>

        {/* GSIS Stats */}
        <div className="space-y-2 pt-2 border-t border-border-inverse">
          <p className="text-xs font-semibold text-text-disabled uppercase tracking-wider">
            GSIS
          </p>
          {gsisMetrics.map((metric, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-text-disabled">{metric.label}</span>
              <span className={`font-bold text-sm ${metric.color}`}>
                {metric.value}
              </span>
            </div>
          ))}
          <div className="mt-2 h-1.5 bg-surface-inverse-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-status-pending to-brand-primary"
              style={{ width: "42%" }}
            />
          </div>
        </div>
      </div>

      {/* Hangout Section */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-text-disabled uppercase tracking-wider px-2">
          Hangout
        </p>
        {hangoutItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={i}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                item.active
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-text-on-inverse-secondary hover:bg-surface-inverse-muted/50"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.count > 0 && (
                <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Now Section */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-text-disabled uppercase tracking-wider px-2">
          Active Now
        </p>
        <div className="flex items-center gap-2 px-3">
          {activeUsers.map((user, i) => (
            <div
              key={i}
              className={`w-8 h-8 ${user.color} rounded-full flex items-center justify-center text-xs font-bold text-white`}
            />
          ))}
          <span className="text-xs text-text-disabled ml-2">+18 online</span>
        </div>
      </div>

      {/* Shortcuts Section */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-text-disabled uppercase tracking-wider px-2">
          Shortcuts
        </p>
        {shortcuts.map((shortcut, i) => (
          (() => {
            const ShortcutIcon = shortcut.icon;
            return (
          <button
            key={i}
            onClick={onClose}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-on-inverse-secondary hover:bg-surface-inverse-muted/50 transition-colors"
          >
            <ShortcutIcon className="h-4 w-4 text-cyan-400" aria-hidden="true" />
            <div className="flex-1 text-left">
              <p className="text-sm">{shortcut.label}</p>
            </div>
            <span
              className={`text-xs font-medium ${
                shortcut.delta.startsWith("-")
                  ? "text-status-error"
                  : "text-status-warning"
              }`}
            >
              {shortcut.delta}
            </span>
          </button>
            );
          })()
        ))}
      </div>
    </aside>
  );
};

export default ChatSidebar;
