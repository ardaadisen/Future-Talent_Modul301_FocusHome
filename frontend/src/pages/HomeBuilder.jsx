import AppCard from "../components/AppCard";
import HomeGrid from "../components/HomeGrid";
import SectionHeader from "../components/SectionHeader";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function HomeBuilder({
  grid,
  inventory,
  onPlaceAsset,
  onRemoveAsset,
  actionLoading,
  actionError,
  calendarUrl,
  calendarLoading,
  calendarError,
}) {
  const { t } = useLanguage();

  return (
    <div className="page-grid">
      <div>
        <SectionHeader
          title={t("scaffold.homeBuilder")}
          subtitle={t("scaffold.homeBuilderLead")}
        />
        <p className="muted">{t("scaffold.availableBricks", { count: inventory.bricks })}</p>
        {actionError ? <p className="text-danger">{actionError}</p> : null}
        {actionLoading ? <p className="muted">{t("scaffold.updatingGrid")}</p> : null}
        <HomeGrid
          grid={grid}
          onPlaceAsset={onPlaceAsset}
          onRemoveAsset={onRemoveAsset}
          disabled={actionLoading}
        />
      </div>
      <div>
        <AppCard title={t("scaffold.googleCalendar")}>
          <p className="muted">{t("scaffold.calendarTemplateLead")}</p>
          {calendarLoading ? <p className="muted">{t("scaffold.generatingCalendar")}</p> : null}
          {calendarError ? <p className="text-danger">{calendarError}</p> : null}
          {calendarUrl && !calendarLoading ? (
            <a href={calendarUrl} target="_blank" rel="noreferrer">
              {t("calendar.add")}
            </a>
          ) : null}
          {!calendarUrl && !calendarLoading && !calendarError ? (
            <p className="muted">{t("scaffold.selectTaskForCalendar")}</p>
          ) : null}
        </AppCard>
      </div>
    </div>
  );
}
