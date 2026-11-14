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




- The pass includes a QR code containing the booking ID and can be added to a calendar; it is not a payment or scanner integration.
- Event email sharing opens a prefilled draft in the user's mail application; Eventrix does not send emails.
- For a production launch, use HTTPS, a managed secret store, stricter rate limiting, email verification, and a real payment provider.
