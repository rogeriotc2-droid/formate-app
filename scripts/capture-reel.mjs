import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { mkdirSync, rmSync, readdirSync } from "node:fs";

const CHROMIUM = execSync("which chromium").toString().trim();
const URL = process.env.CAPTURE_URL || "http://localhost:80/reel/?capture=1";
const OUT_DIR = process.env.OUT_DIR || "/tmp/reel-capture";
const W = Number(process.env.WIDTH || 1080);
const H = Number(process.env.HEIGHT || 1920);
const RECORD_MS = Number(process.env.RECORD_MS || 31000);

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({
  executablePath: CHROMIUM,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
});

const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  recordVideo: { dir: OUT_DIR, size: { width: W, height: H } },
});

const page = await context.newPage();
await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(RECORD_MS);
await context.close();
await browser.close();

const file = readdirSync(OUT_DIR).find((f) => f.endsWith(".webm"));
console.log("VIDEO:" + OUT_DIR + "/" + file);
