import type { Page } from "@playwright/test";

/**
 * Records anything that should never happen on a healthy page: console errors, uncaught exceptions,
 * and failed or 4xx/5xx requests. Next.js background prefetch files (`__next.*.txt`) are ignored because
 * some static servers answer them with 404 and the site simply falls back to a normal page load.
 */
export function collectProblems(page: Page) {
  const problems: string[] = [];
  const ignorable = (url: string) => url.includes("__next.");

  page.on("console", (message) => {
    if (message.type() === "error" && !ignorable(message.location().url)) {
      problems.push(`console error: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => problems.push(`uncaught exception: ${error.message}`));
  page.on("requestfailed", (request) => {
    const reason = request.failure()?.errorText ?? "";
    if (!ignorable(request.url()) && !reason.includes("ERR_ABORTED")) problems.push(`request failed: ${request.url()} (${reason})`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && !ignorable(response.url())) problems.push(`${response.status()} ${response.url()}`);
  });

  return { list: () => [...problems] };
}

/** Scrolls to the bottom in steps so lazy images load and scroll-triggered animations run. */
export async function scrollThrough(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 500) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 0));
}

export async function scrollToY(page: Page, y: number) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
}
