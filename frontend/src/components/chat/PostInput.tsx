import { useState } from "react";
import { Zap } from "lucide-react";

const PostInput = () => {
  const [input, setInput] = useState("");

  return (
    <div className="bg-background-inverse border border-border-inverse rounded-xl p-4 mb-6">
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-linear-to-br from-status-pending to-status-pending shrink-0 flex items-center justify-center font-bold text-white text-lg" />

        {/* Input Area */}
        <div className="flex-1 space-y-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What did you build, ship, or learn today?"
            className="w-full bg-surface-inverse-muted text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
          />

          {/* Milestone Selector */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-surface-inverse-muted hover:bg-slate-700 rounded-lg text-sm text-text-on-inverse-secondary transition-colors">
              <Zap className="w-4 h-4" />
              <span>Milestone</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostInput;
