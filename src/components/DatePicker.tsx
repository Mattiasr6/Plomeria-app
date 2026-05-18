"use client";

import { useState } from "react";

interface DatePickerProps {
  label: string;
  value: string; // "YYYY-MM-DD" or ""
  onChange: (val: string) => void;
}

const MONTHS = [
  { value: "01", label: "Ene" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Abr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Ago" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dic" },
];

function getDaysInMonth(month: string, year: string): number {
  if (!month || !year) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

const DAYS = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);

function parseDate(value: string) {
  if (!value) return { day: "", month: "", year: "" };
  const [y, m, d] = value.split("-");
  return { year: y || "", month: m || "", day: d || "" };
}

function buildDate(day: string, month: string, year: string) {
  if (!day || !month || !year) return "";
  return `${year}-${month}-${day}`;
}

function formatDisplay(value: string) {
  if (!value) return "";
  const { year, month, day } = parseDate(value);
  const monthLabel = MONTHS.find((m) => m.value === month)?.label || month;
  return `${day} ${monthLabel} ${year}`;
}

export function DatePicker({ label, value, onChange }: DatePickerProps) {
  const [show, setShow] = useState(false);

  // Temporary state while modal is open — only committed on "Aceptar"
  const [tempDay, setTempDay] = useState("");
  const [tempMonth, setTempMonth] = useState("");
  const [tempYear, setTempYear] = useState("");

  function openModal() {
    const { day, month, year } = parseDate(value);
    const currentYear = String(new Date().getFullYear());
    setTempDay(day);
    setTempMonth(month);
    setTempYear(year || currentYear);
    setShow(true);
  }

  function accept() {
    onChange(buildDate(tempDay, tempMonth, tempYear));
    setShow(false);
  }

  function cancel() {
    setShow(false);
  }

  const maxDays = getDaysInMonth(tempMonth, tempYear);
  const validDays = DAYS.slice(0, maxDays);

  function handleMonthChange(month: string) {
    setTempMonth(month);
    if (Number(tempDay) > getDaysInMonth(month, tempYear)) {
      setTempDay(String(getDaysInMonth(month, tempYear)).padStart(2, "0"));
    }
  }

  const displayValue = formatDisplay(value);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type="text"
        readOnly
        value={displayValue}
        placeholder="Seleccionar fecha"
        onClick={openModal}
        onFocus={openModal}
        className={`mt-1 w-full cursor-pointer rounded-lg border bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none ${
          displayValue ? "text-gray-900" : "text-gray-400"
        }`}
      />

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            {/* 3-column select grid */}
            <div className="grid grid-cols-3 gap-2">
              <select
                value={tempDay}
                onChange={(e) => setTempDay(e.target.value)}
                className="w-full appearance-none rounded-lg border bg-white px-2 py-3 text-center text-base focus:border-blue-500 focus:outline-none"
              >
                <option value="" disabled>
                  Día
                </option>
                {validDays.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={tempMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="w-full appearance-none rounded-lg border bg-white px-2 py-3 text-center text-base focus:border-blue-500 focus:outline-none"
              >
                <option value="" disabled>
                  Mes
                </option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-center rounded-lg border bg-gray-50 px-2 py-3 text-base text-gray-700">
                {tempYear || String(new Date().getFullYear())}
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={cancel}
                className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={accept}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
