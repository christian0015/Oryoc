// app/page.tsx
import { searchListings } from "@/lib/actions/listings";
import { searchEvents } from "@/lib/actions/events";
import { HomeView } from "@/components/home-view";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [listingsRes, eventsRes] = await Promise.all([
    searchListings({}, 1),
    searchEvents({}),
  ]);

  const listings = listingsRes.ok ? listingsRes.data.listings.slice(0, 6) : [];
  const events = eventsRes.ok ? eventsRes.data.slice(0, 3) : [];

  return <HomeView listings={listings} events={events} />;
}
