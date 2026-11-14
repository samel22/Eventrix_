# Eventrix

Eventrix is a full-stack event discovery and ticket-booking app. Attendees can find events, save favorites, book and cancel tickets, and view a ticket pass. Organizers can publish events and track ticket sales.

The project is intentionally organized into small files so it is easier to read, explain, and extend.

## Technology

- Frontend: React 18, Vite, JavaScript, React Router, Axios, and plain CSS
- Backend: Node.js, Express, and JavaScript ES modules
- Database: MongoDB Atlas with Mongoose
- Authentication: bcryptjs password hashes and JSON Web Tokens

## What you can do

- Register and sign in with a JWT-backed account
- Browse, search, filter, and sort events
- Save events to a browser wishlist and (when signed in) to the account in MongoDB
- Choose seats from a live seat map; the API atomically rejects seats that another attendee already reserved
- Review and cancel bookings; cancellation returns the reserved seats
- View a profile with booking history, QR tickets, and calendar downloads
- Rate and review events after a confirmed booking; edit or delete your own review
- Share event links through Copy Link, WhatsApp, X, or a prefilled email draft
- Set event capacity and seats per row when creating or editing an event
- Filter events by title, category, price range, date, and sort order
- View and publish ticket prices in Indian rupees
- Create, edit, and delete organizer events
- Review event analytics and confirmed attendees
- See a featured event and a live countdown on the home page

## Requirements

- Node.js 18 or newer and npm
- A MongoDB Atlas connection string and a database user with read/write access

## Run Eventrix locally

1. In MongoDB Atlas, create a database user, allow your development IP address, and copy the connection string.
2. Open a terminal in the project folder and create the backend environment file:

   ```powershell
   Copy-Item server\.env.example server\.env
   ```

3. Edit `server\.env`. Replace the MongoDB placeholders and set a long, private `JWT_SECRET`. Keep this file local; it contains secrets.
4. Install and seed the backend:

   ```powershell
   cd server
   npm install
   npm run seed
   ```

   The seed command creates the demo organizer and eight upcoming sample events with unique category-matched images and INR prices. It replaces that organizer's existing sample events each time it runs; other users' events and bookings are not changed.
5. In the same `server` folder, start the API:

   ```powershell
   npm run dev
   ```

   The API listens at `http://localhost:5000`. On startup it additively backfills legacy event fields (`availableSeats`, `location`, and `image`) into the current schema fields; the original fields are retained. `http://localhost:5173` is allowed by CORS by default.
6. Open a second terminal at the project root and install/start the frontend:

   ```powershell
   npm install
   npm run dev
   ```

7. Open `http://localhost:5173`.

The frontend uses `http://localhost:5000/api` by default. To use a different API address, create a root `.env` containing `VITE_API_URL=http://your-api-host/api`, then restart Vite.

### Demo organizer login

- Email: `organizer@eventrix.demo`
- Password: `EventrixDemo2026!`

New accounts are attendee accounts. To try the organizer dashboard, use the seeded organizer account.

## API endpoints

All responses use a JSON envelope such as `{ "success": true, "data": ... }`. Errors use `{ "success": false, "message": "..." }`. Protected endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Create an attendee account |
| POST | `/api/auth/login` | Public | Sign in and receive a JWT |
| GET | `/api/auth/me` | Signed in | Read the current account and saved events |
| GET | `/api/health` | Public | Check that the API is running |
| GET | `/api/events` | Public | Browse events; supports `search`, `category`, `sort`, and `upcoming` |
| GET | `/api/events/:id` | Public | Read one event |
| GET | `/api/events/:id/reviews` | Public | List event reviews |
| GET | `/api/events/:id/reviews/mine` | Signed in | Check review eligibility and read your review |
| POST | `/api/events/:id/reviews` | Confirmed attendee | Create one review for the event |
| PATCH | `/api/events/:id/reviews/:reviewId` | Review owner | Edit your review |
| DELETE | `/api/events/:id/reviews/:reviewId` | Review owner | Delete your review |
| POST | `/api/events` | Organizer | Create an event |
| GET | `/api/events/mine` | Organizer | List the organizer's events |
| GET | `/api/events/analytics` | Organizer | Read event, booking, revenue, and seat totals |
| GET | `/api/events/:id/attendees` | Organizer | List confirmed attendees for an owned event |
| PATCH | `/api/events/:id` | Organizer | Edit an owned event |
| DELETE | `/api/events/:id` | Organizer | Delete an owned event with no confirmed bookings |
| POST | `/api/events/:id/wishlist` | Signed in | Save or unsave an event |
| POST | `/api/bookings/events/:eventId` | Signed in | Atomically reserve the selected `seatIds` |
| GET | `/api/bookings/my-bookings` | Signed in | List the current user's bookings |
| GET | `/api/bookings/:id/pass` | Booking owner | Read a ticket pass |
| DELETE | `/api/bookings/:id` | Booking owner | Cancel a booking and return its seats |

Legacy booking aliases `/api/bookings/mine` and `PATCH /api/bookings/:id/cancel` remain available. Event links shared by Eventrix use `/event/:id`; the existing `/events/:id` route remains supported. `sort` accepts `date`, `priceAsc`, or `priceDesc`. `category` accepts `Music`, `Tech`, `Food`, `Art`, `Sports`, `Wedding`, `Comedy`, or `Workshop`.

## Folder structure

```text
Eventrix/
├── index.html                 Vite's HTML entry point
├── package.json               Frontend scripts and dependencies
├── src/
│   ├── App.jsx                Page routes and shared layout
│   ├── main.jsx               React entry point and app providers
│   ├── index.css              Theme, components, and responsive layouts
│   ├── components/            Reusable navigation, cards, and loading UI
│   ├── context/               Shared authentication and toast state
│   ├── hooks/                 Reusable wishlist state
│   ├── pages/                 Screen-level components
│   └── services/api.js         Axios setup and API error messages
└── server/
    ├── index.js                Express app and middleware
    ├── seed.js                 Demo organizer and sample events
    ├── config/                 MongoDB connection
    ├── controllers/            Request handling and booking rules
    ├── middleware/             JWT and organizer checks
    ├── models/                 Mongoose schemas
    └── routes/                 API route definitions
```

## Interview Q&A

### 1. How does JWT authentication work here?

After login, the API checks the password against its bcrypt hash and signs a JWT with the user's ID and role. The frontend stores that token and Axios sends it as a bearer token. The authentication middleware verifies it and loads the account before protected handlers run.

### 2. How are protected routes implemented?

The React `ProtectedRoute` checks the account from `AuthContext` before rendering a route. The backend also has `requireAuth` and `requireOrganizer` middleware, so hiding a page in the browser is not the only security check.

### 3. How does seat booking work?

The attendee selects seat IDs from the event's generated layout. The API validates the IDs and uses one MongoDB conditional update to decrement `seatsAvailable` and add those IDs only if they are still free. If creating the booking fails, the API restores both the available count and booked-seat list.

### 4. How does Eventrix prevent duplicate seat reservations?

Seat availability, event capacity, and the booked-seat array are checked and updated in one atomic `findOneAndUpdate`. If two people select the same seat concurrently, only one reservation succeeds and the other receives a seat conflict.

### 5. What happens when someone cancels a booking?

The API changes only that user's confirmed booking to cancelled, increments the event's available seat count, and removes that booking's seat IDs. The conditional status update prevents the same booking from returning seats more than once.

### 6. Who can review an event?

Only an attendee with a confirmed booking can submit a review. A unique database index enforces one review per user and event; the review owner can edit or delete it.

### 7. Why hash passwords instead of encrypting them?

Passwords should not be recoverable by the application. bcrypt stores a one-way hash with a work factor, and login compares the supplied password with that hash.

### 8. Why is there both frontend and backend validation?

Frontend checks help people fix form mistakes quickly. Backend checks are still required because API requests can come from outside the UI and must not be trusted.

## Notes

- Ticket payments are not processed; prices and revenue are demo data.
- The pass includes a QR code containing the booking ID and can be added to a calendar; it is not a payment or scanner integration.
- Event email sharing opens a prefilled draft in the user's mail application; Eventrix does not send emails.
- For a production launch, use HTTPS, a managed secret store, stricter rate limiting, email verification, and a real payment provider.
