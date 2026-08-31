"use client";

import { Mail } from "lucide-react";
import { useState } from "react";
import { APP_NAME } from "@/lib/brand";

export function HomeNewsletterSignup() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <aside className="home-footer-newsletter" aria-labelledby="home-footer-newsletter-title">
      <div className="home-footer-newsletter-panel">
        <div className="home-footer-newsletter-head">
          <span className="home-footer-newsletter-icon" aria-hidden>
            <Mail className="size-4" strokeWidth={1.75} />
          </span>
          <div>
            <p id="home-footer-newsletter-title" className="home-footer-newsletter-title">
              Stay updated
            </p>
            <p className="home-footer-newsletter-copy">
              Programmes, intakes, and learning updates from {APP_NAME}.
            </p>
          </div>
        </div>

        {submitted ? (
          <p className="home-footer-newsletter-success" role="status">
            Thanks — you&apos;re on the list.
          </p>
        ) : (
          <form className="home-footer-newsletter-form" onSubmit={handleSubmit}>
            <label htmlFor="home-newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="home-newsletter-email"
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="home-footer-newsletter-input"
            />
            <button type="submit" className="home-footer-newsletter-button">
              Subscribe
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
