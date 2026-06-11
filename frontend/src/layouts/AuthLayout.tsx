import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand / hero panel */}
      <div className="relative hidden flex-col justify-between bg-gradient-to-br from-brand-600 to-brand-800 p-12 text-white lg:flex">
        <div className="font-serif text-2xl font-semibold">carpe diem</div>
        <div>
          <p className="font-serif text-3xl leading-snug">
            A quiet, private place for the moments that matter.
          </p>
          <p className="mt-4 max-w-md text-brand-100">
            Capture daily life, milestones, and memories — alone or with the
            people you love.
          </p>
        </div>
        <p className="text-sm text-brand-200">Seize the day. One entry at a time.</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="font-serif text-2xl font-semibold text-brand-700">
              carpe diem
            </span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
