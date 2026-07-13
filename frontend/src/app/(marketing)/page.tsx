export default function LandingPage() {
  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-5xl font-light text-gray-900 mb-2 tracking-tight">
          Balos
        </h1>
        <p className="text-gray-500 mb-12 text-sm tracking-wide uppercase">
          Mitumba Business Management System
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-8 py-3 bg-gray-900 text-white rounded hover:bg-gray-800 transition text-sm font-medium"
          >
            Sign In
          </a>
          <a
            href="/register"
            className="px-8 py-3 bg-white text-gray-900 border border-gray-300 rounded hover:bg-gray-50 transition text-sm font-medium"
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}
