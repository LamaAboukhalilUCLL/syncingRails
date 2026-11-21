"use client";

import { useEffect, useRef, useState } from "react";
import type { Station } from "@/lib/types";

interface Props {
  label: string;
  value: Station | null;
  onChange: (s: Station | null) => void;
  placeholder?: string;
}

/** Text box with live station suggestions from /api/stations. */
export default function StationInput({ label, value, onChange, placeholder }: Props) {
  // null = not editing, show the selected station's name.
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? value?.name ?? "";
  const [results, setResults] = useState<Station[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced search while typing.
  useEffect(() => {
    if (!open || draft === null || draft.trim().length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stations?q=${encodeURIComponent(draft.trim())}`, { signal: ctrl.signal });
        const data = await res.json();
        setResults(data.stations ?? []);
      } catch {
        /* aborted or offline */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [draft, open]);

  // Close the list when clicking elsewhere.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={boxRef} className="relative flex-1 min-w-0">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</label>
      <input
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          setDraft(e.target.value);
          setOpen(true);
          if (value) onChange(null);
        }}
        onFocus={() => setOpen(true)}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
      />
      {open && (loading || results.length > 0) && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {loading && results.length === 0 && <li className="px-4 py-3 text-sm text-slate-500">Searching…</li>}
          {results.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(s);
                  setDraft(null);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-slate-800 hover:bg-amber-50"
              >
                <span className="truncate">🚉 {s.name}</span>
                {s.country && <span className="ml-2 text-xs text-slate-400">{s.country}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
