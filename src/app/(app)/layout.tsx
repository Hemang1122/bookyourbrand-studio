
import AppLayoutClient from './layout-client';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The logic has been moved to AppLayoutClient to handle client-side auth state.
  return (
      <AppLayoutClient>{children}</AppLayoutClient>
  );
}
