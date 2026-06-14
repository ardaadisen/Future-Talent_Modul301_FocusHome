
import { useLanguage } from "../context/LanguageContext.jsx";

export function CalendarLinkButton({
  calendarUrl,
  label,
  className = "btn btn-ghost btn-calendar"
}) {
  const { t } = useLanguage();

  return (
    <a
      className={className}
      href={calendarUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label ?? t("calendar.add")}
    </a>
  );
}

export const hasScheduledCalendarSupport = (calendarEnabled, scheduleStart) =>
  Boolean(calendarEnabled && scheduleStart);

export const shouldShowCalendarLink = (calendarEnabled, calendarUrl) =>
  Boolean(calendarEnabled && calendarUrl);
