import Image from "next/image";
import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import { siteUrl } from "@/lib/media";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const site = siteUrl();

  return (
    <div className="flex min-h-dvh flex-col bg-canvas lg:grid lg:grid-cols-[minmax(0,1.18fr)_minmax(0,1fr)]">
      {/* The banner the public blog page opens on: a strip on phones,
          the whole left half from lg. */}
      <div className="relative h-55 shrink-0 overflow-hidden bg-rail lg:h-auto">
        <Image
          src="/login-blog.webp"
          alt=""
          fill
          preload
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-cover"
          style={{ objectPosition: "center 55%" }}
        />
        {/* Only as much scrim as the words over the photo need. */}
        <div className="absolute inset-0 bg-linear-to-b from-[#080d1a]/75 to-transparent to-55% lg:bg-linear-to-t lg:from-[#080d1a]/90 lg:via-[#080d1a]/35 lg:via-42% lg:to-transparent lg:to-68%" />

        <div className="absolute top-5 left-5 flex items-baseline gap-2 lg:hidden">
          <span className="font-serif text-[21px] font-extrabold tracking-wide text-[#e2c672]">MatriGuard</span>
          <span className="text-[11px] font-medium text-[#dfe4ee]">Admin</span>
        </div>

        <div className="absolute inset-x-16 bottom-16 hidden flex-col gap-3.5 lg:flex">
          <p className="max-w-130 font-serif text-[34px] leading-[1.2] font-bold text-[#f4f6fa]">
            Guides and insights for families checking a proposal.
          </p>
          <p className="text-sm text-[#c3cadb]">Everything you publish here appears on the website&apos;s blog.</p>
        </div>
      </div>

      <main className="flex flex-1 flex-col px-6 pt-8 pb-6 sm:px-12 lg:px-18 lg:py-12">
        <div className="flex flex-1 items-center">
          <div className="w-full max-w-100">
            <h1 className="font-serif text-[32px] leading-[1.1] font-bold text-ink lg:text-[40px]">Welcome back</h1>
            <p className="mt-2.5 text-[15px] leading-relaxed text-ink-muted">
              Sign in to write and publish posts for the MatriGuard blog.
            </p>
            <LoginForm next={typeof next === "string" ? next : ""} />
          </div>
        </div>
      </main>
    </div>
  );
}
