
"use client";

import { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_URL =
  "https://accounts.google.com/gsi/client";

export default function GoogleSignInButton({
  onCredential,
  onError,
}) {
  const buttonRef = useRef(null);
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

    function initializeGoogle() {
      if (cancelled || !window.google?.accounts?.id) {
        return;
      }

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

      if (buttonRef.current) {
        buttonRef.current.innerHTML = "";

        window.google.accounts.id.renderButton(
          buttonRef.current,
          {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: 320,
          }
        );
      }

      setScriptReady(true);
    }

    let script = document.querySelector(
      `script[src="${GOOGLE_SCRIPT_URL}"]`
    );

    function handleLoad() {
      initializeGoogle();
    }

    function handleError() {
      onErrorRef.current?.(
        "Unable to load Google Sign-In. Check your internet connection and try again."
      );
    }

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

    return () => {
      cancelled = true;

      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
    };
  }, []);

  return (
    <div className="flex min-h-10 w-full justify-center">
      <div
        ref={buttonRef}
        className="max-w-full"
        aria-label="Continue with Google"
      />

      {!scriptReady && (
        <span className="sr-only">Loading Google Sign-In...</span>
      )}
    </div>
  );
}
