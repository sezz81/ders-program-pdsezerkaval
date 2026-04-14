import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";

import { Box, Typography } from "@mui/material";

interface DateRangePickerProps {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
}

const toDate = (str: string): Date | undefined => {
  if (!str) return undefined;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const toStr = (date: Date | undefined): string => {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export function DateRangePicker({
  start,
  end,
  onChange,
}: DateRangePickerProps) {
  const selected: DateRange = {
    from: toDate(start),
    to: toDate(end),
  };

  const handleSelect = (range: DateRange | undefined) => {
    // When both dates are already selected and user clicks a new date,
    // react-day-picker resets to just the new from — pass empty end to start fresh
    onChange(toStr(range?.from), toStr(range?.to));
  };

  const label = selected.from
    ? selected.to
      ? `${selected.from.toLocaleDateString("tr-TR")} — ${selected.to.toLocaleDateString("tr-TR")}`
      : `${selected.from.toLocaleDateString("tr-TR")} — bitiş tarihi seçin`
    : "Başlangıç tarihine tıklayın";

  return (
    <Box>
      <Typography
        variant="body2"
        color={
          selected.from
            ? selected.to
              ? "success.main"
              : "primary.main"
            : "text.secondary"
        }
        sx={{ mb: 1.5, fontWeight: 600 }}
      >
        {label}
      </Typography>

      <Box
        sx={{
          "& .rdp-root": {
            "--rdp-accent-color": "#1d4ed8",
            "--rdp-accent-background-color": "rgba(29,78,216,0.10)",
            "--rdp-range-start-color": "#fff",
            "--rdp-range-end-color": "#fff",
            "--rdp-range-start-background": "#1d4ed8",
            "--rdp-range-end-background": "#1d4ed8",
            "--rdp-range-start-date-background-color": "#1d4ed8",
            "--rdp-range-end-date-background-color": "#1d4ed8",
            "--rdp-selected-border": "none",
            "--rdp-today-color": "#1d4ed8",
            "--rdp-font-family": "inherit",
            fontFamily: "inherit",
            width: "100%",
            margin: 0,
          },
          "& .rdp-month_grid": {
            width: "100%",
          },
          "& .rdp-day_button": {
            width: 40,
            height: 40,
            borderRadius: "8px",
            fontSize: 14,
            fontFamily: "inherit",
            cursor: "pointer",
          },
          "& .rdp-month_caption": {
            fontWeight: 700,
            fontSize: 15,
            fontFamily: "inherit",
            paddingBottom: "8px",
          },
          "& .rdp-weekday": {
            fontSize: 12,
            fontFamily: "inherit",
            opacity: 0.5,
          },
          "& .rdp-nav": {
            gap: "4px",
          },
        }}
      >
        <DayPicker
          mode="range"
          selected={selected}
          onSelect={handleSelect}
          numberOfMonths={1}
          showOutsideDays={false}
          formatters={{
            formatMonthDropdown: (month) =>
              [
                "Ocak",
                "Şubat",
                "Mart",
                "Nisan",
                "Mayıs",
                "Haziran",
                "Temmuz",
                "Ağustos",
                "Eylül",
                "Ekim",
                "Kasım",
                "Aralık",
              ][month.getMonth()],
            formatWeekdayName: (day) =>
              ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"][day.getDay()],
            formatCaption: (date) =>
              `${["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"][date.getMonth()]} ${date.getFullYear()}`,
          }}
          weekStartsOn={1}
        />
      </Box>
    </Box>
  );
}
