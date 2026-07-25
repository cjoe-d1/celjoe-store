import {
  AdminPageContainer,
  AdminTopBar,
} from "components/chds/admin";
import { Card } from "components/chds";
import {
  KpiCard,
  ChartWrapper,
  ActivityFeed,
} from "components/chds/dashboard";

export function DashboardSkeleton() {
  return (
    <>
      <AdminTopBar title="Operations dashboard" />
      <AdminPageContainer>
        <div className="grid grid-cols-1 gap-[var(--ds-space-4)] sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiCard key={i} label=" " value="—" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-[var(--ds-space-4)] lg:grid-cols-3">
          <Card variant="dashboard" className="lg:col-span-2">
            <div className="h-6 w-40 animate-pulse rounded-[var(--ds-radius-md)] bg-[var(--ds-color-border)]/40" />
            <div className="mt-[var(--ds-space-4)] flex flex-col gap-[var(--ds-space-2)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-full animate-pulse rounded-[var(--ds-radius-md)] bg-[var(--ds-color-border)]/40"
                />
              ))}
            </div>
          </Card>
          <ActivityFeed title="Alerts">
            <div className="h-6 w-32 animate-pulse rounded-[var(--ds-radius-md)] bg-[var(--ds-color-border)]/40" />
          </ActivityFeed>
        </div>
        <div className="grid grid-cols-1 gap-[var(--ds-space-4)] lg:grid-cols-2">
          <ChartWrapper title="Loading…">
            <div className="h-32 w-full animate-pulse rounded-[var(--ds-radius-md)] bg-[var(--ds-color-border)]/40" />
          </ChartWrapper>
          <Card variant="dashboard">
            <div className="h-6 w-40 animate-pulse rounded-[var(--ds-radius-md)] bg-[var(--ds-color-border)]/40" />
          </Card>
        </div>
      </AdminPageContainer>
    </>
  );
}
