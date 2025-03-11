import DashboardLayout from "../dashboard/layout";

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
} 