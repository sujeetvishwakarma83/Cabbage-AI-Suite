import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { searchPlaces } from "@/lib/places.functions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, MapPin, Star, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuickOutreachDialog } from "@/components/QuickOutreachDialog";

export const Route = createFileRoute("/_authenticated/finder")({
  head: () => ({ meta: [{ title: "Client Finder — CabbageCode" }] }),
  component: Finder,
});

const SUGGESTIONS = [
  "Restaurant",
  "Cafe",
  "Gym",
  "Dentist",
  "Law Firm",
  "Hotel",
  "Real Estate",
  "Salon",
  "Doctor",
  "Car Dealer",
];

const LOCATION_DATA = [
  {
    name: "USA",
    code: "USA",
    states: [
      {
        name: "California",
        cities: ["San Francisco", "Los Angeles", "San Diego", "San Jose", "Sacramento", "Oakland"],
      },
      {
        name: "New York",
        cities: ["New York City", "Buffalo", "Rochester", "Albany", "Syracuse"],
      },
      {
        name: "Texas",
        cities: ["Houston", "Austin", "Dallas", "San Antonio", "Fort Worth", "El Paso"],
      },
      {
        name: "Florida",
        cities: ["Miami", "Orlando", "Tampa", "Jacksonville", "St. Petersburg", "Tallahassee"],
      },
      {
        name: "Illinois",
        cities: ["Chicago", "Aurora", "Rockford", "Joliet", "Naperville"],
      },
    ],
  },
  {
    name: "Canada",
    code: "Canada",
    states: [
      {
        name: "Ontario",
        cities: ["Toronto", "Ottawa", "Mississauga", "Hamilton", "Brampton", "London"],
      },
      {
        name: "Quebec",
        cities: ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil"],
      },
      {
        name: "British Columbia",
        cities: ["Vancouver", "Victoria", "Surrey", "Burnaby", "Richmond", "Coquitlam"],
      },
      {
        name: "Alberta",
        cities: ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "St. Albert"],
      },
    ],
  },
  {
    name: "India",
    code: "India",
    states: [
      {
        name: "Andhra Pradesh",
        cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati"],
      },
      {
        name: "Arunachal Pradesh",
        cities: ["Itanagar", "Naharlagun", "Pasighat", "Tawang"],
      },
      {
        name: "Assam",
        cities: ["Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Tezpur"],
      },
      {
        name: "Bihar",
        cities: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga"],
      },
      {
        name: "Chhattisgarh",
        cities: ["Raipur", "Bilaspur", "Durg", "Bhilai", "Korba"],
      },
      {
        name: "Delhi",
        cities: ["New Delhi", "Noida", "Gurgaon", "Dwarka", "Faridabad"],
      },
      {
        name: "Goa",
        cities: ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
      },
      {
        name: "Gujarat",
        cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
      },
      {
        name: "Haryana",
        cities: ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal"],
      },
      {
        name: "Himachal Pradesh",
        cities: ["Shimla", "Dharamshala", "Solan", "Mandi", "Manali"],
      },
      {
        name: "Jammu & Kashmir",
        cities: ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
      },
      {
        name: "Jharkhand",
        cities: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar"],
      },
      {
        name: "Karnataka",
        cities: ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum"],
      },
      {
        name: "Kerala",
        cities: ["Kochi", "Trivandrum", "Kozhikode", "Thrissur", "Kollam"],
      },
      {
        name: "Madhya Pradesh",
        cities: ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain"],
      },
      {
        name: "Maharashtra",
        cities: ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad"],
      },
      {
        name: "Manipur",
        cities: ["Imphal", "Thoubal", "Kakching"],
      },
      {
        name: "Meghalaya",
        cities: ["Shillong", "Tura", "Jowai"],
      },
      {
        name: "Mizoram",
        cities: ["Aizawl", "Lunglei", "Champhai"],
      },
      {
        name: "Nagaland",
        cities: ["Kohima", "Dimapur", "Mokokchung"],
      },
      {
        name: "Odisha",
        cities: ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Sambalpur"],
      },
      {
        name: "Punjab",
        cities: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali"],
      },
      {
        name: "Rajasthan",
        cities: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer"],
      },
      {
        name: "Sikkim",
        cities: ["Gangtok", "Namchi", "Geyzing"],
      },
      {
        name: "Tamil Nadu",
        cities: ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Tiruppur"],
      },
      {
        name: "Telangana",
        cities: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
      },
      {
        name: "Tripura",
        cities: ["Agartala", "Dharmanagar", "Udaipur"],
      },
      {
        name: "Uttar Pradesh",
        cities: [
          "Lucknow",
          "Kanpur",
          "Varanasi",
          "Agra",
          "Meerut",
          "Ghaziabad",
          "Prayagraj",
          "Noida",
        ],
      },
      {
        name: "Uttarakhand",
        cities: ["Dehradun", "Haridwar", "Rishikesh", "Haldwani", "Roorkee"],
      },
      {
        name: "West Bengal",
        cities: ["Kolkata", "Howrah", "Darjeeling", "Siliguri", "Asansol", "Durgapur"],
      },
    ],
  },
  {
    name: "UK",
    code: "UK",
    states: [
      {
        name: "England",
        cities: [
          "London",
          "Birmingham",
          "Manchester",
          "Liverpool",
          "Leeds",
          "Sheffield",
          "Bristol",
        ],
      },
      {
        name: "Scotland",
        cities: ["Edinburgh", "Glasgow", "Aberdeen", "Dundee", "Inverness"],
      },
      {
        name: "Wales",
        cities: ["Cardiff", "Swansea", "Newport", "Wrexham"],
      },
      {
        name: "Northern Ireland",
        cities: ["Belfast", "Derry", "Lisburn", "Newry", "Armagh"],
      },
    ],
  },
  {
    name: "Germany",
    code: "Germany",
    states: [
      {
        name: "Bavaria",
        cities: ["Munich", "Nuremberg", "Augsburg", "Regensburg", "Ingolstadt", "Würzburg"],
      },
      {
        name: "Berlin",
        cities: ["Berlin"],
      },
      {
        name: "Hamburg",
        cities: ["Hamburg"],
      },
      {
        name: "North Rhine-Westphalia",
        cities: ["Cologne", "Düsseldorf", "Dortmund", "Essen", "Duisburg", "Bonn"],
      },
      {
        name: "Baden-Württemberg",
        cities: ["Stuttgart", "Karlsruhe", "Mannheim", "Freiburg", "Heidelberg"],
      },
    ],
  },
];

function Finder() {
  const navigate = useNavigate();
  const search = useServerFn(searchPlaces);
  const [country, setCountry] = useState("USA");
  const [state, setState] = useState("California");
  const [city, setCity] = useState("San Francisco");
  const [keyword, setKeyword] = useState("Restaurant");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    const countryData = LOCATION_DATA.find((c) => c.code === newCountry);
    if (countryData && countryData.states.length > 0) {
      const defaultState = countryData.states[0];
      setState(defaultState.name);
      if (defaultState.cities.length > 0) {
        setCity(defaultState.cities[0]);
      } else {
        setCity("");
      }
    } else {
      setState("");
      setCity("");
    }
  };

  const handleStateChange = (newState: string) => {
    setState(newState);
    const countryData = LOCATION_DATA.find((c) => c.code === country);
    if (countryData) {
      const stateData = countryData.states.find((s) => s.name === newState);
      if (stateData && stateData.cities.length > 0) {
        setCity(stateData.cities[0]);
      } else {
        setCity("");
      }
    }
  };

  const currentCountryData = LOCATION_DATA.find((c) => c.code === country);
  const currentStates = currentCountryData ? currentCountryData.states : [];
  const currentStateData = currentStates.find((s) => s.name === state);
  const currentCities = currentStateData ? currentStateData.cities : [];

  const mut = useMutation({
    mutationFn: () => search({ data: { query: keyword, city, state, country, limit: 20 } }),
    onSuccess: (res) => {
      toast.success(`Saved ${res.inserted} businesses to your leads.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Client Finder</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pull live local businesses from Google Maps in seconds.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!keyword) {
            toast.error("Pick a keyword");
            return;
          }
          mut.mutate();
        }}
        className="glass rounded-2xl p-6 space-y-4"
      >
        <div className="grid md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="country">Country</Label>
            <Select value={country} onValueChange={handleCountryChange}>
              <SelectTrigger
                id="country"
                className="w-full bg-background/50 backdrop-blur-xs cursor-pointer"
              >
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_DATA.map((c) => (
                  <SelectItem key={c.code} value={c.code} className="cursor-pointer">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              list="states-list"
              value={state}
              onChange={(e) => handleStateChange(e.target.value)}
              placeholder="e.g. Uttar Pradesh, Texas"
              className="w-full bg-background/50 backdrop-blur-xs"
            />
            <datalist id="states-list">
              {currentStates.map((s) => (
                <option key={s.name} value={s.name} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="city">City / District / Neighborhood</Label>
            <Input
              id="city"
              list="cities-list"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Jaunpur, Austin"
              className="w-full bg-background/50 backdrop-blur-xs"
            />
            <datalist id="cities-list">
              {currentCities.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="keyword">Keyword</Label>
            <Select value={keyword} onValueChange={setKeyword}>
              <SelectTrigger
                id="keyword"
                className="w-full bg-background/50 backdrop-blur-xs cursor-pointer"
              >
                <SelectValue placeholder="Select Keyword" />
              </SelectTrigger>
              <SelectContent>
                {SUGGESTIONS.map((s) => (
                  <SelectItem key={s} value={s} className="cursor-pointer">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setKeyword(s)}
              className="text-xs px-3 py-1 rounded-full border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/40 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={mut.isPending} className="gap-2 glow-primary">
            {mut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Search Google Maps
          </Button>
        </div>
      </form>

      {mut.data && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{mut.data.inserted} businesses saved</h3>
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/leads" })}>
              Open Leads & CRM
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {mut.data.leads.map((l: any) => (
              <div
                key={l.id}
                className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{l.business_name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {l.address ?? "—"}
                    </div>
                  </div>
                  {l.rating != null && (
                    <div className="flex items-center gap-1 text-xs font-medium">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      {l.rating}{" "}
                      <span className="text-muted-foreground">({l.reviews_count ?? 0})</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 mt-1">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {l.website && (
                      <a
                        href={l.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        Website
                      </a>
                    )}
                    {l.phone && (
                      <a href={`tel:${l.phone}`} className="text-primary hover:underline">
                        {l.phone}
                      </a>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedLeadId(l.id);
                      setDialogOpen(true);
                    }}
                    className="gap-1.5 px-3 h-8 text-xs font-medium"
                  >
                    <Sparkles className="h-3 w-3" /> Analyze & Outreach
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <QuickOutreachDialog leadId={selectedLeadId} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
