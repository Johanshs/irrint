import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';

interface BrowserSession {
  context: BrowserContext;
  page: Page;
  token: string;
  zoneIds: string[];
}

async function enterDemo(browser: Browser): Promise<BrowserSession> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar na demonstração' }).click();
  await expect(page.getByRole('heading', { name: 'Como está sua área?' })).toBeVisible();
  const session = await page.evaluate(async () => {
    const token = localStorage.getItem('irrint-session-token')!;
    const response = await fetch('http://127.0.0.1:8791/api/v1/state', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const state = (await response.json()) as { zones: Array<{ id: string }> };
    return { token, zoneIds: state.zones.map((zone) => zone.id) };
  });
  return { context, page, ...session };
}

test('E6: cada visitante opera uma demonstração hospedada independente', async ({ browser }) => {
  const first = await enterDemo(browser);
  const second = await enterDemo(browser);
  try {
    expect(first.zoneIds).toHaveLength(2);
    expect(second.zoneIds).toHaveLength(2);
    expect(first.zoneIds.every((id) => !second.zoneIds.includes(id))).toBe(true);

    const start = first.page.getByRole('button', { name: 'Iniciar irrigação' });
    await expect(start).toBeEnabled();
    await start.click();
    await expect(first.page.getByText('Irrigando', { exact: true })).toBeVisible();

    const secondState = await second.page.evaluate(async (token) => {
      const response = await fetch('http://127.0.0.1:8791/api/v1/state', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.json() as Promise<{ zones: Array<{ latest: { valve: string } | null }> }>;
    }, second.token);
    expect(secondState.zones.every((zone) => zone.latest?.valve === 'closed')).toBe(true);

    await first.page.getByRole('button', { name: 'Parar irrigação' }).click();
    await expect(first.page.getByText('Irrigação desligada', { exact: true })).toBeVisible();
  } finally {
    await first.context.close();
    await second.context.close();
  }
});
