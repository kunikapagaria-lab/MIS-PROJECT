import { Outlet } from "react-router";
import { Header } from "./header";

export function RootLayout() {
  return (
    <div className="min-h-screen relative overflow-hidden warm-atmosphere">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-14 h-72 w-72 rounded-full bg-orange-300/32 blur-3xl" />
        <div className="absolute top-16 right-6 h-80 w-80 rounded-full bg-orange-200/34 blur-3xl" />
        <div className="absolute bottom-6 left-1/3 h-72 w-72 rounded-full bg-amber-100/45 blur-3xl" />
        <div className="absolute inset-0 opacity-40 [background:linear-gradient(160deg,transparent_0%,rgba(255,212,174,0.28)_48%,transparent_100%)]" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-2 md:left-6 flex items-center">
        <div className="cube-rail">
          <span className="cube delay-0" />
          <span className="cube delay-1" />
          <span className="cube delay-2" />
          <span className="cube delay-3" />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-2 md:right-6 flex items-center">
        <div className="cube-rail">
          <span className="cube delay-2" />
          <span className="cube delay-3" />
          <span className="cube delay-0" />
          <span className="cube delay-1" />
        </div>
      </div>
      <div className="relative z-10 min-h-screen w-full glass-shell overflow-hidden">
        <Header />
        <div className="min-h-[calc(100vh-4rem)] page-glass">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
