import { test, expect, devices, type Page } from '@playwright/test';

async function getPrimaryVisibleCard(page: Page) {
  return page.locator('[data-canvas-card]').evaluateAll((elements) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    return (
      elements
        .map((element) => {
          const htmlElement = element as HTMLElement;
          const style = window.getComputedStyle(htmlElement);
          const rect = htmlElement.getBoundingClientRect();

          const intersectWidth = Math.max(
            0,
            Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0)
          );
          const intersectHeight = Math.max(
            0,
            Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)
          );
          const visibleArea = intersectWidth * intersectHeight;

          return {
            key: htmlElement.dataset.canvasCard ?? '',
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            visibleArea,
            opacity: Number(style.opacity),
            display: style.display,
            visibility: style.visibility,
          };
        })
        .filter(
          (item) =>
            item.display !== 'none' &&
            item.visibility !== 'hidden' &&
            item.opacity > 0.01 &&
            item.width > 0 &&
            item.height > 0 &&
            item.visibleArea > 1000
        )
        .sort((a, b) => b.visibleArea - a.visibleArea)[0] ?? null
    );
  });
}

test('3D Infinite Canvas should load and be interactive', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  // Navigate to projects page with 3D view
  await page.goto('/projects?view=3d', { waitUntil: 'domcontentloaded' });

  // Wait for the canvas to load
  const canvas = page.locator('[data-canvas-viewport]');
  await expect(canvas).toBeVisible();
  await expect(page.getByText(/Mode: Infinite Canvas/i)).toBeVisible();

  const visibleCardCount = async () => {
    return page.locator('[data-canvas-card]').evaluateAll((elements) => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      return elements.filter((element) => {
        const htmlElement = element as HTMLElement;
        const style = window.getComputedStyle(htmlElement);
        const rect = htmlElement.getBoundingClientRect();
        const intersectWidth = Math.max(
          0,
          Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0)
        );
        const intersectHeight = Math.max(
          0,
          Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)
        );

        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          Number(style.opacity) > 0.01 &&
          rect.width > 0 &&
          rect.height > 0 &&
          intersectWidth * intersectHeight > 0
        );
      }).length;
    });
  };

  await expect.poll(visibleCardCount, { timeout: 15000 }).toBeGreaterThan(0);

  // Verify at least some cards are rendered
  const count = await visibleCardCount();
  console.log(`Verified ${count} visible cards on 3D canvas`);
  expect(count).toBeGreaterThan(0);

  // Simulate drag interaction
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 100);
    await page.mouse.up();
  }

  // Perform a small scroll
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(1000);

  expect(errors.length).toBe(0);
});

test('3D Infinite Canvas should navigate to a project slug on real click', async ({ page }) => {
  await page.goto('/projects?view=3d', { waitUntil: 'domcontentloaded' });

  const canvas = page.locator('[data-canvas-viewport]');
  await expect(canvas).toBeVisible();

  let targetCard: any = null;
  await expect
    .poll(
      async () => {
        targetCard = await getPrimaryVisibleCard(page);
        return targetCard?.visibleArea ?? 0;
      },
      { timeout: 15000 }
    )
    .toBeGreaterThan(1000);

  if (!targetCard) {
    throw new Error('No onscreen canvas card available for click navigation.');
  }

  const clickX = targetCard.left + Math.min(targetCard.width / 2, targetCard.width - 10);
  const clickY = targetCard.top + Math.min(targetCard.height / 2, targetCard.height - 10);

  await page.mouse.move(clickX, clickY);
  await page.mouse.click(clickX, clickY);

  await page.waitForURL(/\/projects\/[^/?#]+$/, { timeout: 10000 });
});

test('3D Infinite Canvas should render cards on mobile viewport', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['iPhone 12'] });
  const page = await context.newPage();

  try {
    await page.goto('/projects?view=3d', { waitUntil: 'domcontentloaded' });

    const canvas = page.locator('[data-canvas-viewport]');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // Verify at least one card is visible on mobile
    let targetCard: any = null;
    await expect
      .poll(
        async () => {
          targetCard = await getPrimaryVisibleCard(page);
          return targetCard?.visibleArea ?? 0;
        },
        { timeout: 15000 }
      )
      .toBeGreaterThan(1000);

    expect(targetCard).toBeTruthy();
    expect(targetCard.key).toBeTruthy();
  } finally {
    await context.close();
  }
});
