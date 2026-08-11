// lib/i18n.ts
import type { Locale } from "@/types";

export const dictionary = {
  fr: {
    "nav.home": "Accueil",
    "nav.listings": "Logements",
    "nav.events": "Evenements",
    "nav.compensation": "Compensation",
    "nav.profile": "Profil",
    "auth.login": "Se connecter",
    "auth.register": "Creer un compte",
    "auth.logout": "Se deconnecter",
    "listing.contact": "Voir les coordonnees",
    "listing.favorite": "Ajouter aux favoris",
    "listing.publish": "Publier l'annonce",
    "listing.certified": "Certifie",
    "listing.tour360": "Visite 360",
    "listing.confirmStillAvailable": "Toujours disponible",
    "search.filters": "Filtres",
    "search.noResults": "Aucun logement ne correspond a ces criteres",
    "trust.reliability": "Fiabilite",
    "trust.respect": "Respect",
    "trust.social": "Sociabilite",
    "event.create": "Creer un evenement",
    "event.free": "Gratuit",
    "compensation.tripOffer": "Trajet propose",
    "compensation.transportRequest": "Demande de transport",
    "status.pending": "En attente",
    "status.active": "Actif",
    "status.trash": "Corbeille",
    "status.archived": "Archive",
  },
  en: {
    "nav.home": "Home",
    "nav.listings": "Listings",
    "nav.events": "Events",
    "nav.compensation": "Compensation",
    "nav.profile": "Profile",
    "auth.login": "Log in",
    "auth.register": "Create account",
    "auth.logout": "Log out",
    "listing.contact": "View contact details",
    "listing.favorite": "Add to favorites",
    "listing.publish": "Publish listing",
    "listing.certified": "Certified",
    "listing.tour360": "360 tour",
    "listing.confirmStillAvailable": "Still available",
    "search.filters": "Filters",
    "search.noResults": "No listings match these filters",
    "trust.reliability": "Reliability",
    "trust.respect": "Respect",
    "trust.social": "Sociability",
    "event.create": "Create event",
    "event.free": "Free",
    "compensation.tripOffer": "Trip offer",
    "compensation.transportRequest": "Transport request",
    "status.pending": "Pending",
    "status.active": "Active",
    "status.trash": "Trash",
    "status.archived": "Archived",
  },
} as const;

export type DictionaryKey = keyof (typeof dictionary)["fr"];

export function t(locale: Locale, key: DictionaryKey): string {
  return dictionary[locale]?.[key] ?? dictionary.fr[key] ?? key;
}

/** Resolves a reasonable default from the Accept-Language header; the
 * user's explicit choice (User.locale) always takes precedence once
 * they're signed in. */
export function resolveLocaleFromHeader(acceptLanguage: string | null): Locale {
  if (acceptLanguage?.toLowerCase().startsWith("en")) return "en";
  return "fr";
}
