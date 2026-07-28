import { Logo } from "@/components/app/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="animate-fade-in">{children}</div>
    </main>
  );
}
