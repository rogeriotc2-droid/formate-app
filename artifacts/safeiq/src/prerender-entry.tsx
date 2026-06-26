import type { ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { Router } from "wouter";

import FreeSsspTemplate from "@/pages/seo/free-sssp-template";
import SwmsTemplate from "@/pages/seo/swms-template";
import JsaTemplate from "@/pages/seo/jsa-template";
import WhatIsAnSssp from "@/pages/guides/what-is-an-sssp";
import HowToWriteAnSssp from "@/pages/guides/how-to-write-an-sssp";
import SsspRequirementsNz from "@/pages/guides/sssp-requirements-nz";

/**
 * Build-time pre-rendering for the public marketing/SEO pages.
 *
 * The app is a client-rendered SPA, so without this every route is served the
 * same raw index.html (home title + a canonical pointing at the homepage).
 * Google reads that raw HTML, sees no unique content + a home canonical, and
 * flags each page as a Soft 404 / duplicate of the homepage — refusing to
 * index it. Pre-rendering ships real HTML (unique title/description/canonical
 * + body content) for crawlers; the client bundle then takes over for users.
 */
export interface PrerenderRoute {
  path: string;
  title: string;
  description: string;
  Component: ComponentType;
}

export const ROUTES: PrerenderRoute[] = [
  {
    path: "/free-sssp-template",
    title: "Free SSSP Template NZ — Download or Fill in 60 Seconds | Formate",
    description:
      "Download a free NZ SSSP template built to WorkSafe guidance — or fill a site-specific safety plan online in 60 seconds. Hazard register, task analysis & sign-off included.",
    Component: FreeSsspTemplate,
  },
  {
    path: "/swms-template",
    title: "SWMS Template (NZ & AU) — Free Safe Work Method Statement | Formate",
    description:
      "Free SWMS template for NZ & Australian worksites. Build a Safe Work Method Statement in 60 seconds — high-risk job steps, hazards, controls and worker sign-off. Faster than paper.",
    Component: SwmsTemplate,
  },
  {
    path: "/jsa-template",
    title: "JSA Template — Free Job Safety Analysis (NZ & AU) | Formate",
    description:
      "Free JSA template (Job Safety Analysis / JSEA). Break a job into steps, list hazards and controls, and sign off in 60 seconds. Built for NZ & AU tradies — faster than paper.",
    Component: JsaTemplate,
  },
  {
    path: "/guides/what-is-an-sssp",
    title: "What is an SSSP? Site-Specific Safety Plan Explained (NZ) | Formate",
    description:
      "What is an SSSP (Site-Specific Safety Plan)? A plain-English guide for NZ tradies — what it covers, when you need one, who signs it, and how to make one fast.",
    Component: WhatIsAnSssp,
  },
  {
    path: "/guides/how-to-write-an-sssp",
    title: "How to Write an SSSP — Step-by-Step Guide (NZ) | Formate",
    description:
      "How to write an SSSP in NZ, step by step. What to include in your Site-Specific Safety Plan — hazards, controls, emergency plan, sign-off — and how to do it in 60 seconds.",
    Component: HowToWriteAnSssp,
  },
  {
    path: "/guides/sssp-requirements-nz",
    title: "SSSP Requirements NZ — What WorkSafe Expects | Formate",
    description:
      "SSSP requirements in New Zealand explained. What a Site-Specific Safety Plan must include under WorkSafe NZ guidance, who needs one, and PCBU sign-off responsibilities.",
    Component: SsspRequirementsNz,
  },
];

export function renderRoute(route: PrerenderRoute): string {
  const { Component } = route;
  return renderToString(
    <Router ssrPath={route.path}>
      <Component />
    </Router>,
  );
}
