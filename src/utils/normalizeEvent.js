export function normalizeEvent(event) {
  if (!event) return event;
  return {
    ...event,
    imageUrl: event.imageUrl || event.image,
    venue: event.venue || event.location,
    seatsAvailable: event.seatsAvailable ?? event.availableSeats,
    seatsPerRow: event.seatsPerRow || 10,
    bookedSeats: event.bookedSeats || []
  };
}
