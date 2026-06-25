import { test, expect, devices, type Page } from '@playwright/test';

type VisibleCanvasCard = {
  key: string;
  left: number;
  top: number;
  width: number;
  height: number;
  visibleArea: number;
  opacity: number;
  display: string;
  visibility: string;
};

async function getPrimaryVisibleCard(page: Page): Promise<VisibleCanvasCard | null> {
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

async function getCanvasGeometry(page: Page) {
  return page.locator('[data-canvas-viewport]').evaluate((canvasElement) => {
    const canvasRect = canvasElement.getBoundingClientRect();
    const vtContainer = document.querySelector<HTMLElement>('main[data-vt-container="true"]');
    const vtContainerStyle = vtContainer ? window.getComputedStyle(vtContainer) : null;

    let hasTransformedAncestor = false;
    let parent = canvasElement.parentElement;
    while (parent && parent !== document.body) {
      if (window.getComputedStyle(parent).transform !== 'none') {
        hasTransformedAncestor = true;
        break;
      }
      parent = parent.parentElement;
    }

    return {
      innerHeight: window.innerHeight,
      canvasTop: canvasRect.top,
      canvasHeight: canvasRect.height,
      vtContainerMode: vtContainer?.dataset.canvasMode ?? null,
      vtContainerPaddingBottom: vtContainerStyle?.paddingBottom ?? null,
      vtContainerContain: vtContainerStyle?.contain ?? null,
      hasTransformedAncestor,
    };
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

  await expect
    .poll(
      async () => {
        const visibleCard = await getPrimaryVisibleCard(page);
        return visibleCard?.visibleArea ?? 0;
      },
      { timeout: 15000 }
    )
    .toBeGreaterThan(1000);

  const targetCard = await getPrimaryVisibleCard(page);
  if (!targetCard) {
    throw new Error('No onscreen canvas card available for click navigation.');
  }

  const clickX = targetCard.left + Math.min(targetCard.width / 2, targetCard.width - 10);
  const clickY = targetCard.top + Math.min(targetCard.height / 2, targetCard.height - 10);

  await page.mouse.move(clickX, clickY);
  await page.mouse.click(clickX, clickY);

  await page.waitForURL(/\/projects\/[^/?#]+$/, { timeout: 10000 });
});

test('3D canvas viewport geometry should stay stable during project back morph', async ({
  page,
}) => {
  await page.goto('/projects?view=3d', { waitUntil: 'domcontentloaded' });

  const canvas = page.locator('[data-canvas-viewport]');
  await expect(canvas).toBeVisible();

  await expect
    .poll(
      async () => {
        const visibleCard = await getPrimaryVisibleCard(page);
        return visibleCard?.visibleArea ?? 0;
      },
      { timeout: 15000 }
    )
    .toBeGreaterThan(1000);

  const initialGeometry = await getCanvasGeometry(page);
  expect(Math.abs(initialGeometry.canvasTop)).toBeLessThanOrEqual(1);
  expect(Math.abs(initialGeometry.canvasHeight - initialGeometry.innerHeight)).toBeLessThanOrEqual(
    1
  );
  expect(initialGeometry.vtContainerMode).toBe('true');
  expect(initialGeometry.vtContainerPaddingBottom).toBe('0px');
  expect(initialGeometry.vtContainerContain).toBe('none');
  expect(initialGeometry.hasTransformedAncestor).toBe(false);

  const targetCard = await getPrimaryVisibleCard(page);
  if (!targetCard) {
    throw new Error('No card available for back morph geometry test.');
  }

  await page.mouse.click(
    targetCard.left + targetCard.width / 2,
    targetCard.top + targetCard.height / 2
  );
  await page.waitForURL(/\/projects\/[^/?#]+$/, { timeout: 10000 });
  await expect(page.getByText('Back to Projects')).toBeVisible();

  await page.getByText('Back to Projects').click();
  await page.waitForURL(/\/projects\?view=3d$/, { timeout: 10000 });
  await expect(canvas).toBeVisible();

  const backSamples = await page.evaluate(async () => {
    const samples: Array<{
      cardTop: number | null;
      canvasTop: number;
      canvasHeight: number;
      innerHeight: number;
    }> = [];
    const start = performance.now();

    await new Promise<void>((resolve) => {
      const sample = () => {
        const target = document.querySelector<HTMLElement>('[data-project-cover-transition]');
        const canvas = document.querySelector<HTMLElement>('[data-canvas-viewport]');
        const targetRect = target?.getBoundingClientRect();
        const canvasRect = canvas?.getBoundingClientRect();

        if (canvasRect) {
          samples.push({
            cardTop: targetRect ? targetRect.top : null,
            canvasTop: canvasRect.top,
            canvasHeight: canvasRect.height,
            innerHeight: window.innerHeight,
          });
        }

        if (performance.now() - start < 900) {
          requestAnimationFrame(sample);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(sample);
    });

    return samples;
  });

  const cardTops = backSamples
    .map((sample) => sample.cardTop)
    .filter((top): top is number => typeof top === 'number');
  expect(cardTops.length).toBeGreaterThan(5);
  expect(Math.max(...cardTops) - Math.min(...cardTops)).toBeLessThanOrEqual(8);

  for (const sample of backSamples) {
    expect(Math.abs(sample.canvasTop)).toBeLessThanOrEqual(1);
    expect(Math.abs(sample.canvasHeight - sample.innerHeight)).toBeLessThanOrEqual(1);
  }
});

test('canvas tooltip should stay responsive during scroll inertia', async ({ page }) => {
  await page.goto('/projects?view=3d', { waitUntil: 'domcontentloaded' });

  const canvas = page.locator('[data-canvas-viewport]');
  const tooltip = page.locator('[data-canvas-tooltip]');
  await expect(canvas).toBeVisible();

  await expect
    .poll(
      async () => {
        const visibleCard = await getPrimaryVisibleCard(page);
        return visibleCard?.visibleArea ?? 0;
      },
      { timeout: 15000 }
    )
    .toBeGreaterThan(1000);

  const targetCard = await getPrimaryVisibleCard(page);
  if (!targetCard) {
    throw new Error('No onscreen canvas card available for tooltip regression test.');
  }

  const pointerX = targetCard.left + targetCard.width / 2;
  const pointerY = targetCard.top + targetCard.height / 2;
  await page.mouse.move(pointerX, pointerY);
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveCSS('opacity', '1');

  await page.mouse.wheel(0, 10);
  await expect(tooltip).toHaveCSS('opacity', '1', { timeout: 300 });
});

test('3D Infinite Canvas should render cards on mobile viewport', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['iPhone 12'] });
  const page = await context.newPage();

  try {
    await page.goto('/projects?view=3d', { waitUntil: 'domcontentloaded' });

    const canvas = page.locator('[data-canvas-viewport]');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // Verify at least one card is visible on mobile
    await expect
      .poll(
        async () => {
          const visibleCard = await getPrimaryVisibleCard(page);
          return visibleCard?.visibleArea ?? 0;
        },
        { timeout: 15000 }
      )
      .toBeGreaterThan(1000);

    const targetCard = await getPrimaryVisibleCard(page);
    expect(targetCard).toBeTruthy();
    expect(targetCard?.key).toBeTruthy();
  } finally {
    await context.close();
  }
});

test('3D Infinite Canvas should maintain a smooth frame rate (FPS) during scroll interactions', async ({
  page,
}) => {
  await page.goto('/projects?view=3d', { waitUntil: 'domcontentloaded' });
  const canvas = page.locator('[data-canvas-viewport]');
  await expect(canvas).toBeVisible();

  // Start measuring FPS asynchronously inside browser context
  const fpsMeasurement = page.evaluate(async () => {
    return new Promise<number>((resolve) => {
      let frameCount = 0;
      const startTime = performance.now();

      function tick() {
        frameCount++;
        const elapsed = performance.now() - startTime;
        if (elapsed >= 1500) {
          // Measure over 1.5 seconds
          resolve((frameCount * 1000) / elapsed);
        } else {
          requestAnimationFrame(tick);
        }
      }
      requestAnimationFrame(tick);
    });
  });

  // Perform scroll interactions during measurement to simulate active rendering
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(100);
  }

  const averageFPS = await fpsMeasurement;
  console.log(`Measured average FPS during scroll: ${averageFPS.toFixed(1)} FPS`);

  // Assert frame rate is smooth. We set the threshold to >= 40 FPS to avoid flaky failures
  // on resource-constrained CI/CD virtual machines, while still catching major lags/janks (< 30 FPS).
  expect(averageFPS).toBeGreaterThan(40);
});

test('3D Infinite Canvas should transition to project detail page and back smoothly and maintain performance', async ({
  page,
}) => {
  await page.goto('/projects?view=3d', { waitUntil: 'domcontentloaded' });
  const canvas = page.locator('[data-canvas-viewport]');
  await expect(canvas).toBeVisible();

  // Wait for canvas card to be visible in viewport
  await expect
    .poll(
      async () => {
        const visibleCard = await getPrimaryVisibleCard(page);
        return visibleCard?.visibleArea ?? 0;
      },
      { timeout: 15000 }
    )
    .toBeGreaterThan(1000);

  const targetCard = await getPrimaryVisibleCard(page);
  if (!targetCard) {
    throw new Error('No card available for transition test.');
  }

  // Calculate coordinates for click navigation
  const clickX = targetCard.left + targetCard.width / 2;
  const clickY = targetCard.top + targetCard.height / 2;

  // Navigate forward by clicking card
  await page.mouse.move(clickX, clickY);
  await page.mouse.click(clickX, clickY);
  await page.waitForURL(/\/projects\/[^/?#]+$/, { timeout: 10000 });

  // Verify that we are on the project detail page by checking for the back button
  const backButton = page.locator('text=Back to Projects');
  await expect(backButton).toBeVisible();

  // Click back button to return to canvas 3d view
  await backButton.click();
  await page.waitForURL(/\/projects\?view=3d$/, { timeout: 10000 });

  // Let the canvas settle for a brief moment after transition
  await page.waitForTimeout(500);

  // Measure active canvas FPS to ensure it remains smooth and performs well after restoring
  const fpsMeasurement = page.evaluate(async () => {
    return new Promise<number>((resolve) => {
      let frameCount = 0;
      const startTime = performance.now();

      function tick() {
        frameCount++;
        const elapsed = performance.now() - startTime;
        if (elapsed >= 1500) {
          // Measure over 1.5 seconds
          resolve((frameCount * 1000) / elapsed);
        } else {
          requestAnimationFrame(tick);
        }
      }
      requestAnimationFrame(tick);
    });
  });

  // Perform scroll interactions during measurement to simulate active rendering on back navigation
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(100);
  }

  const restoredFPS = await fpsMeasurement;
  console.log(`Canvas FPS after back transition: ${restoredFPS.toFixed(1)} FPS`);
  expect(restoredFPS).toBeGreaterThan(40);
});
