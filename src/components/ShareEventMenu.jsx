import { Check, Copy, Mail, Share2 } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "../context/ToastContext.jsx";
import { formatPrice } from "../utils/formatPrice.js";

function getEventUrl(event) {
  return `${window.location.origin}/event/${event._id}`;
}

function getShareText(event) {
  const date = new Date(event.date);
  const formattedDate = Number.isNaN(date.getTime())
    ? "Date to be announced"
    : new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  return `${event.title} | ${formattedDate} | ${event.venue || event.location || "Venue to be announced"} | ${formatPrice(event.price)} per person\n${getEventUrl(event)}`;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  let copied = false;
  try {
    input.select();
    copied = document.execCommand("copy");
  } finally {
    input.remove();
  }
  if (!copied) throw new Error("Clipboard access is unavailable.");
}

export default function ShareEventMenu({ event, className = "", label = "Share" }) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const copiedTimer = useRef(null);
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 8, left: 8 });

  useLayoutEffect(() => {
    if (!open) return undefined;
    function repositionMenu() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(190, window.innerWidth - 16);
      const estimatedHeight = 190;
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
      const below = rect.bottom + 8;
      const top = below + estimatedHeight <= window.innerHeight - 8
        ? below
        : Math.max(8, rect.top - estimatedHeight - 8);
      setMenuPosition({ top, left });
    }

    repositionMenu();
    window.addEventListener("resize", repositionMenu);
    window.addEventListener("scroll", repositionMenu, true);
    return () => {
      window.removeEventListener("resize", repositionMenu);
      window.removeEventListener("scroll", repositionMenu, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function handlePointerDown(pointerEvent) {
      if (triggerRef.current?.contains(pointerEvent.target) || menuRef.current?.contains(pointerEvent.target)) return;
      setOpen(false);
    }
    function handleKeyDown(keyEvent) {
      if (keyEvent.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);
  if (!event?._id) return null;

  async function copyLink() {
    try {
      await copyText(getEventUrl(event));
      setCopied(true);
      notify("Event link copied successfully");
      window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      notify("Could not copy the event link. Check your browser permissions.", "error");
    }
  }

  function openShare(url) {
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  function shareWhatsApp() {
    openShare(`https://wa.me/?text=${encodeURIComponent(getShareText(event))}`);
  }

  function shareOnX() {
    openShare(`https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText(event))}`);
  }

  function shareByEmail() {
    const subject = encodeURIComponent(`Join me at ${event.title}`);
    const body = encodeURIComponent(getShareText(event));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setOpen(false);
  }

  return (
    <div className={`share-menu ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className="button button-outline button-small share-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={copied ? "Event link copied" : `Share ${event.title}`}
        onClick={() => setOpen((current) => !current)}
      >
        <Share2 size={14} /> {label}
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          className="share-menu-options"
          role="menu"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <button type="button" role="menuitem" onClick={copyLink} aria-label={copied ? "Copied event link" : "Copy event link"}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy Link"}
          </button>
          <button type="button" role="menuitem" onClick={shareWhatsApp}>WhatsApp</button>
          <button type="button" role="menuitem" onClick={shareOnX}>X / Twitter</button>
          <button type="button" role="menuitem" onClick={shareByEmail}><Mail size={14} /> Email</button>
        </div>,
        document.body
      )}
    </div>
  );
}
