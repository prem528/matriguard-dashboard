import Rail from "@/components/panel/Rail";
import { adminName, requireAdmin } from "@/lib/auth/session";
import { siteUrl } from "@/lib/media";

export default async function PanelLayout({ children }: LayoutProps<"/">) {
  const session = await requireAdmin();

  return (
    <div className="min-h-dvh">
      <Rail name={adminName(session.user)} email={session.user.email} siteUrl={siteUrl()} />
      <main className="lg:pl-64">{children}</main>
    </div>
  );
}
