import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { LOAN } from "@/lib/tokens";
import { Button } from "@/components/patterns";

export type FilterOption = { key: string; label: string };

/** Pill-button dropdown shared by the loan pages' Product/Branch/Officer
 * filters - shows `placeholder` when nothing is selected, closes on outside
 * click. */
export function FilterDropdown({
  placeholder,
  options,
  selectedKey,
  onSelect,
}: {
  placeholder: string;
  options: FilterOption[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selectedLabel = options.find((o) => o.key === selectedKey)?.label ?? null;

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        iconRight={<ChevronDown size={12} />}
        onClick={() => setOpen((v) => !v)}
      >
        {selectedLabel ?? placeholder}
      </Button>
      {open && (
        <div
          className="absolute z-10 mt-1 bg-white"
          style={{
            border: `1px solid ${LOAN.border}`,
            borderRadius: 8,
            minWidth: 200,
            maxHeight: 280,
            overflowY: "auto",
            padding: 4,
          }}
        >
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setOpen(false);
            }}
            className="block w-full text-left"
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              fontSize: 13,
              color: LOAN.ink,
              background: !selectedKey ? LOAN.pageBg : "transparent",
            }}
          >
            {placeholder}
          </button>
          {options.length === 0 && (
            <div style={{ padding: "8px 10px", fontSize: 12, color: LOAN.muted }}>None found</div>
          )}
          {options.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => {
                onSelect(o.key);
                setOpen(false);
              }}
              className="block w-full text-left"
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                fontSize: 13,
                color: LOAN.ink,
                background: selectedKey === o.key ? LOAN.pageBg : "transparent",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
