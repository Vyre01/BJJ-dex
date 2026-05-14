import { test, expect } from '@playwright/test';
import path from 'node:path';
import { login, deleteCardByName } from './helpers';

const NAME = `E2E-카드-${Date.now()}`;

test('로그인 → 카드 추가(이미지 포함) → 목록 표시', async ({ page }) => {
  await login(page);

  await page.goto('/cards/new');
  await page.getByLabel('기술명').fill(NAME);
  await page.locator('input[type=file]').setInputFiles(path.resolve('tests/e2e/fixtures/sample.png'));
  // 압축 완료 대기 (미리보기 이미지 출현)
  await expect(page.getByAltText('미리보기')).toBeVisible({ timeout: 15_000 });

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
