import {
  AppBar,
  Backdrop,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Snackbar,
  Alert,
  Toolbar,
  Typography,
} from "@mui/material";
import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import { useEffect, useState } from "react";

import "./App.css";
import { StudentToolsPanel } from "./components/StudentToolsPanel";
import { useAuthSession } from "./hooks/useAuthSession";
import { usePrintFlow } from "./hooks/usePrintFlow";
import { useProgramDraft } from "./hooks/useProgramDraft";
import { useWorkspace } from "./hooks/useWorkspace";
import { AuthLandingPage } from "./pages/AuthLandingPage";
import { AnalysisPage } from "./pages/AnalysisPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EditorPage } from "./pages/EditorPage";
import { PrintPage } from "./pages/PrintPage";
import { SetupPage } from "./pages/SetupPage";
import { AppStep, UserRole } from "./types";

const getStepLabel = (step: AppStep) => {
  switch (step) {
    case AppStep.Dashboard:
      return "Anasayfa";
    case AppStep.Setup:
      return "Kurulum";
    case AppStep.Editor:
      return "Editör";
    case AppStep.Print:
      return "Yazdır";
    case AppStep.Analysis:
      return "Analiz";
    default:
      return "";
  }
};

const getStepHeading = (step: AppStep) => {
  switch (step) {
    case AppStep.Dashboard:
      return {
        title: "Anasayfa",
        subtitle: "Öğrencilerinizi yönetin ve yeni program oluşturun.",
      };
    case AppStep.Setup:
      return {
        title: "Program Kurulumu",
        subtitle:
          "Bilgilerini girin ve tarih aralığını belirleyerek programı oluşturun.",
      };
    case AppStep.Editor:
      return {
        title: "Program Editörü",
        subtitle: "Günlük ders akışını düzenleyin, notlarınızı ekleyin.",
      };
    case AppStep.Print:
      return {
        title: "Yazdırma Önizleme",
        subtitle: "Programı son haliyle gözden geçirin ve yazdırın.",
      };
    case AppStep.Analysis:
      return {
        title: "Öğrenci Analizi",
        subtitle: "Konu ilerlemesini inceleyin ve tamamlananları işaretleyin.",
      };
    default:
      return { title: "", subtitle: "" };
  }
};

function App() {
  const draft = useProgramDraft();
  const [step, setStep] = useState<AppStep>(draft.initialStep);

  const auth = useAuthSession();
  const workspace = useWorkspace({
    currentProfile: auth.currentProfile,
    currentSession: auth.currentSession,
    draft: draft.draft,
    setDraft: draft.setDraft,
    hydrateDraft: draft.hydrateDraft,
    setStatusText: auth.setStatusText,
    setStep,
  });
  const printFlow = usePrintFlow({ step, setStep });

  const currentRole = auth.currentProfile?.role ?? null;
  const canEnterApp = auth.hasGuestAccess || Boolean(auth.currentProfile);

  // Logged-in users always land on Dashboard (draft accessible from there)
  useEffect(() => {
    if (
      auth.authReady &&
      auth.currentProfile &&
      (step === AppStep.Setup || step === AppStep.Editor)
    ) {
      setStep(AppStep.Dashboard);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.authReady, auth.currentProfile?.role]);

  const handleGoNext = () => {
    if (!draft.proceedToEditor()) {
      return;
    }

    workspace.clearProgramFeedback();
    setStep(AppStep.Editor);
  };

  const handleGoBack = () => {
    if (step === AppStep.Print) {
      setStep(AppStep.Editor);
      return;
    }

    if (step === AppStep.Analysis) {
      setStep(workspace.analysisReturnStep);
      return;
    }

    if (step === AppStep.Setup && auth.currentProfile) {
      setStep(AppStep.Dashboard);
      return;
    }

    if (step === AppStep.Editor) {
      setStep(auth.currentProfile ? AppStep.Setup : AppStep.Setup);
      return;
    }

    setStep(AppStep.Setup);
  };

  const handleResetAll = () => {
    draft.resetDraft();
    workspace.resetWorkspaceState();
    const nextStep = auth.currentProfile ? AppStep.Dashboard : AppStep.Setup;
    setStep(nextStep);
    auth.setStatusText(
      auth.currentProfile
        ? `${auth.currentProfile.full_name || auth.currentProfile.email || "Hesap"} hesabı açık. Yeni taslak oluşturabilirsiniz.`
        : "Misafir modunda devam ediyorsunuz. Programı kullanabilir ve yazdırabilirsiniz.",
    );
  };

  const showBackButton =
    (step !== AppStep.Dashboard && step !== AppStep.Setup) ||
    (step === AppStep.Setup && Boolean(auth.currentProfile));

  if (!auth.authReady) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!canEnterApp) {
    return (
      <AuthLandingPage
        role={auth.authRole}
        mode={auth.authMode}
        form={auth.authForm}
        busy={auth.authBusy}
        error={auth.authError}
        success={auth.authSuccess}
        onRoleChange={auth.setAuthRole}
        onModeChange={auth.changeAuthMode}
        onFieldChange={(field, value) =>
          auth.setAuthForm((current) => ({ ...current, [field]: value }))
        }
        onSubmit={() => {
          void auth.submitAuth();
        }}
        onContinueAsGuest={auth.continueAsGuest}
      />
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        className="no-print"
        sx={{
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ gap: 2, minHeight: 72 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flex: 1,
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                display: "grid",
                placeItems: "center",
                borderRadius: 1.5,
                bgcolor: "primary.main",
                color: "common.white",
              }}
            >
              <SchoolRoundedIcon fontSize="small" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ lineHeight: 1.1, fontSize: 15 }}>
                Ders Çalışma Programı
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                noWrap
                sx={{ fontSize: 12 }}
              >
                {draft.draft.schoolName ||
                  "Program oluştur, kaydet, analiz et, yazdır"}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <Chip
              label={getStepLabel(step)}
              color="primary"
              variant="outlined"
              size="small"
            />
            <Chip
              label={
                auth.currentProfile
                  ? currentRole === UserRole.Teacher
                    ? "Öğretmen"
                    : "Öğrenci"
                  : "Misafir"
              }
              size="small"
            />
            {auth.currentProfile ? (
              <Chip
                label={
                  auth.currentProfile.full_name ||
                  auth.currentProfile.email ||
                  "Kullanıcı"
                }
                variant="outlined"
                size="small"
              />
            ) : null}
            <Button
              color="inherit"
              variant="text"
              size="small"
              startIcon={<LogoutRoundedIcon />}
              disabled={auth.authBusy}
              onClick={() => {
                if (auth.currentProfile) {
                  void auth.signOut();
                } else {
                  auth.leaveGuestMode();
                }
              }}
            >
              {auth.currentProfile
                ? auth.authBusy
                  ? "Cikiliyor..."
                  : "Çıkış"
                : "Girişe Dön"}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} sx={{ py: 4 }}>
        <Box sx={{ display: "grid", gap: 3 }}>
          {/* Page header — hidden on Dashboard */}
          {step !== AppStep.Dashboard ? (
            <Paper
              variant="outlined"
              className="no-print"
              sx={{
                p: 2.5,
                borderRadius: 1.25,
                ...(step === AppStep.Setup
                  ? { maxWidth: 1020, mx: "auto", width: "100%" }
                  : {}),
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", lg: "row" },
                  justifyContent: "space-between",
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.25,
                    minWidth: 0,
                  }}
                >
                  {showBackButton ? (
                    <IconButton
                      aria-label="Geri"
                      onClick={handleGoBack}
                      sx={{
                        mt: 0.5,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <ArrowBackRoundedIcon />
                    </IconButton>
                  ) : null}
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="h4"
                      sx={{ mb: 0.75, fontSize: { xs: 24, md: 30 } }}
                    >
                      {getStepHeading(step).title}
                    </Typography>
                    <Typography color="text.secondary">
                      {getStepHeading(step).subtitle}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                    alignItems: "flex-start",
                  }}
                >
                  {step !== AppStep.Analysis &&
                  currentRole === UserRole.Teacher ? (
                    <Button
                      variant="outlined"
                      startIcon={<AnalyticsRoundedIcon />}
                      onClick={() => {
                        void workspace.openAnalysis(step);
                      }}
                    >
                      Analize Git
                    </Button>
                  ) : null}
                  {step === AppStep.Editor &&
                  currentRole !== UserRole.Student ? (
                    <Button
                      variant="outlined"
                      startIcon={<SaveRoundedIcon />}
                      onClick={() => {
                        void workspace.saveProgram();
                      }}
                    >
                      Kaydet
                    </Button>
                  ) : null}
                  {step === AppStep.Editor ? (
                    <Button
                      variant="contained"
                      startIcon={<PrintRoundedIcon />}
                      onClick={printFlow.openProgramPrintView}
                    >
                      Yazdır / PDF
                    </Button>
                  ) : null}
                </Box>
              </Box>
            </Paper>
          ) : null}

          {/* Teacher Dashboard */}
          {step === AppStep.Dashboard && currentRole === UserRole.Teacher ? (
            <DashboardPage
              studentsLoading={workspace.studentsLoading}
              linkedStudents={workspace.linkedStudents}
              selectedStudentId={workspace.selectedStudentId}
              sortedTeacherPrograms={workspace.sortedTeacherPrograms}
              managedStudentForm={workspace.managedStudentForm}
              managedStudentMessage={workspace.managedStudentMessage}
              setManagedStudentForm={workspace.setManagedStudentForm}
              onGoToSetup={() => {
                const teacherName = draft.draft.teacher;
                draft.resetDraft();
                draft.setDraft((current) => ({
                  ...current,
                  teacher: teacherName || auth.currentProfile?.full_name || "",
                }));
                setStep(AppStep.Setup);
              }}
              onResetManagedStudentForm={workspace.resetManagedStudentForm}
              onTeacherStudentChange={(studentId) => {
                void workspace.changeTeacherStudent(studentId);
              }}
              onCreateManagedStudent={() => {
                void workspace.createManagedStudent();
              }}
              onDeleteSelectedStudent={(studentId) => {
                void workspace.deleteSelectedStudent(studentId);
              }}
              onOpenTeacherProgram={workspace.openTeacherProgram}
              onEditTeacherProgram={workspace.editTeacherProgram}
              onDeleteTeacherProgram={(programId) => {
                void workspace.deleteProgram(programId);
              }}
              onOpenAnalysis={() => {
                void workspace.openAnalysis(AppStep.Dashboard);
              }}
              onLoadStudentPrograms={workspace.loadStudentPrograms}
              getStudentUsernameFromEmail={
                workspace.getStudentUsernameFromEmail
              }
            />
          ) : null}

          {/* Setup */}
          {step === AppStep.Setup ? (
            <SetupPage
              draft={draft.draft}
              setDraft={draft.setDraft}
              setupError={draft.setupError}
              linkedStudents={
                currentRole === UserRole.Teacher ? workspace.linkedStudents : []
              }
              currentRole={currentRole}
              onStudentSelect={(studentId) => {
                void workspace.changeTeacherStudent(studentId);
              }}
              onGoNext={handleGoNext}
            />
          ) : null}

          {/* Student dashboard */}
          {currentRole === UserRole.Student && step === AppStep.Dashboard ? (
            <StudentToolsPanel
              currentProfile={auth.currentProfile!}
              linkedTeachers={workspace.linkedTeachers}
              programsLoading={workspace.studentsLoading}
              sortedStudentPrograms={workspace.sortedStudentPrograms}
              onOpenStudentProgram={workspace.openStudentProgram}
              onGoToSetup={() => {
                draft.resetDraft();
                setStep(AppStep.Setup);
              }}
              getStudentUsernameFromEmail={
                workspace.getStudentUsernameFromEmail
              }
            />
          ) : null}

          {/* Editor */}
          {step === AppStep.Editor ? (
            <EditorPage
              draft={draft.draft}
              setDraft={draft.setDraft}
              lessons={draft.lessons}
              weeklySummary={draft.weeklySummary}
              questionTrackerRows={draft.questionTrackerRows}
              currentRole={currentRole}
              onRowChange={draft.updateRow}
              onAddRow={draft.addRow}
              onRemoveRow={draft.removeRow}
            />
          ) : null}

          {/* Print */}
          {step === AppStep.Print ? (
            <PrintPage
              draft={draft.draft}
              weeklySummary={draft.weeklySummary}
              questionTrackerRows={draft.questionTrackerRows}
              saveFeedback={workspace.saveFeedback}
              currentRole={currentRole}
              onEdit={() => setStep(AppStep.Editor)}
              onSaveProgram={() => {
                void workspace.saveProgram();
              }}
              onPrint={printFlow.queueProgramPrint}
              onReset={handleResetAll}
            />
          ) : null}

          {/* Analysis */}
          {step === AppStep.Analysis ? (
            <AnalysisPage
              student={workspace.selectedStudent}
              programCount={workspace.teacherPrograms.length}
              lessons={workspace.analysisLessons}
              selectedLesson={workspace.analysisSelectedLesson}
              emptyMessage={workspace.analysisEmptyMessage}
              analysisReturnStep={workspace.analysisReturnStep}
              onLessonChange={workspace.setAnalysisSelectedLesson}
              onToggleCompleted={workspace.toggleTopicCompletion}
              onSaveAnalysis={() => {
                void workspace.saveAnalysis();
              }}
              onPrintAnalysis={printFlow.queueAnalysisPrint}
              onBack={setStep}
            />
          ) : null}
        </Box>
      </Container>

      <Box
        className="no-print"
        sx={{ textAlign: 'center', py: 2, color: 'text.disabled' }}
      >
        <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.6 }}>
          Sezer KAVAL
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
          Psikolojik Danışman
        </Typography>
      </Box>

      <Snackbar
        open={Boolean(workspace.saveFeedback)}
        autoHideDuration={
          workspace.saveFeedback?.type === "success" ? 3000 : null
        }
        onClose={workspace.clearProgramFeedback}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={workspace.clearProgramFeedback}
          severity={
            workspace.saveFeedback?.type === "success" ? "success" : "error"
          }
          variant="filled"
          sx={{ minWidth: 280 }}
        >
          {workspace.saveFeedback?.message}
        </Alert>
      </Snackbar>

      <Backdrop
        open={workspace.isBusy || auth.authBusy}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 10,
          color: "common.white",
          display: "grid",
          gap: 1.5,
          textAlign: "center",
        }}
      >
        <CircularProgress color="inherit" />
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          {workspace.busyLabel || auth.authBusyLabel || "Yukleniyor..."}
        </Typography>
      </Backdrop>
    </Box>
  );
}

export default App;
