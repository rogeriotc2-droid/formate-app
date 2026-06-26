import { useEffect } from "react";

const SITE = "https://formate.co.nz";
const OG_IMAGE = `${SITE}/opengraph.png`;

interface SeoOptions {
  title: string;
  description: string;
  /** Path beginning with a slash, e.g. "/free-sssp-template". */
  path: string;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Sets per-page SEO tags (title, description, canonical, Open Graph, Twitter).
 * Restores the document title on unmount so SPA navigation stays clean.
 */
export function useSeo({ title, description, path }: SeoOptions) {
  useEffect(() => {
    const url = `${SITE}${path}`;
    const prevTitle = document.title;

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", "index, follow");
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", OG_IMAGE);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", OG_IMAGE);
    upsertCanonical(url);

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, path]);
}

export interface FaqItem {
  q: string;
  a: string;
}

/**
 * Injects FAQPage structured data (JSON-LD) so Google can show rich results.
 * Removes the script on unmount.
 */
export function useFaqJsonLd(items: FaqItem[]) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.seo = "faq";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    });
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [items]);
}
