import { test, expect } from '@playwright/test';
import { login, deleteCardByName } from './helpers';

const NAME = `E2E-카드-${Date.now()}`;

test('로그인 → 카드 추가 → 목록 표시', async ({ page }) => {
  await login(page);

  await page.goto('/cards/new');
  await page.getByLabel('기술명').fill(NAME);

  await page.getByRole('button', { name: '저장' }).click();
  await page.waitForURL('/');
  await expect(page.getByText(NAME)).toBeVisible();
});

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  await login(page);
  await deleteCardByName(page, NAME);
  await page.close();
});
