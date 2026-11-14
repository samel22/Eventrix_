export const eventImagePresets = [
  {
    label: "Live music",
    category: "Music",
    url: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1200&auto=format&fit=crop"
  },
  {
    label: "Tech conference",
    category: "Tech",
    url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop"
  },
  {
    label: "Food festival",
    category: "Food",
    url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200&auto=format&fit=crop"
  },
  {
    label: "Art exhibition",
    category: "Art",
    url: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?q=80&w=1200&auto=format&fit=crop"
  },
  {
    label: "Sports event",
    category: "Sports",
    url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200&auto=format&fit=crop"
  },
  {
    label: "Creative workshop",
    category: "Workshop",
    url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop"
  }
];

export function getEventImage(category) {
  return eventImagePresets.find((image) => image.category === category)?.url
    || eventImagePresets[0].url;
}
