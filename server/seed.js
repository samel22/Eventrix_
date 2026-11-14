import "dotenv/config";
import { connectDatabase } from "./config/db.js";
import Event from "./models/Event.js";
import User from "./models/User.js";

const sampleEvents = [
  {
    title: "Neon Nights: Live Sessions",
    description: "An intimate night of electronic music, local artists, and immersive light installations.",
    category: "Music",
    daysFromNow: 8,
    venue: "The Glasshouse, Mumbai",
    price: 1499,
    totalSeats: 180,
    imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=1200&auto=format&fit=crop"
  },
  {
    title: "Build Forward: Product & AI",
    description: "A practical, one-day summit for builders exploring thoughtful applications of artificial intelligence.",
    category: "Tech",
    daysFromNow: 14,
    venue: "Jio World Convention Centre, Mumbai",
    price: 2999,
    totalSeats: 120,
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop"
  },
  {
    title: "Mumbai Food Stories",
    description: "Taste regional favourites, meet independent chefs, and discover new street-food traditions.",
    category: "Food",
    daysFromNow: 20,
    venue: "Bandra Kurla Complex, Mumbai",
    price: 999,
    totalSeats: 240,
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200&auto=format&fit=crop"
  },
  {
    title: "The Art After Dark",
    description: "An evening gallery walk with contemporary artists, live sketches, and conversations about the work.",
    category: "Art",
    daysFromNow: 26,
    venue: "Jehangir Art Gallery, Mumbai",
    price: 499,
    totalSeats: 90,
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1200&auto=format&fit=crop"
  },
  {
    title: "City Lights 10K",
    description: "Run, walk, or cheer along a scenic route through the city with a community finish-line festival.",
    category: "Sports",
    daysFromNow: 32,
    venue: "Bandra Fort Promenade, Mumbai",
    price: 799,
    totalSeats: 300,
    imageUrl: "https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=1200&auto=format&fit=crop"
  },
  {
    title: "Monsoon Wedding Showcase",
    description: "Meet local designers, florists, and planners at an inspiring showcase for modern Indian weddings.",
    category: "Wedding",
    daysFromNow: 38,
    venue: "Taj Lands End, Mumbai",
    price: 1999,
    totalSeats: 160,
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop"
  },
  {
    title: "The Laughing Room",
    description: "A lively stand-up showcase featuring sharp new voices and a surprise closing set.",
    category: "Comedy",
    daysFromNow: 46,
    venue: "Canvas Laugh Club, Mumbai",
    price: 1199,
    totalSeats: 110,
    imageUrl: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?q=80&w=1200&auto=format&fit=crop"
  },
  {
    title: "Make Your Own Scent",
    description: "Learn the building blocks of fragrance and leave with a custom scent in this small-group workshop.",
    category: "Workshop",
    daysFromNow: 56,
    venue: "Studio Bloom, Mumbai",
    price: 1499,
    totalSeats: 24,
    imageUrl: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=1200&auto=format&fit=crop"
  }
];

// Seed the demo organizer and eight upcoming sample events into MongoDB.
async function seedDatabase() {
  await connectDatabase();

  let organizer = await User.findOne({ email: "organizer@eventrix.demo" });
  if (!organizer) {
    organizer = await User.create({
      name: "Eventrix Organizer",
      email: "organizer@eventrix.demo",
      password: "EventrixDemo2026!",
      role: "organizer"
    });
  }

  await Event.deleteMany({ organizer: organizer._id });
  const events = sampleEvents.map(({ daysFromNow, ...event }) => ({
    ...event,
    date: new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000),
    seatsAvailable: event.totalSeats,
    organizer: organizer._id
  }));
  await Event.insertMany(events);
  console.log("Seeded 8 events. Organizer: organizer@eventrix.demo / EventrixDemo2026!");
}

seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Could not seed Eventrix:", error);
    process.exit(1);
  });
