import { useEffect, useState } from "react";

import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { LanguageProvider, useLanguage } from "./context/LanguageContext.jsx";
import { AppErrorBoundary } from "./components/AppErrorBoundary.jsx";
import { LocalModeBanner } from "./components/LocalModeBanner.jsx";
import { Layout } from "./components/Layout.jsx";
import { PageErrorBoundary } from "./components/PageErrorBoundary.jsx";
import { useAppData } from "./hooks/useAppData.js";
import { BuildModePage } from "./pages/BuildModePage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { HistoryPage } from "./pages/HistoryPage.jsx";
import { HomesArchivePage } from "./pages/HomesArchivePage.jsx";
import { MyHomePage } from "./pages/MyHomePage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";

function LanguageSync({ language }) {
  const { setLanguage } = useLanguage();
  useEffect(() => {
    if (language) setLanguage(language);
  }, [language, setLanguage]);
  return null;
}

function DevToolsPanel({ appData }) {
  const { t } = useLanguage();

  return (
    <details className="tools-panel">
      <summary>{t("dev.tools")}</summary>
      <div className="tools-panel-body">
        <p>{t("dev.toolsLead")}</p>
        <div className="task-actions">
          <button
            className="btn btn-danger"
            type="button"
            onClick={() => void appData.resetAllData()}
            disabled={appData.loading || appData.mutating}
          >
            {t("dev.clearEverything")}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => void appData.loadStarterContent()}
            disabled={appData.loading || appData.mutating}
          >
            {t("dev.loadStarter")}
          </button>
        </div>
      </div>
    </details>
  );
}

function AppRoutes() {
  const appData = useAppData();
  const [view, setView] = useState("dashboard");
  const navigate = (next) => setView(next);

  return (
    <>
      <LanguageSync language={appData.userPreferences?.language} />
      <LocalModeBanner />
      <Layout activeView={view} onNavigate={navigate}>
        <div key={view} className="page-view">
          {view === "dashboard" && (
            <PageErrorBoundary pageName="Dashboard">
              <DashboardPage {...appData} onNavigate={navigate} />
            </PageErrorBoundary>
          )}
          {view === "build" && (
            <PageErrorBoundary pageName="Build Mode">
              <BuildModePage {...appData} onNavigate={navigate} />
            </PageErrorBoundary>
          )}
          {view === "home" && (
            <PageErrorBoundary pageName="My Home" titleKey="home.title" leadKey="home.loadError">
              <MyHomePage {...appData} onNavigate={navigate} />
            </PageErrorBoundary>
          )}
          {view === "archive" && (
            <PageErrorBoundary pageName="Homes Archive">
              <HomesArchivePage {...appData} onNavigate={navigate} />
            </PageErrorBoundary>
          )}
          {view === "history" && (
            <PageErrorBoundary pageName="History">
              <HistoryPage {...appData} onNavigate={navigate} />
            </PageErrorBoundary>
          )}
          {view === "settings" && (
            <PageErrorBoundary pageName="Settings">
              <SettingsPage {...appData} onNavigate={navigate} onAccountDeleted={() => {}} />
            </PageErrorBoundary>
          )}
        </div>

        {import.meta.env.DEV && view === "dashboard" && <DevToolsPanel appData={appData} />}
      </Layout>
    </>
  );
}

function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <AppRoutes />
        </LanguageProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}

export default App;
