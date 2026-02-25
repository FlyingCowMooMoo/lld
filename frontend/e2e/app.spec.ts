import { test, expect } from '@playwright/test'

test('auth and practice flow coverage', async ({ page }) => {
  await page.goto('/auth')
  await page.getByRole('button', { name: 'Test Login' }).click()
  await page.waitForURL('**/categories')
  await expect(page.getByText('Categories')).toBeVisible()
  await page.getByRole('link', { name: 'Go to practice' }).click()
  await expect(page.getByText('Conjugation')).toBeVisible()

  await page.getByRole('combobox').selectOption('basic')
  await page.getByRole('button', { name: 'Start round' }).click()
  await expect(page.getByText('Ich ____ meine Hausaufgaben.')).toBeVisible()
  await page.getByRole('textbox').fill('wrong')
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByText('expected: mache')).toBeVisible()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('textbox').fill('gehen')
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByText('success')).toBeVisible()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText('Round complete')).toBeVisible()

  await page.getByRole('combobox').selectOption('separable')
  await page.getByRole('button', { name: 'Start round' }).click()
  await expect(page.getByText('Ich ____ um 7 Uhr ____.')).toBeVisible()

  await page.getByRole('button', { name: 'Logout' }).click()
})
