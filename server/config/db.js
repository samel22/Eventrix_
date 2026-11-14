import mongoose from "mongoose";

// Connect the API to MongoDB before accepting requests.
export async function connectDatabase() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing. Add it to server/.env.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const migration = await mongoose.connection.collection("events").updateMany(
    { seatsAvailable: { $exists: false }, availableSeats: { $type: "number" } },
    [{
      $set: {
        seatsAvailable: "$availableSeats",
        venue: { $ifNull: ["$venue", "$location"] },
        imageUrl: { $ifNull: ["$imageUrl", "$image"] },
        seatsPerRow: { $ifNull: ["$seatsPerRow", 10] },
        bookedSeats: { $ifNull: ["$bookedSeats", []] }
      }
    }]
  );
  if (migration.modifiedCount > 0) {
    console.log(`Backfilled current seat and event fields for ${migration.modifiedCount} legacy event(s).`);
  }
  console.log("Connected to MongoDB");
}
