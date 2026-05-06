import AppCard from "../components/AppCard";
import HomeGrid from "../components/HomeGrid";
import SectionHeader from "../components/SectionHeader";

export default function HomeBuilder({ grid, onPlaceAsset, calendarUrl }) {
  return (
    <div className="page-grid">
      <div>
        <SectionHeader title="Home Builder" subtitle="Simple 5x5 mock grid view." />
        <HomeGrid grid={grid} onPlaceAsset={onPlaceAsset} />
      </div>
      <div>
        <AppCard title="Google Calendar (Optional UI)">
          <p className="muted">OAuth is not implemented. This is a mock/template link UI.</p>
          <a href={calendarUrl} target="_blank" rel="noreferrer">
            Add to Google Calendar
          </a>
        </AppCard>
      </div>
    </div>
  );
}
