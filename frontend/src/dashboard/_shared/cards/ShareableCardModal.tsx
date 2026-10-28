// frontend/src/dashboard/_shared/cards/ShareableCardModal.tsx
import { useState } from "react";
import { X, Copy, Check, Share2 } from "lucide-react";
import { createPortal } from "react-dom";
import { ShareableCard, type ShareableCardData } from "./ShareableCard";

interface ShareableCardModalProps {
  card: ShareableCardData;
  onClose: () => void;
}

export function ShareableCardModal({ card, onClose }: ShareableCardModalProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/share/card/${card.id}` : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${card.title}\n${shareUrl}`)}`, "_blank");
  };

  const shareToLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(card.title)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface-primary border border-border-default rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 border-b border-border-default pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-accent-primary" />
            <h3 className="text-base font-bold text-text-primary">Preview & Share Card</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-secondary text-text-muted hover:text-text-primary transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Preview */}
        <div className="mb-6">
          <ShareableCard card={card} />
        </div>

        {/* Copy Link */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex-1 bg-surface-secondary border border-border-default rounded-lg px-3 py-2.5 text-xs font-mono text-text-muted truncate">
            {shareUrl}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition shrink-0 bg-violet-600 text-white hover:bg-violet-700"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>

        {/* Social Share Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={shareToWhatsApp}
            className="p-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition text-center"
          >
            WhatsApp
          </button>
          <button
            onClick={shareToLinkedIn}
            className="p-3 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition text-center"
          >
            LinkedIn
          </button>
          <button
            onClick={shareToTwitter}
            className="p-3 rounded-xl bg-black text-white text-xs font-semibold hover:bg-gray-800 transition text-center"
          >
            X (Twitter)
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
