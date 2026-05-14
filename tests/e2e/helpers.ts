import type { Page } from '@playwright/test';

export async function login(page: Page) {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    throw new Error('E2E_EMAIL / E2E_PASSWORD 환경 변수가 필요합니다.');
  }
  await page.goto('/login');
  await page.getByPlaceholder('이메일').fill(email);
  await page.getByPlaceholder('비밀번호').fill(password);
  await page.getByRole('button', { name: '로그인' }).click();
  await page.waitForURL('/');
}

export async function deleteCardByName(page: Page, name: string) {
  await page.goto('/');
  const card = page.locator('div', { has: page.locator(`text=${name}`) }).first();
  if (await card.count()) {
    await card.click();
    await page.waitForURL(/\/cards\//);
    page.once('dialog', (d) => void d.accept());
    await page.getByRole('button', { name: '삭제' }).click();
    await page.waitForURL('/');
  }
}
