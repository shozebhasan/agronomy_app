"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import PasswordInput from "@/components/PasswordInput";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [remember, setRemember] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  // --- localStorage helpers (fallback) ---
  const readRemembered = () => {
    try {
      const raw = localStorage.getItem("rememberedCredentials");
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  };
  const writeRemembered = (map) => {
    try {
      localStorage.setItem("rememberedCredentials", JSON.stringify(map));
    } catch (e) {}
  };

  useEffect(() => {
    setAnimate(true);

    // Check for signup success message
    if (typeof window !== "undefined") {
      const searchParamsLocal = new URLSearchParams(window.location.search);
      if (searchParamsLocal.get("message") === "signup_success") {
        setSuccessMessage("Account created successfully! Please sign in.");
      }
    }

    // Try Credential Management API first, then fallback to localStorage
    (async () => {
      if (typeof window === "undefined") return;

      // Try Credential Management API
      try {
        if (navigator.credentials && navigator.credentials.get) {
          // mediation: 'optional' will not force a prompt; it returns stored credentials silently if allowed
          const creds = await navigator.credentials.get({
            password: true,
            mediation: "optional",
          });
          if (creds && (creds.id || creds.password)) {
            // PasswordCredential shape: { id, password, name }
            setFormData({
              email: creds.id || "",
              password: creds.password || "",
            });
            setRemember(true);
            return;
          }
        }
      } catch (err) {
        // ignore errors and fallback to localStorage
        console.debug("Credential API get error:", err);
      }

      // Fallback: localStorage remembered map
      try {
        const creds = readRemembered();
        // Optionally pre-fill last remembered email (if you saved one), or do nothing.
        // Here we don't auto-fill email unless an explicit remembered entry exists for a default key.
        // We'll leave the form empty until user types email (handled below).
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    const message = searchParams.get("message");
    if (message === "password_reset_success") {
      setSuccessMessage(
        "Password reset successfully! Please login with your new password."
      );
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  // When email changes, if we have a localStorage remembered password for it, auto-fill
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      if (name === "email") {
        // Check fallback map
        const creds = readRemembered();
        if (creds[value]) {
          setRemember(true);
          return { ...prev, email: value, password: creds[value] };
        } else {
          // clear password if no saved entry
          setRemember(false);
          return { ...prev, email: value, password: "" };
        }
      } else {
        return { ...prev, [name]: value };
      }
    });

    if (error) setError("");
    if (successMessage) setSuccessMessage("");
  };

  const handleRememberToggle = (e) => {
    setRemember(e.target.checked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    // Basic validation
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      // Use AuthContext login function
      const result = await login(formData.email, formData.password);
      if (result.success) {
        // --- Credential Management API: store credentials if available & remember checked ---
        (async () => {
          try {
            if (remember && navigator.credentials && navigator.credentials.store) {
              // Create a PasswordCredential and store it; browser will handle secure storage
              // The PasswordCredential constructor may be vendor-prefixed in some environments, but modern Chrome supports it.
              const cred = new window.PasswordCredential({
                id: formData.email,
                password: formData.password,
                name: "AI Agronomist",
              });
              await navigator.credentials.store(cred);
            } else if (!remember && navigator.credentials && navigator.credentials.preventSilentAccess) {
              // If user unchecks remember, prevent silent access so browser won't auto sign-in
              try {
                await navigator.credentials.preventSilentAccess();
              } catch (err) {
                // some browsers may not implement this; ignore
              }
            }
          } catch (err) {
            console.debug("Credential API store error (fallback to localStorage):", err);
            // Fallback to localStorage map if Credential API fails
            const creds = readRemembered();
            if (remember) {
              creds[formData.email] = formData.password;
              writeRemembered(creds);
            } else {
              if (creds[formData.email]) {
                delete creds[formData.email];
                writeRemembered(creds);
              }
            }
          }
        })();

        // In case Credential API wasn't used, also update localStorage map (keeps fallback consistent)
        try {
          const creds = readRemembered();
          if (remember) {
            creds[formData.email] = formData.password;
            writeRemembered(creds);
          } else {
            if (creds[formData.email]) {
              delete creds[formData.email];
              writeRemembered(creds);
            }
          }
        } catch (e) {
          // ignore
        }

        // redirect after successful login
        router.push("/");
      } else {
        setError(result.error || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show nothing while checking authentication or if user exists
  if (user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Panel - Image Section */}
      <div
        className="hidden lg:flex lg:w-2/5 relative items-center justify-center p-8"
        style={{
          backgroundImage: "url('/agronomistimage.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-green-900/50"></div>

        <div className="relative text-center text-white z-10">
          <h1
            className={`text-4xl font-bold mb-4 transition-all duration-700 ease-out transform ${
              animate ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0"
            }`}
          >
            AI AGRONOMIST
          </h1>
          <p className="text-lg text-green-100 font-medium">
            Your crop monitoring assistant
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">Sign in to your Agronomist account</p>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">Sign in to your Agronomist account</p>
          </div>

          {/* Form Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm font-medium">
                  {successMessage}
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors disabled:opacity-50"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <PasswordInput
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors disabled:opacity-50"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                    disabled={loading}
                    checked={remember}
                    onChange={handleRememberToggle}
                  />
                  <span className="ml-2 text-sm text-gray-600 font-medium">
                    Remember me
                  </span>
                </label>

                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                  onClick={(e) => loading && e.preventDefault()}
                >
                  Forgot password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing In...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-green-600 hover:text-green-700 transition-colors"
                  onClick={(e) => loading && e.preventDefault()}
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



