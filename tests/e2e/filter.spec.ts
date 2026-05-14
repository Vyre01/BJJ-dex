import { test, expect } from '@playwright/test';

test('필터 적용 → URL 반영', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('카테고리').selectOption('서브미션');
  await expect(page).toHaveURL(/category=%EC%84%9C%EB%B8%8C%EB%AF%B8%EC%85%98/);

  await page.getByLabel('포지션').selectOption('마운트');
  await expect(page).toHaveURL(/position=%EB%A7%88%EC%9A%B4%ED%8A%B8/);

  await page.getByRole('button', { name: '초기화' }).click();
  await expect(page).toHaveURL(/\/$/);
});
