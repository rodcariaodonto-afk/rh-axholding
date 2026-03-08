import * as React from "react";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DatePickerWithYearMonthProps {
  selected?: Date | null;
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
  fromYear?: number;
  toYear?: number;
  defaultMonth?: Date;
}

export function DatePickerWithYearMonth({
  selected,
  onSelect,
  disabled,
  className,
  fromYear = 1940,
  toYear = new Date().getFullYear(),
  defaultMonth,
}: DatePickerWithYearMonthProps) {
  const [month, setMonth] = React.useState<Date>(selected || defaultMonth || new Date());

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  const years = Array.from(
    { length: toYear - fromYear + 1 },
    (_, i) => toYear - i
  );

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = new Date(month);
    newMonth.setMonth(parseInt(e.target.value));
    setMonth(newMonth);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = new Date(month);
    newMonth.setFullYear(parseInt(e.target.value));
    setMonth(newMonth);
  };

  return (
    <div className={cn("space-y-3 pointer-events-auto", className)}>
      <div className="flex gap-2 px-3 relative z-50">
        <select
          value={month.getMonth()}
          onChange={handleMonthChange}
          className="flex-1 h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring pointer-events-auto relative z-50"
        >
          {months.map((monthName, index) => (
            <option key={index} value={index}>{monthName}</option>
          ))}
        </select>

        <select
          value={month.getFullYear()}
          onChange={handleYearChange}
          className="w-[90px] h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring pointer-events-auto relative z-50"
        >
          {years.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <Calendar
        mode="single"
        selected={selected ?? undefined}
        onSelect={onSelect}
        month={month}
        onMonthChange={setMonth}
        disabled={disabled}
        locale={ptBR}
        className="pointer-events-auto"
        classNames={{
          caption: "hidden",
          caption_label: "hidden",
          nav: "hidden",
          nav_button: "hidden",
          nav_button_previous: "hidden",
          nav_button_next: "hidden",
        }}
      />
    </div>
  );
}
