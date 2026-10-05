import { useEffect, useRef, useState } from "react";
import { FaFacebookF } from "react-icons/fa";
import styles from "../styles/SocialAuthButtons.module.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
let googleScriptPromise;

function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    let script = document.getElementById("google-identity-services");
    if (!script) {
      script = document.createElement("script");
      script.id = "google-identity-services";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
    }

    script.addEventListener("load", () => {
      if (window.google?.accounts?.id) resolve();
      else reject(new Error("Google sign-in could not be initialized."));
    }, { once: true });
    script.addEventListener("error", () => {
      script.remove();
      reject(new Error("Google sign-in could not be loaded. Please try again."));
    }, { once: true });

    if (!script.isConnected) document.head.appendChild(script);
  }).catch((error) => {
    googleScriptPromise = null;
    throw error;
  });

  return googleScriptPromise;
}

function SocialAuthButtons({ onGoogleCredential }) {
  const buttonRef = useRef(null);
  const credentialHandlerRef = useRef(onGoogleCredential);
  const [error, setError] = useState("");
  const configurationError = GOOGLE_CLIENT_ID
    ? ""
    : "Google sign-in is not configured for this deployment.";

  useEffect(() => {
    credentialHandlerRef.current = onGoogleCredential;
  }, [onGoogleCredential]);

  useEffect(() => {
    let active = true;

    if (!GOOGLE_CLIENT_ID) return undefined;

    loadGoogleIdentity()
      .then(() => {
        if (!active || !buttonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (!response.credential) {
              setError("Google did not return a sign-in credential.");
              return;
            }
            credentialHandlerRef.current(response.credential);
          },
        });
        buttonRef.current.replaceChildren();
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: Math.max(180, Math.floor(buttonRef.current.clientWidth)),
        });
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <div className={styles.buttons}>
        <div className={styles.googleButton} ref={buttonRef} />
        <button
          type="button"
          className={styles.facebookButton}
          disabled
          title="Facebook sign-in is not configured for this application."
        >
          <FaFacebookF aria-hidden="true" />
          Facebook (not configured)
        </button>
      </div>
      {(error || configurationError) && (
        <span className={styles.error} role="status">{error || configurationError}</span>
      )}
    </>
  );
}

export default SocialAuthButtons;
