"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const LiveMap = dynamic(() => import("@/components/LiveMap"), {
  ssr: false,
});

type Location = {
  animal_id: string;
  lat: number;
  lng: number;
  battery: number;
  created_at: string;
};

export default function DashboardPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadLocations() {
    const { data, error } = await supabase
      .from("animal_locations")
      .select("animal_id, lat, lng, battery, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Supabase error:", error);
      setLoading(false);
      return;
    }

    const latestByAnimal = new Map<string, Location>();

    for (const item of data || []) {
      if (!latestByAnimal.has(item.animal_id)) {
        latestByAnimal.set(item.animal_id, item);
      }
    }

    setLocations(Array.from(latestByAnimal.values()));
    setLoading(false);
  }

  useEffect(() => {
    loadLocations();

    const interval = setInterval(loadLocations, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="border-b border-neutral-800 p-5">
        <h1 className="text-2xl font-bold">HerdTrack Dashboard</h1>
        <p className="text-neutral-400">
          Онлайн-карта животных: {locations.length}
        </p>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            Загрузка карты...
          </div>
        ) : (
          <LiveMap locations={locations} />
        )}
      </div>
    </main>
  );
}