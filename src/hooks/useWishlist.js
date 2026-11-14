import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api, { getErrorMessage } from "../services/api.js";

function readSavedEvents() {
  try {
    return JSON.parse(localStorage.getItem("eventrix-wishlist")) || [];
  } catch {
    return [];
  }
}

// Keep saved event IDs available locally and sync changes for signed-in users.
export function useWishlist() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [savedIds, setSavedIds] = useState(readSavedEvents);

  useEffect(() => {
    localStorage.setItem("eventrix-wishlist", JSON.stringify(savedIds));
  }, [savedIds]);

  async function toggleSaved(eventId) {
    const wasSaved = savedIds.includes(eventId);
    const nextIds = wasSaved
      ? savedIds.filter((id) => id !== eventId)
      : [...savedIds, eventId];

    if (user) {
      try {
        await api.post(`/events/${eventId}/wishlist`, { saved: !wasSaved });
      } catch (error) {
        notify(getErrorMessage(error), "error");
        return;
      }
    }

    setSavedIds(nextIds);
    notify(wasSaved ? "Removed from your wishlist." : "Saved to your wishlist.");
  }

  return { savedIds, toggleSaved };
}
