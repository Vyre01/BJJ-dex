import { test, expect } from '@playwright/test';

test('비인증 사용자가 /cards/new 접근 시 /login으로 리다이렉트', async ({ page }) => {
  await page.goto('/cards/new');
  await expect(page).toHaveURL(/\/login\?next=%2Fcards%2Fnew/);
});

test('비인증 사용자가 /cards/x/edit 접근 시 /login으로 리다이렉트', async ({ page }) => {
  await page.goto('/cards/00000000-0000-0000-0000-000000000000/edit');
  await expect(page).toHaveURL(/\/login\?next=/);
});
