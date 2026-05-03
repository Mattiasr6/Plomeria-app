"use client";

import { Plus, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Item {
  description: string;
  unit: string;
  quantity: number | null;
  unit_price: number | null;
}

interface ItemsSectionProps {
  title: string;
  icon: LucideIcon;
  items: Item[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof Item, value: string | number | null) => void;
  total: number;
  emptyMessage: string;
  units?: string[];
  descriptionPlaceholder?: string;
}

export function ItemsSection({
  title,
  icon: Icon,
  items,
  onAdd,
  onRemove,
  onUpdate,
  total,
  emptyMessage,
  units = ["pza", "m", "hr", "glb"],
  descriptionPlaceholder,
}: ItemsSectionProps) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="text-blue-600" size={20} />
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
        >
          <Plus size={16} />
          Agregar
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-gray-400">{emptyMessage}</p>
      )}

      <div className="space-y-3" aria-live="polite" aria-atomic="true">
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border bg-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                Item #{i + 1}
              </span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-gray-400 hover:text-red-500"
                aria-label={`Eliminar item ${i + 1}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={item.description}
                onChange={(e) => onUpdate(i, "description", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder={descriptionPlaceholder || "Descripción"}
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500">
                    Unidad
                  </label>
                  <select
                    value={item.unit}
                    onChange={(e) => onUpdate(i, "unit", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>
                        {u.charAt(0).toUpperCase() + u.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.quantity ?? ""}
                    onChange={(e) =>
                      onUpdate(
                        i,
                        "quantity",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">
                    P. Unit. (Bs.)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unit_price ?? ""}
                    onChange={(e) =>
                      onUpdate(
                        i,
                        "unit_price",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="text-right text-sm font-medium text-gray-700">
                Total: Bs.{" "}
                {((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 border-t pt-3 text-right">
        <span className="text-sm font-semibold text-gray-900">
          Total {title}: Bs. {total.toFixed(2)}
        </span>
      </div>
    </section>
  );
}
