import { expect, test, type Locator, type Page } from '@playwright/test';

async function loginWithKeyboard(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Irrigação na palma da mão' })).toBeVisible();
  const email = page.getByLabel('E-mail');
  const password = page.getByLabel('Senha');
  await email.focus();
  await page.keyboard.press('Tab');
  await expect(password).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Como está sua área?' })).toBeVisible();
}

async function assertInsideViewport(locator: Locator, viewportWidth: number) {
  const box = await locator.boundingBox();
  expect(box, `Elemento ${await locator.textContent()} precisa estar visível`).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewportWidth + 1);
}

async function latestSequence(page: Page) {
  return page.evaluate(async () => {
    const token = localStorage.getItem('irrint-session-token');
    const response = await fetch('/api/v1/state', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const state = (await response.json()) as { zones: Array<{ latest: null | { sequence: number } }> };
    return Math.max(0, ...state.zones.map((zone) => zone.latest?.sequence ?? 0));
  });
}

test('CT18: controles essenciais cabem em 360/390/430 px com fonte ampliada', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await loginWithKeyboard(page);
  const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(viewport).not.toContain('user-scalable=no');
  expect(viewport).not.toContain('maximum-scale');
  await page.goto('/app/history/laboratory');
  await expect(page.getByRole('heading', { name: 'Laboratório 3D' })).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '125%';
  });

  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 800 });
    for (const control of [
      page.getByLabel('Sistema'),
      page.getByLabel('Teste'),
      page.getByRole('button', { name: 'Executar teste' }),
      page.getByRole('button', { name: 'Maquete 3D' }),
      page.getByRole('button', { name: 'Entender o teste' }),
      page.getByRole('button', { name: 'Resultados' }),
    ])
      await assertInsideViewport(control, width);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    ).toBeLessThanOrEqual(1);
  }
});

test('CT18: sem WebGL mantém descrições, componentes e controles nomeados', async ({ page }) => {
  await page.addInitScript({
    content: `
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        if (typeof type === 'string' && type.startsWith('webgl')) return null;
        return originalGetContext.call(this, type, ...args);
      };
    `,
  });
  await loginWithKeyboard(page);
  await page.goto('/app/history/laboratory');
  await expect(page.getByText('3D indisponível neste aparelho.')).toBeVisible();
  await page.getByText('Visualização e componentes', { exact: true }).click();
  await page.getByRole('button', { name: 'Sensor de umidade N' }).click();
  const dialog = page.getByRole('dialog', { name: 'Sensor de umidade' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Modelo 3D indisponível.')).toBeVisible();
  await expect(dialog.getByText('Sensores capacitivos, sondas industriais', { exact: false })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Fechar detalhes do componente' })).toBeFocused();
});

test('CT22: pausa, velocidade, reinício e nova execução permanecem isolados', async ({ page }) => {
  await loginWithKeyboard(page);
  await page.goto('/app/history/laboratory');
  await expect.poll(() => latestSequence(page)).toBeGreaterThan(0);

  const automaticResponse = page.waitForResponse(
    (response) => response.url().endsWith('/api/v1/experiments') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Executar teste' }).click();
  const automatic = await (await automaticResponse).json();
  expect(automatic).toMatchObject({ input: { scenario: 'automatic' }, metrics: { openSeconds: 21 } });

  await page.getByRole('button', { name: 'Pausar reprodução' }).click();
  const slider = page.getByRole('slider', { name: 'Instante da reprodução' });
  const pausedAt = Number(await slider.inputValue());
  const liveBefore = await latestSequence(page);
  await page.waitForTimeout(1200);
  expect(Number(await slider.inputValue())).toBe(pausedAt);
  await expect.poll(() => latestSequence(page)).toBeGreaterThan(liveBefore);
  await expect(page.getByText('Sem confirmação atual')).toHaveCount(0);

  await page.getByLabel('Velocidade').selectOption('10');
  await page.getByRole('button', { name: 'Continuar reprodução' }).click();
  await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(pausedAt);
  await page.getByRole('button', { name: 'Pausar reprodução' }).click();
  await slider.press('End');
  await expect(slider).toHaveValue('89');
  await page.getByRole('button', { name: 'Rever reprodução' }).click();
  await expect(slider).not.toHaveValue('89');

  await page.getByLabel('Teste').selectOption('manual-stop');
  const manualResponse = page.waitForResponse(
    (response) => response.url().endsWith('/api/v1/experiments') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Executar teste' }).click();
  const manual = await (await manualResponse).json();
  expect(manual).toMatchObject({ input: { scenario: 'manual-stop' }, metrics: { openSeconds: 3 } });
  expect(manual.id).not.toBe(automatic.id);

  await page.getByRole('button', { name: 'Resultados' }).click();
  await expect(page.getByRole('heading', { name: 'Resultado completo · 90 s' })).toBeVisible();
  await expect(page.locator('.result-readings')).toContainText('3s');
  await expect(page.locator('.result-readings')).toContainText('0.030L');
  await page.getByText('Comparar últimos testes desta visita (2/8)').click();
  const rows = page.locator('.lab-comparison tbody tr');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('Parada manual prioritária');
  await expect(rows.nth(0)).toContainText('3 s');
  await expect(rows.nth(1)).toContainText('Solo seco e recuperação');
  await expect(rows.nth(1)).toContainText('21 s');
});
