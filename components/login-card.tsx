"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export function LoginCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
    }
  };

  return (
    <section className="neo-panel login-panel">
      <p className="section-label">Private by default</p>
      <h1 className="panel-title mt-2">Smart Bookmark Vault</h1>
      <p className="panel-subtitle">Sign in with Google and keep every link isolated to your account.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="helper-chip">Google OAuth only</span>
        <span className="helper-chip">Realtime sync</span>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="primary-btn mt-7 w-full px-4 py-2.5 text-sm disabled:cursor-not-allowed"
      >
        {isLoading ? "Redirecting..." : "Continue with Google"}
      </button>

      {error ? <p className="error-chip mt-3">{error}</p> : null}
    </section>
  );
}
