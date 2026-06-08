"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Animal = {
  id: string;
  name: string;
  type: "cow" | "horse" | "sheep" | "goat" | "other";
};

const ANIMAL_TYPES: Record<Animal["type"], { emoji: string; label: string }> = {
  cow: { emoji: "🐄", label: "Корова" },
  horse: { emoji: "🐴", label: "Лошадь" },
  sheep: { emoji: "🐑", label: "Овца" },
  goat: { emoji: "🐐", label: "Коза" },
  other: { emoji: "📍", label: "Другое" },
};

const STORAGE_KEY = "herdtrack_animals";

function loadAnimals(): Animal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAnimals(animals: Animal[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(animals));
}

export default function TrackerPage() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<Animal["type"]>("cow");

  // Tracking state
  const [status, setStatus] = useState("Не запущено");
  const [isTracking, setIsTracking] = useState(false);
  const [lastLocation, setLastLocation] = useState<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);

  useEffect(() => {
    setAnimals(loadAnimals());
  }, []);

  // --- Animal Management ---

  function addAnimal() {
    const trimmedId = newId.trim();
    const trimmedName = newName.trim();

    if (!trimmedId) return;
    if (animals.some((a) => a.id === trimmedId)) {
      alert("Животное с таким ID уже существует");
      return;
    }

    const animal: Animal = {
      id: trimmedId,
      name: trimmedName || trimmedId,
      type: newType,
    };

    const updated = [...animals, animal];
    setAnimals(updated);
    saveAnimals(updated);
    setNewId("");
    setNewName("");
    setNewType("cow");
    setShowAddForm(false);
    setSelectedAnimal(animal);
  }

  function removeAnimal(id: string) {
    if (selectedAnimal?.id === id && isTracking) {
      stopTracking();
    }
    const updated = animals.filter((a) => a.id !== id);
    setAnimals(updated);
    saveAnimals(updated);
    if (selectedAnimal?.id === id) {
      setSelectedAnimal(null);
    }
  }

  // --- GPS Tracking ---

  const sendLocation = useCallback(
    async (position: GeolocationPosition) => {
      if (!selectedAnimal) return;

      const now = Date.now();
      if (now - lastSentRef.current < 10000) return;
      lastSentRef.current = now;

      const payload = {
        animal_id: selectedAnimal.id,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed,
        battery: 90,
      };

      const { error } = await supabase
        .from("animal_locations")
        .insert(payload);

      if (error) {
        setStatus("Ошибка отправки GPS");
        console.error(error);
        return;
      }

      setLastLocation(payload);
      setStatus("GPS отправлен ✓");
    },
    [selectedAnimal]
  );

  function startTracking(highAccuracy = true) {
    if (!selectedAnimal) return;
    if (!navigator.geolocation) {
      setStatus("GPS не поддерживается браузером");
      return;
    }

    setIsTracking(true);
    setStatus(highAccuracy ? "Запрашиваю точный GPS..." : "Определяю по сети...");

    watchIdRef.current = navigator.geolocation.watchPosition(
      sendLocation,
      (error) => {
        console.error("GPS error:", error.code, error.message);
        const messages: Record<number, string> = {
          1: "Доступ к GPS запрещён. Разрешите геолокацию в настройках браузера.",
          2: "GPS недоступен на этом устройстве.",
          3: "Таймаут GPS — не удалось определить координаты.",
        };

        if (error.code === 3 && highAccuracy) {
          stopTracking();
          startTracking(false);
          return;
        }

        setStatus(messages[error.code] || "Ошибка GPS: " + error.message);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: highAccuracy,
        maximumAge: 10000,
        timeout: 30000,
      }
    );
  }

  function stopTracking() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setStatus("Остановлено");
  }

  // --- UI ---

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-md mx-auto space-y-5">
        <h1 className="text-2xl font-bold">🐄 HerdTrack Tracker</h1>

        {/* --- Animal List --- */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-neutral-400 font-medium">Мои животные</p>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {showAddForm ? "Отмена" : "+ Добавить"}
            </button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <div className="space-y-3 mb-4 p-3 rounded-lg bg-neutral-800/50 border border-neutral-700">
              <input
                type="text"
                placeholder="ID (например: cow_002)"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <input
                type="text"
                placeholder="Имя (необязательно)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <div className="flex gap-2 flex-wrap">
                {Object.entries(ANIMAL_TYPES).map(([key, { emoji, label }]) => (
                  <button
                    key={key}
                    onClick={() => setNewType(key as Animal["type"])}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm border transition-colors ${
                      newType === key
                        ? "bg-blue-600 border-blue-500"
                        : "bg-neutral-800 border-neutral-700 hover:border-neutral-600"
                    }`}
                  >
                    {emoji} {label}
                  </button>
                ))}
              </div>
              <button
                onClick={addAnimal}
                disabled={!newId.trim()}
                className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Добавить животное
              </button>
            </div>
          )}

          {/* Animal cards */}
          {animals.length === 0 && !showAddForm && (
            <p className="text-neutral-500 text-sm py-2">
              Нет добавленных животных. Нажмите &quot;+ Добавить&quot;.
            </p>
          )}

          <div className="space-y-2">
            {animals.map((animal) => {
              const info = ANIMAL_TYPES[animal.type];
              const isSelected = selectedAnimal?.id === animal.id;

              return (
                <div
                  key={animal.id}
                  onClick={() => {
                    if (isTracking) return;
                    setSelectedAnimal(isSelected ? null : animal);
                    setLastLocation(null);
                    setStatus("Не запущено");
                  }}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer border transition-all ${
                    isSelected
                      ? "bg-blue-600/20 border-blue-500/50"
                      : "bg-neutral-800/50 border-neutral-800 hover:border-neutral-700"
                  } ${isTracking && !isSelected ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{info.emoji}</span>
                    <div>
                      <p className="text-sm font-medium">{animal.name}</p>
                      <p className="text-xs text-neutral-500">{animal.id}</p>
                    </div>
                  </div>

                  {!isTracking && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Удалить ${animal.name}?`)) {
                          removeAnimal(animal.id);
                        }
                      }}
                      className="text-neutral-600 hover:text-red-400 text-lg transition-colors"
                      title="Удалить"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* --- Tracking Panel --- */}
        {selectedAnimal && (
          <>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-sm text-neutral-400">Статус</p>
              <p className="text-lg">
                {ANIMAL_TYPES[selectedAnimal.type].emoji} {selectedAnimal.name} — {status}
              </p>
            </div>

            {lastLocation && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm space-y-1">
                <p>Lat: {lastLocation.lat}</p>
                <p>Lng: {lastLocation.lng}</p>
                <p>Accuracy: {Math.round(lastLocation.accuracy)} м</p>
              </div>
            )}

            {!isTracking ? (
              <button
                onClick={() => startTracking()}
                className="w-full rounded-xl bg-green-600 py-3 font-semibold hover:bg-green-500 transition-colors"
              >
                ▶ Старт GPS
              </button>
            ) : (
              <button
                onClick={stopTracking}
                className="w-full rounded-xl bg-red-600 py-3 font-semibold hover:bg-red-500 transition-colors"
              >
                ⏹ Стоп
              </button>
            )}
          </>
        )}
      </div>
    </main>
  );
}