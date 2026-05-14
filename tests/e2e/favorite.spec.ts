import { test, expect } from '@playwright/test';
import path from 'node:path';
import { login, deleteCardByName } from './helpers';

const NAME = `E2E-즐겨-${Date.now()}`;

test('즐겨찾기 토글 → 새로고침 후 유지', async ({ page }) => {
  await login(page);

  // 사전 카드 1장 생성
  await page.goto('/cards/new');
  await page.getByLabel('기술명').fill(NAME);
  await page.locator('input[type=file]').setInputFiles(path.resolve('tests/e2e/fixtures/sample.png'));
  await expect(page.getByAltText('미리보기')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: '저장' }).click();
  await page.waitForURL('/');

  // 해당 카드의 ★ 버튼 클릭
  const card = page.locator('a', { hasText: NAME }).first().locator('..');
  await card.getByRole('button', { name: /즐겨찾기/ }).click();

  // 즐겨찾기 페이지로 이동해 노출 확인
  await page.goto('/favorites');
  await expect(page.getByText(NAME)).toBeVisible();

  // 새로고침 후 유지
  await page.reload();
  await expect(page.getByText(NAME)).toBeVisible();
});

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  await login(page);
  await deleteCardByName(page, NAME);
  await page.close();
});
