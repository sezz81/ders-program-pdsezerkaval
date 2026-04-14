import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";

import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";

import { DayCard } from "../components/DayCard";
import { formatCardTitle } from "../lib/date";
import { ProgramMetaHeader } from "../components/ProgramMetaHeader";
import { QuestionTrackerTable } from "../components/QuestionTrackerTable";
import { getTopicsForLesson } from "../lib/program";
import {
  UserRole,
  type ProgramDay,
  type ProgramDraft,
  type ProgramRow,
  type QuestionTrackerRow,
} from "../types";

interface WeeklySummaryItem {
  lesson: string;
  count: number;
}

interface EditorPageProps {
  draft: ProgramDraft;
  setDraft: Dispatch<SetStateAction<ProgramDraft>>;
  lessons: string[];
  weeklySummary: WeeklySummaryItem[];
  questionTrackerRows: QuestionTrackerRow[];
  currentRole: UserRole | null;
  onRowChange: (
    dayIndex: number,
    rowIndex: number,
    field: keyof ProgramRow,
    value: string,
  ) => void;
  onAddRow: (dayIndex: number) => void;
  onRemoveRow: (dayIndex: number) => void;
}

function chunkDaysByWeek(days: ProgramDay[]): ProgramDay[][] {
  const result: ProgramDay[][] = [];
  let currentWeek: ProgramDay[] = [];

  days.forEach((day) => {
    currentWeek.push(day);

    if (day.date && new Date(`${day.date}T00:00:00`).getDay() === 0) {
      result.push(currentWeek);
      currentWeek = [];
    }
  });

  if (currentWeek.length) {
    result.push(currentWeek);
  }

  return result;
}

function formatDayLabel(date: string, fallbackTitle: string): string {
  if (!date) {
    return fallbackTitle;
  }

  return formatCardTitle(new Date(`${date}T00:00:00`));
}

export function EditorPage({
  draft,
  setDraft,
  lessons,
  weeklySummary,
  questionTrackerRows,
  onRowChange,
  onAddRow,
  onRemoveRow,
}: EditorPageProps) {
  const [activeWeek, setActiveWeek] = useState(0);

  const goNext = () => {
    setActiveWeek((w) => Math.min(weeks.length - 1, w + 1));
  };

  const goPrev = () => {
    setActiveWeek((w) => Math.max(0, w - 1));
  };

  const weeks = useMemo(() => chunkDaysByWeek(draft.days), [draft.days]);
  const safeWeek = Math.min(activeWeek, Math.max(0, weeks.length - 1));
  const currentWeekDays = weeks[safeWeek] ?? [];

  // Week date range label
  const weekLabel = useMemo(() => {
    if (!currentWeekDays.length) return "";
    const first = formatDayLabel(
      currentWeekDays[0].date,
      currentWeekDays[0].title,
    );
    const last = formatDayLabel(
      currentWeekDays[currentWeekDays.length - 1].date,
      currentWeekDays[currentWeekDays.length - 1].title,
    );
    return first === last ? first : `${first} – ${last}`;
  }, [currentWeekDays]);

  const weekStartIndex = useMemo(() => {
    const previousWeeks = weeks.slice(0, safeWeek);
    return previousWeeks.reduce((total, week) => total + week.length, 0);
  }, [safeWeek, weeks]);

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <ProgramMetaHeader
        schoolName={draft.schoolName}
        student={draft.student}
        teacher={draft.teacher}
        start={draft.start}
        end={draft.end}
      />

      {draft.days.length > 0 ? (
        <>
          {/* Week navigation */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <IconButton
              size="small"
              onClick={goPrev}
              disabled={safeWeek === 0}
              sx={{ border: "1px solid", borderColor: "divider" }}
            >
              <ArrowBackIosNewRoundedIcon fontSize="small" />
            </IconButton>

            <Box sx={{ textAlign: "center", minWidth: 160 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, lineHeight: 1.2 }}
              >
                {weeks.length > 1
                  ? `Hafta ${safeWeek + 1} / ${weeks.length}`
                  : "Hafta"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {weekLabel}
              </Typography>
            </Box>

            <IconButton
              size="small"
              onClick={goNext}
              disabled={safeWeek === weeks.length - 1}
              sx={{ border: "1px solid", borderColor: "divider" }}
            >
              <ArrowForwardIosRoundedIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ display: "grid", gap: 2.5 }}>
            <Box sx={{ display: "grid", gap: 2.5 }}>
              {/* 2-per-row day grid */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 2,
                }}
              >
                {currentWeekDays.map((day, localIndex) => {
                  const globalIndex = weekStartIndex + localIndex;
                  return (
                    <DayCard
                      key={day.date || day.title}
                      day={day}
                      dayIndex={globalIndex}
                      lessons={lessons}
                      getTopicsForLesson={(lesson) =>
                        getTopicsForLesson(draft, lesson)
                      }
                      onRowChange={onRowChange}
                      onAddRow={onAddRow}
                      onRemoveRow={onRemoveRow}
                    />
                  );
                })}
              </Box>

              {/* Notes + summary at the bottom */}
              <Card variant="outlined" sx={{ borderRadius: 1.25 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                      gap: 3,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        sx={{ mb: 1.5 }}
                      >
                        Ders Özeti
                      </Typography>
                      <Box sx={{ display: "grid", gap: 0.75 }}>
                        {weeklySummary.length ? (
                          weeklySummary.map((item) => (
                            <Typography key={item.lesson} variant="body2">
                              {item.lesson}: <strong>{item.count}</strong> ders
                              saati
                            </Typography>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Henüz ders seçilmedi.
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <TextField
                      label="Programa dair notlar"
                      value={draft.notes}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      multiline
                      minRows={4}
                      fullWidth
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </>
      ) : null}

      {draft.includeQuestionTracker && questionTrackerRows.length ? (
        <QuestionTrackerTable rows={questionTrackerRows} />
      ) : null}
    </Box>
  );
}
