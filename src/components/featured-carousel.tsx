"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, HeartHandshake, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export type FeaturedItem = {
  id: string;
  kind: "guide" | "story";
  tag: string;
  title: string;
  description: string;
  outcome: string;
  image: string;
  alt: string;
  href: string;
  stepCount: number;
};

export function FeaturedCarousel({ items }: { items: FeaturedItem[] }) {
  const [active, setActive] = useState(0);
  const [pausedByVisitor, setPausedByVisitor] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const item = items[active];

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (pausedByVisitor || hovered || focused || reducedMotion || items.length < 2) return;
    const timer = window.setInterval(() => setActive((index) => (index + 1) % items.length), 3000);
    return () => window.clearInterval(timer);
  }, [items.length, pausedByVisitor, hovered, focused, reducedMotion]);

  if (!item) return null;

  const move = (direction: number) => {
    const next = (active + direction + items.length) % items.length;
    setActive(next);
    setAnnouncement(`Slide ${next + 1} of ${items.length}: ${items[next].title}`);
  };

  return (
    <section
      aria-label="Repair inspiration"
      className="feature-carousel"
      aria-roledescription="carousel"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      onFocus={() => setFocused(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        aria-label={`${item.title}, ${item.kind === "story" ? "illustrative repair scenario" : "repair guide"}`}
        className="feature-card"
        href={item.href}
      >
        <div className="feature-card__image">
          <Image alt={item.alt} className="size-full object-cover" fill priority sizes="(max-width: 800px) 85vw, 480px" src={item.image} />
          <span className="feature-card__kind">
            {item.kind === "story" ? <HeartHandshake aria-hidden="true" /> : <BookOpen aria-hidden="true" />}
            {item.kind === "story" ? "Illustrative repair scenario" : "A guide to try"}
          </span>
        </div>
        <div className="feature-card__copy">
          <p className="eyebrow">{item.tag}</p>
          <h2>{item.title}</h2>
          <p className="feature-card__description">{item.description}</p>
          <div className="feature-card__meta">
            <span>{item.outcome}</span>
            <span className="feature-card__open">
              Open <ArrowUpRight aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
      {items.length > 1 && (
        <div className="feature-carousel__controls" aria-label="Choose featured repair" role="group">
          <Button aria-label="Previous repair" size="icon" variant="outline" onClick={() => move(-1)}>
            <ArrowLeft aria-hidden="true" />
          </Button>
          <Button
            aria-label={pausedByVisitor ? "Resume automatic rotation" : "Pause automatic rotation"}
            aria-pressed={pausedByVisitor}
            onClick={() => setPausedByVisitor((paused) => !paused)}
            size="icon"
            variant="outline"
          >
            {pausedByVisitor ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          </Button>
          <div className="feature-carousel__dots" aria-hidden="true">
            {items.slice(0, 8).map((entry, index) => (
              <span className={index === active % 8 ? "is-active" : ""} key={entry.id} />
            ))}
          </div>
          <span className="sr-only" aria-live="polite" role="status">
            {announcement}
          </span>
          <Button aria-label="Next repair" size="icon" variant="outline" onClick={() => move(1)}>
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      )}
    </section>
  );
}
