import { CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";

// Guide visitors toward the next useful action when there is no content.
export default function EmptyState({ title, message, action = "Explore events", to = "/events" }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><CalendarDays size={23} /></span>
      <h3>{title}</h3>
      <p>{message}</p>
      <Link className="button button-outline" to={to}>{action}</Link>
    </div>
  );
}
