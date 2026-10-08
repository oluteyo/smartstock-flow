import { FormEvent, useEffect, useState } from "react";
import { apiGet, apiPost } from "./services/api";

type User = {
  id: number;
  name: string;
  email: string;
};

type AuthResponse = {
  message: string;
  user: User;
};

type AuthMode = "login" | "register";

function App() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<{ user: User }>("/v1/auth/me")
      .then((response) => {
        setUser(response.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setPassword("");
    setPasswordConfirmation("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "register" && password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const endpoint =
        mode === "login" ? "/v1/auth/login" : "/v1/auth/register";

      const body =
        mode === "login"
          ? {
              email,
              password,
            }
          : {
              name,
              email,
              password,
              password_confirmation: passwordConfirmation,
            };

      const response = await apiPost<AuthResponse>(endpoint, body);
      setUser(response.user);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    setSubmitting(true);

    try {
      await apiPost("/v1/auth/logout");
      setUser(null);
      setName("");
      setEmail("");
      setPassword("");
      setPasswordConfirmation("");
    } catch {
      setError("Unable to log out. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-sm text-slate-400">Loading SmartStock Flow...</div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="mb-8">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
              S
            </div>

            <p className="mb-2 text-sm font-medium text-blue-400">
              SmartStock Flow
            </p>

            <h1 className="text-2xl font-semibold text-white">
              Welcome back, {user.name}
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Your account is authenticated successfully.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Signed in as
            </p>

            <p className="mt-2 text-sm font-medium text-white">{user.email}</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    );
  }

  const isLogin = mode === "login";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-blue-600 p-12 lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-bold text-blue-600">
                S
              </div>

              <span className="text-lg font-semibold">SmartStock Flow</span>
            </div>
          </div>

          <div className="max-w-lg">
            <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-blue-100">
              Inventory intelligence
            </p>

            <h2 className="text-5xl font-semibold leading-tight tracking-tight">
              Know your stock.
              <br />
              Run your business.
            </h2>

            <p className="mt-6 max-w-md text-lg leading-8 text-blue-100">
              Manage inventory, sales, purchases and stock intelligence from
              one powerful workspace built for growing businesses.
            </p>
          </div>

          <p className="text-sm text-blue-100">
            Built for modern SMEs.
          </p>
        </div>

        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
                S
              </div>

              <h1 className="text-2xl font-semibold">SmartStock Flow</h1>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight">
                {isLogin ? "Welcome back" : "Create your account"}
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                {isLogin
                  ? "Sign in to access your inventory workspace."
                  : "Start managing your business with SmartStock Flow."}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  isLogin
                    ? "bg-white text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign in
              </button>

              <button
                type="button"
                onClick={() => switchMode("register")}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  !isLogin
                    ? "bg-white text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Full name
                  </label>

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    autoComplete="name"
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    autoComplete={
                      isLogin ? "current-password" : "new-password"
                    }
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-white"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label
                    htmlFor="password-confirmation"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Confirm password
                  </label>

                  <div className="relative">
                    <input
                      id="password-confirmation"
                      type={showConfirmation ? "text" : "password"}
                      value={passwordConfirmation}
                      onChange={(event) =>
                        setPasswordConfirmation(event.target.value)
                      }
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Confirm your password"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmation(!showConfirmation)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-white"
                    >
                      {showConfirmation ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? isLogin
                    ? "Signing in..."
                    : "Creating account..."
                  : isLogin
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>

            <p className="mt-8 text-center text-xs leading-5 text-slate-500">
              By continuing, you agree to use SmartStock Flow responsibly and
              keep your account credentials secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;