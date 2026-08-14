import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/?tests=true');
});

test('browser smoke tests exposed by tests.js pass', async ({ page }) => {
  await page.waitForFunction(() => window.__SABESP_TEST_RESULTS__?.done === true);

  const results = await page.evaluate(() => window.__SABESP_TEST_RESULTS__);
  expect(results.falhou).toBe(0);
  expect(results.passou).toBeGreaterThan(0);
});

test('exibe versao e historico atuais', async ({ page }) => {
  const versaoExibida = await page.evaluate(() => window.SABESP_APP_INFO.displayVersion);
  await expect(page.locator('.version-badge')).toContainText(versaoExibida);
  await expect(page.locator('.changelog-box li').first()).toContainText(versaoExibida);
});

test('calcula agua perdida por area de furo circular', async ({ page }) => {
  await page.locator('#data-ini').fill('2026-01-01');
  await page.locator('#hora-ini').fill('08:00');
  await page.locator('#data-fim').fill('2026-01-01');
  await page.locator('#hora-fim').fill('09:00');

  await expect(page.locator('#calc-segundos')).toHaveText('3600');
  await expect(page.locator('#calc-vazao')).toHaveText('2,684');
  await expect(page.locator('#calc-vol')).toHaveText('9,66');
  await expect(page.locator('#calc-total-agua')).toHaveText('198,29');
  await expect(page.locator('#total-final')).toHaveText('198,29');
});

test('bloqueia salvar e imprimir quando secao plena usa diametro invalido', async ({ page }) => {
  await page.locator('#tipo-secao').selectOption('Seção Plena');
  await page.locator('#diametro-dano').selectOption('Outros');

  await expect(page.locator('#aviso-secao-plena')).toContainText('Diâmetro inválido.');
  await expect(page.locator('#btn-salvar-proj')).toBeDisabled();
  await expect(page.locator('#btn-imprimir-proj')).toBeDisabled();
});

test('secao plena limita o faturamento ao fechamento dos registros', async ({ page }) => {
  // DN 50 mm @ 10 mca -> Q0 = 22,552 L/s
  // Ocorrencia de 12180 s (08:00 -> 11:23), mas o vazamento foi interrompido
  // em 60 min: só esses 3600 s sao faturaveis.
  //   V = (2/3) x 22,552 L/s x 3600 s = 54,126 m3
  await page.locator('#tipo-secao').selectOption('Seção Plena');
  await page.locator('#diametro-dano').selectOption('50');
  await page.locator('#pressao').fill('10');
  await page.locator('#tempo-manobra').fill('60');
  await page.locator('#data-ini').fill('2026-01-01');
  await page.locator('#hora-ini').fill('08:00');
  await page.locator('#data-fim').fill('2026-01-01');
  await page.locator('#hora-fim').fill('11:23');

  await expect(page.locator('#calc-segundos')).toHaveText('12180');
  await expect(page.locator('#calc-vazao')).toHaveText('22,552');
  await expect(page.locator('#calc-vol')).toHaveText('54,13');
  // A interface deixa explicito que o periodo faturado foi limitado
  await expect(page.locator('#aviso-secao-plena')).toContainText('3.600 s');
  await expect(page.locator('#aviso-secao-plena')).toContainText('limitado pelo fechamento da rede');
  // Vazao media = 2/3 de Q0, refletindo o decaimento de pressao
  await expect(page.locator('#aviso-secao-plena')).toContainText('15,035');
});

test('secao plena sem limitacao usa toda a duracao da ocorrencia', async ({ page }) => {
  // Ocorrencia de 1800 s menor que o tempo de fechamento (60 min):
  //   V = (2/3) x 22,552 L/s x 1800 s = 27,063 m3
  await page.locator('#tipo-secao').selectOption('Seção Plena');
  await page.locator('#diametro-dano').selectOption('50');
  await page.locator('#pressao').fill('10');
  await page.locator('#tempo-manobra').fill('60');
  await page.locator('#data-ini').fill('2026-01-01');
  await page.locator('#hora-ini').fill('08:00');
  await page.locator('#data-fim').fill('2026-01-01');
  await page.locator('#hora-fim').fill('08:30');

  await expect(page.locator('#calc-vol')).toHaveText('27,06');
  await expect(page.locator('#aviso-secao-plena')).not.toContainText('limitado pelo fechamento');
});

test('mostra campo livre quando causador e Outros', async ({ page }) => {
  await page.locator('#causador').selectOption('Outros');
  await expect(page.locator('#causador-outros')).toBeVisible();

  await page.locator('#causador').selectOption('COMGAS');
  await expect(page.locator('#causador-outros')).toBeHidden();
});

test('bloqueia salvar documento com campos obrigatorios ausentes', async ({ page }) => {
  let mensagem = '';
  page.on('dialog', async dialog => {
    mensagem = dialog.message();
    await dialog.dismiss();
  });

  await page.locator('#btn-salvar-proj').click();

  expect(mensagem).toContain('Antes de salvar o projeto');
  expect(mensagem).toContain('Identificacao');
  expect(mensagem).toContain('OS');
});
