"use client";

import Link from "next/link";
import { InfiniteSlider } from "@/components/core/infinite-slider";
import {
  FOUNDRYS_TESTIMONIALS_URL,
  type HomeTestimonial,
} from "@/lib/marketing/foundrys-testimonials";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function TestimonialSlide({ item }: { item: HomeTestimonial }) {
  return (
    <figure className="home-testimonial-card home-testimonial-slide">
      <blockquote className="home-testimonial-quote">
        <span className="home-testimonial-mark" aria-hidden>
          “
        </span>
        {item.quote}
      </blockquote>
      <figcaption className="home-testimonial-author">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt=""
            className="home-testimonial-avatar home-testimonial-avatar-photo"
          />
        ) : (
          <span className="home-testimonial-avatar" aria-hidden>
            {initials(item.name)}
          </span>
        )}
        <span>
          <span className="home-testimonial-name">{item.name}</span>
          <span className="home-testimonial-role">
            {item.headline ?? item.programTitle}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

export function HomeTestimonialsSlider({
  items,
}: {
  items: HomeTestimonial[];
}) {
  if (items.length === 0) return null;

  return (
    <section
      className="home-section home-testimonials-section"
      aria-labelledby="home-testimonials-heading"
    >
      <div className="home-container">
        <div className="home-section-head home-section-head-center">
          <h2 id="home-testimonials-heading" className="home-section-title">
            Stories of real transformation
          </h2>
          <p className="home-section-lead">
            Alumni who transitioned into high-impact roles in AI, cybersecurity, and
            deep tech — from{" "}
            <a
              href={FOUNDRYS_TESTIMONIALS_URL}
              className="text-brand underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              The Foundrys
            </a>
            .
          </p>
        </div>
      </div>

      <div className="home-testimonials-slider-wrap">
        <InfiniteSlider speed={40} speedOnHover={90} gap={24}>
          {items.map((item) => (
            <TestimonialSlide key={item.id} item={item} />
          ))}
        </InfiniteSlider>
      </div>

      <p className="home-testimonials-more">
        <Link
          href={FOUNDRYS_TESTIMONIALS_URL}
          className="home-section-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          Read all stories on The Foundrys
        </Link>
      </p>
    </section>
  );
}
