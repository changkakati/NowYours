"use client";

import { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";

export default function GoogleSignInButton({ onCredential, onError }) {
  const containerRef = useRef(null);   // wrapper for measuring
  const buttonRef = useRef(null);      // div Google renders into
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      onErrorRef.current?.(
        "Google Client ID is missing. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local and restart Next.js."
      );
      return;
    }

    let cancelled = false;

    function render() {
      if (cancelled || !window.google?.accounts?.id) return;
      if (!buttonRef.current || !containerRef.current) return;

      // Measure container → pass to Google (must be 200–400px)
      const measured = Math.min(
        400,
        Math.max(200, Math.floor(containerRef.current.offsetWidth))
      );

      buttonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: measured,
      });
    }

    function initializeGoogle() {
      if (cancelled || !window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (!response.credential) {
            onErrorRef.current?.(
              "Google did not return an authentication credential."
            );
            return;
          }
          onCredentialRef.current?.(response.credential);
        },
        auto_select: false,
      });

      render();
      setScriptReady(true);
    }

    let script = document.querySelector(`script[src="${GOOGLE_SCRIPT_URL}"]`);
    const handleLoad = () => initializeGoogle();
    const handleError = () =>
      onErrorRef.current?.(
        "Unable to load Google Sign-In. Check your internet connection and try again."
      );

    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else if (!script) {
      script = document.createElement("script");
      script.src = GOOGLE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", handleLoad);
      script.addEventListener("error", handleError);
      document.head.appendChild(script);
    } else {
      script.addEventListener("load", handleLoad);
      script.addEventListener("error", handleError);
    }

    // Re-render on resize so the button always fills its container
    const ro = new ResizeObserver(() => render());
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      cancelled = true;
      ro.disconnect();
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      <div
        ref={buttonRef}
        className="flex w-full justify-center [&>div]:!w-full [&_iframe]:!w-full"
        aria-label="Continue with Google"
      />
      {!scriptReady && (
        <div
          aria-hidden="true"
          className="h-10 w-full animate-pulse rounded-lg bg-slate-100"
        />
      )}
      {!scriptReady && <span className="sr-only">Loading Google Sign-In…</span>}
    </div>
  );
}