import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({
  query: z.string().min(2).max(200),
  city: z.string().max(120).optional(),
  state: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
  limit: z.number().int().min(1).max(20).default(20),
});

interface PlaceResult {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  primaryTypeDisplayName?: { text?: string };
  googleMapsUri?: string;
  location?: { latitude?: number; longitude?: number };
}

export const searchPlaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data, context }) => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const gmapsKey =
      process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;

    const where = [data.city, data.state, data.country].filter(Boolean).join(", ");
    const textQuery = where ? `${data.query} in ${where}` : data.query;

    let res;
    if (lovableKey && gmapsKey) {
      res = await fetch(
        "https://connector-gateway.lovable.dev/google_maps/places/v1/places:searchText",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "X-Connection-Api-Key": gmapsKey,
            "Content-Type": "application/json",
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.primaryTypeDisplayName,places.googleMapsUri,places.location",
          },
          body: JSON.stringify({ textQuery, pageSize: data.limit }),
        },
      );
    } else if (gmapsKey) {
      const request = getRequest();
      const referer = request?.headers?.get("referer") || "http://localhost:5173/";
      res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "X-Goog-Api-Key": gmapsKey,
          "Content-Type": "application/json",
          Referer: referer,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.primaryTypeDisplayName,places.googleMapsUri,places.location",
        },
        body: JSON.stringify({ textQuery, pageSize: data.limit }),
      });
    } else {
      throw new Error(
        "Missing Google Maps API Key. Please configure GOOGLE_MAPS_API_KEY or VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY in your .env file.",
      );
    }
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google Places error ${res.status}: ${errText.slice(0, 300)}`);
    }
    const json = (await res.json()) as { places?: PlaceResult[] };
    const places = json.places ?? [];

    const rows = places.map((p) => ({
      owner_id: context.userId,
      business_name: p.displayName?.text ?? "Unknown business",
      website: p.websiteUri ?? null,
      phone: p.internationalPhoneNumber ?? p.nationalPhoneNumber ?? null,
      address: p.formattedAddress ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      country: data.country ?? null,
      category: p.primaryTypeDisplayName?.text ?? data.query,
      rating: p.rating ?? null,
      reviews_count: p.userRatingCount ?? null,
      google_maps_url: p.googleMapsUri ?? null,
      place_id: p.id,
      latitude: p.location?.latitude ?? null,
      longitude: p.location?.longitude ?? null,
      status: "new" as const,
    }));

    if (rows.length === 0) return { inserted: 0, leads: [] };

    const { data: inserted, error } = await context.supabase
      .from("leads")
      .upsert(rows, { onConflict: "owner_id,place_id", ignoreDuplicates: false })
      .select("*");
    if (error) throw new Error(error.message);
    return { inserted: inserted?.length ?? 0, leads: inserted ?? [] };
  });
