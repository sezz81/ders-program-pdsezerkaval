import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditCalendarRoundedIcon from "@mui/icons-material/EditCalendarRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { ProgramsList } from "../components/ProgramsList";
import { EDUCATION_LEVEL_OPTIONS, EDUCATION_LEVELS, STUDY_FIELD_OPTIONS } from "../data/legacy";
import {
  EducationLevel,
  ExamTrack,
  type ManagedStudent,
  type ManagedStudentCreateForm,
  type ProgramRecord,
  type SaveFeedback,
} from "../types";

interface DashboardPageProps {
  studentsLoading: boolean;
  linkedStudents: ManagedStudent[];
  selectedStudentId: string;
  sortedTeacherPrograms: ProgramRecord[];
  managedStudentForm: ManagedStudentCreateForm;
  managedStudentMessage: SaveFeedback | null;
  setManagedStudentForm: Dispatch<SetStateAction<ManagedStudentCreateForm>>;
  onGoToSetup: () => void;
  onResetManagedStudentForm: () => void;
  onTeacherStudentChange: (studentId: string) => void;
  onCreateManagedStudent: () => void;
  onDeleteSelectedStudent: (studentId: string) => void;
  onOpenTeacherProgram: (programId: string) => void;
  onEditTeacherProgram: (programId: string) => void;
  onDeleteTeacherProgram: (programId: string) => void;
  onOpenAnalysis: () => void;
  onLoadStudentPrograms: (studentId: string) => Promise<ProgramRecord[]>;
  getStudentUsernameFromEmail: (email: string) => string;
}

export function DashboardPage({
  studentsLoading,
  linkedStudents,
  selectedStudentId,
  sortedTeacherPrograms,
  managedStudentForm,
  managedStudentMessage,
  setManagedStudentForm,
  onGoToSetup,
  onResetManagedStudentForm,
  onTeacherStudentChange,
  onCreateManagedStudent,
  onDeleteSelectedStudent,
  onOpenTeacherProgram,
  onEditTeacherProgram,
  onDeleteTeacherProgram,
  onOpenAnalysis,
  onLoadStudentPrograms,
  getStudentUsernameFromEmail,
}: DashboardPageProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [programsDialogStudent, setProgramsDialogStudent] =
    useState<ManagedStudent | null>(null);
  const [dialogPrograms, setDialogPrograms] = useState<ProgramRecord[]>([]);
  const [dialogProgramsLoading, setDialogProgramsLoading] = useState(false);
  const [createdUsername, setCreatedUsername] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const prevMessageRef = useRef(managedStudentMessage);
  const pendingFullNameRef = useRef("");

  // Watch for creation result → stop loading, close add dialog on success
  useEffect(() => {
    if (
      managedStudentMessage !== null &&
      managedStudentMessage !== prevMessageRef.current
    ) {
      const pendingFullName = pendingFullNameRef.current;
      const timeoutId = window.setTimeout(() => {
        setCreating(false);

        if (managedStudentMessage.type === "success") {
          const matched =
            linkedStudents.find(
              (student) =>
                student.full_name.toLowerCase().trim() ===
                pendingFullName.toLowerCase().trim(),
            ) ?? linkedStudents[linkedStudents.length - 1];

          const username = matched
            ? getStudentUsernameFromEmail(matched.email ?? "")
            : "";
          setAddDialogOpen(false);
          setCreatedUsername(username);
        }

        pendingFullNameRef.current = "";
      }, 0);

      prevMessageRef.current = managedStudentMessage;
      return () => window.clearTimeout(timeoutId);
    }

    prevMessageRef.current = managedStudentMessage;
  }, [managedStudentMessage, linkedStudents, getStudentUsernameFromEmail]);

  const handleCopyUsername = () => {
    if (!createdUsername) return;
    void navigator.clipboard.writeText(createdUsername).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleOpenPrograms = (student: ManagedStudent) => {
    setProgramsDialogStudent(student);
    setDialogPrograms([]);
    setDialogProgramsLoading(true);
    void onLoadStudentPrograms(student.id).then((programs) => {
      setDialogPrograms(programs);
      setDialogProgramsLoading(false);
    });
  };

  const handleOpenAnalysis = (student: ManagedStudent) => {
    onTeacherStudentChange(student.id);
    onOpenAnalysis();
  };

  const handleDeleteStudent = (student: ManagedStudent) => {
    onDeleteSelectedStudent(student.id);
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
  };

  const handleCreateStudent = () => {
    pendingFullNameRef.current = managedStudentForm.fullName;
    setCreating(true);
    onCreateManagedStudent();
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1fr 360px" },
        gap: 3,
      }}
    >
      {/* ─── Öğrencilerim ─── */}
      <Card variant="outlined" sx={{ borderRadius: 1.25 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2.5,
            }}
          >
            <Box>
              <Typography variant="h5">Öğrencilerim</Typography>
              <Typography variant="body2" color="text.secondary">
                {linkedStudents.length
                  ? `${linkedStudents.length} kayıtlı öğrenci`
                  : "Henüz öğrenci eklenmedi"}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => {
                onResetManagedStudentForm();
                setAddDialogOpen(true);
              }}
            >
              Öğrenci Ekle
            </Button>
          </Box>

          {studentsLoading ? (
            <Stack spacing={1.5} sx={{ pt: 1 }}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{ display: "flex", gap: 2, alignItems: "center" }}
                >
                  <Skeleton variant="text" width="25%" height={20} />
                  <Skeleton variant="text" width="15%" height={20} />
                  <Skeleton variant="text" width="15%" height={20} />
                  <Skeleton variant="text" width="20%" height={20} />
                  <Skeleton
                    variant="rounded"
                    width={80}
                    height={28}
                    sx={{ ml: "auto" }}
                  />
                </Box>
              ))}
            </Stack>
          ) : linkedStudents.length === 0 ? (
            <Box
              sx={{
                py: 6,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1.5,
                color: "text.secondary",
                border: "1.5px dashed",
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              <PersonRoundedIcon sx={{ fontSize: 40, opacity: 0.35 }} />
              <Typography>
                Henüz öğrenci yok. "Öğrenci Ekle" butonuyla başlayın.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{
                      "& th": {
                        fontWeight: 700,
                        color: "text.secondary",
                        fontSize: 12,
                      },
                    }}
                  >
                    <TableCell>Ad Soyad</TableCell>
                    <TableCell>Kademe</TableCell>
                    <TableCell>Sınıf</TableCell>
                    <TableCell>Kullanıcı Adı</TableCell>
                    <TableCell align="right">İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {linkedStudents.map((student) => {
                    const username = getStudentUsernameFromEmail(
                      student.email || "",
                    );
                    const classDetail =
                      student.education_level === EducationLevel.Undergraduate
                        ? student.exam_track || "—"
                        : student.class_level || "—";

                    return (
                      <TableRow
                        key={student.id}
                        hover
                        onClick={() => onTeacherStudentChange(student.id)}
                        sx={{
                          cursor: "pointer",
                          bgcolor:
                            student.id === selectedStudentId
                              ? "rgba(29, 78, 216, 0.08)"
                              : "transparent",
                          "&:last-child td": { borderBottom: 0 },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>
                          {student.full_name || "Öğrenci"}
                        </TableCell>
                        <TableCell>{student.education_level || "—"}</TableCell>
                        <TableCell>{classDetail}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "monospace",
                              bgcolor: "grey.100",
                              px: 1,
                              py: 0.25,
                              borderRadius: 0.75,
                              display: "inline-block",
                            }}
                          >
                            {username || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.5,
                              justifyContent: "flex-end",
                            }}
                          >
                            <Tooltip title="Programları görüntüle">
                              <IconButton
                                size="small"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleOpenPrograms(student);
                                }}
                              >
                                <FolderOpenRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Analiz">
                              <IconButton
                                size="small"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleOpenAnalysis(student);
                                }}
                              >
                                <AnalyticsRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Sil">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDeleteStudent(student);
                                }}
                              >
                                <DeleteOutlineRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* ─── Sağ Sidebar ─── */}
      <Stack spacing={2.5}>
        {/* Program Oluştur CTA */}
        <Card
          sx={{
            borderRadius: 1.25,
            background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
            color: "common.white",
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}
            >
              <EditCalendarRoundedIcon />
              <Typography variant="h6">Program Oluştur</Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.8)", mb: 2.5 }}
            >
              Bir öğrenci için yeni haftalık çalışma programı hazırlayın.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              onClick={onGoToSetup}
              sx={{
                bgcolor: "common.white",
                color: "primary.main",
                fontWeight: 700,
                "&:hover": { bgcolor: "grey.100" },
              }}
            >
              Yeni Program
            </Button>
          </CardContent>
        </Card>

        {/* Son Programlar */}
        <Box>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, mb: 1.5, px: 0.25 }}
          >
            {selectedStudentId ? "Seçili Öğrencinin Programları" : "Son Programlar"}
          </Typography>
          <ProgramsList
            items={sortedTeacherPrograms.slice(0, 5)}
            emptyText="Henüz kayıtlı program yok."
            onOpen={onOpenTeacherProgram}
            onEdit={onEditTeacherProgram}
            onDelete={onDeleteTeacherProgram}
          />
        </Box>
      </Stack>

      {/* ─── Öğrenci Ekle Dialog ─── */}
      <Dialog
        open={addDialogOpen}
        onClose={handleCloseAddDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Öğrenci Ekle</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          <Stack spacing={2}>
            <TextField
              label="Ad Soyad"
              value={managedStudentForm.fullName}
              onChange={(e) =>
                setManagedStudentForm((current) => ({
                  ...current,
                  fullName: e.target.value,
                }))
              }
              fullWidth
              autoFocus
            />

            <TextField
              label="Okul Adı"
              value={managedStudentForm.schoolName}
              onChange={(e) =>
                setManagedStudentForm((current) => ({
                  ...current,
                  schoolName: e.target.value,
                }))
              }
              fullWidth
            />

            <TextField
              select
              label="Kademe"
              value={managedStudentForm.educationLevel}
              onChange={(e) =>
                setManagedStudentForm((current) => ({
                  ...current,
                  educationLevel: e.target
                    .value as ManagedStudentCreateForm["educationLevel"],
                  classLevel: "",
                  examTrack: "",
                  studyField: "",
                }))
              }
              fullWidth
            >
              <MenuItem value="">Kademe seçiniz</MenuItem>
              {EDUCATION_LEVEL_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            {managedStudentForm.educationLevel ===
            EducationLevel.Undergraduate ? (
              <TextField
                select
                label="Sınav"
                value={managedStudentForm.examTrack}
                onChange={(e) =>
                  setManagedStudentForm((current) => ({
                    ...current,
                    examTrack: e.target
                      .value as ManagedStudentCreateForm["examTrack"],
                  }))
                }
                fullWidth
              >
                <MenuItem value="">Sınav seçiniz</MenuItem>
                <MenuItem value={ExamTrack.KPSSB}>{ExamTrack.KPSSB}</MenuItem>
                <MenuItem value={ExamTrack.MEBAGS}>{ExamTrack.MEBAGS}</MenuItem>
              </TextField>
            ) : managedStudentForm.educationLevel ? (
              <TextField
                select
                label="Sınıf"
                value={managedStudentForm.classLevel}
                onChange={(e) =>
                  setManagedStudentForm((current) => ({
                    ...current,
                    classLevel: e.target.value,
                    examTrack: current.classLevel !== e.target.value ? "" : current.examTrack,
                    studyField: current.classLevel !== e.target.value ? "" : current.studyField,
                  }))
                }
                fullWidth
              >
                <MenuItem value="">Sınıf seçiniz</MenuItem>
                {(
                  EDUCATION_LEVELS[managedStudentForm.educationLevel] ?? []
                ).map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}

            {managedStudentForm.classLevel === "12. Sınıf" ? (
              <>
                <TextField
                  select
                  label="12. Sınıf Alanı"
                  value={managedStudentForm.examTrack}
                  onChange={(e) =>
                    setManagedStudentForm((current) => ({
                      ...current,
                      examTrack: e.target.value as ManagedStudentCreateForm["examTrack"],
                      studyField:
                        e.target.value === ExamTrack.AYT || e.target.value === ExamTrack.TYTAndAYT
                          ? current.studyField
                          : "",
                    }))
                  }
                  fullWidth
                >
                  <MenuItem value="">Alan seçiniz</MenuItem>
                  <MenuItem value={ExamTrack.TYT}>{ExamTrack.TYT}</MenuItem>
                  <MenuItem value={ExamTrack.AYT}>{ExamTrack.AYT}</MenuItem>
                  <MenuItem value={ExamTrack.TYTAndAYT}>{ExamTrack.TYTAndAYT}</MenuItem>
                </TextField>

                {managedStudentForm.examTrack === ExamTrack.AYT ||
                managedStudentForm.examTrack === ExamTrack.TYTAndAYT ? (
                  <TextField
                    select
                    label="Alan"
                    value={managedStudentForm.studyField}
                    onChange={(e) =>
                      setManagedStudentForm((current) => ({ ...current, studyField: e.target.value }))
                    }
                    fullWidth
                  >
                    <MenuItem value="">Alan seçiniz</MenuItem>
                    {STUDY_FIELD_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </TextField>
                ) : null}
              </>
            ) : null}

            <TextField
              label="Şifre"
              type="password"
              value={managedStudentForm.password}
              onChange={(e) =>
                setManagedStudentForm((current) => ({
                  ...current,
                  password: e.target.value,
                }))
              }
              placeholder="En az 6 karakter"
              fullWidth
            />

            {managedStudentMessage ? (
              <Alert
                severity={
                  managedStudentMessage.type === "success" ? "success" : "error"
                }
              >
                {managedStudentMessage.message}
              </Alert>
            ) : null}
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseAddDialog} disabled={creating}>
            İptal
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateStudent}
            disabled={creating}
            startIcon={
              creating ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            {creating ? "Oluşturuluyor..." : "Öğrenciyi Oluştur"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Öğrenci Programları Dialog ─── */}
      <Dialog
        open={Boolean(programsDialogStudent)}
        onClose={() => setProgramsDialogStudent(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {programsDialogStudent?.full_name || "Öğrenci"} — Programlar
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          {dialogProgramsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <ProgramsList
              items={dialogPrograms}
              emptyText="Bu öğrenci için kayıtlı program yok."
              onOpen={(id) => {
                if (programsDialogStudent)
                  onTeacherStudentChange(programsDialogStudent.id);
                setProgramsDialogStudent(null);
                onOpenTeacherProgram(id);
              }}
              onEdit={(id) => {
                if (programsDialogStudent)
                  onTeacherStudentChange(programsDialogStudent.id);
                setProgramsDialogStudent(null);
                onEditTeacherProgram(id);
              }}
              onDelete={(id) => {
                setProgramsDialogStudent(null);
                onDeleteTeacherProgram(id);
              }}
            />
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setProgramsDialogStudent(null)}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Öğrenci Oluşturuldu Dialog ─── */}
      <Dialog
        open={Boolean(createdUsername)}
        onClose={() => setCreatedUsername(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent sx={{ pt: 4, pb: 3, textAlign: "center" }}>
          <CheckCircleOutlineRoundedIcon
            sx={{ fontSize: 52, color: "success.main", mb: 1.5 }}
          />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.75 }}>
            Öğrenci oluşturuldu
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Aşağıdaki kullanıcı adını öğrenciye iletebilirsiniz.
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              bgcolor: "grey.100",
              borderRadius: 1,
              px: 2,
              py: 1.5,
              mb: 1,
            }}
          >
            <Typography
              sx={{
                fontFamily: "monospace",
                fontWeight: 700,
                flex: 1,
                textAlign: "left",
                wordBreak: "break-all",
              }}
            >
              {createdUsername}
            </Typography>
            <Tooltip title={copied ? "Kopyalandı!" : "Kopyala"}>
              <IconButton size="small" onClick={handleCopyUsername}>
                <ContentCopyRoundedIcon
                  fontSize="small"
                  color={copied ? "success" : "inherit"}
                />
              </IconButton>
            </Tooltip>
          </Box>

          <Typography variant="caption" color="text.secondary">
            Şifre oluştururken belirlenen şifre ile giriş yapılır.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: "center" }}>
          <Button
            variant="contained"
            onClick={() => setCreatedUsername(null)}
            sx={{ px: 4 }}
          >
            Tamam
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
