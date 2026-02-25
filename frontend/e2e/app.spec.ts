import { test, expect } from '@playwright/test'

test('auth, presets, spaced-repetition practice flow', async ({ page }) => {
  await page.goto('/auth')
  await page.getByRole('button', { name: 'Test Login' }).click()
  await page.waitForURL('**/categories')
  await expect(page.getByText('Categories')).toBeVisible()

  await page.getByRole('link', { name: 'Go to practice' }).click()
  await expect(page.getByText('Conjugation')).toBeVisible()

  await page.getByPlaceholder('preset name').fill('my-custom')
  await page.getByPlaceholder('infinitive').fill('lernen')
  await page.getByPlaceholder('sentence').fill('Ich ____ Deutsch jeden Tag.')
  await page.getByPlaceholder('translation').fill('I learn German every day.')
  await page.getByPlaceholder('expected').fill('lerne')
  await page.getByRole('button', { name: 'Create preset' }).click()

  await page.getByRole('combobox').selectOption('basic')
  await page.getByRole('button', { name: 'Start round' }).click()
  await expect(page.getByText('Ich ____ meine Hausaufgaben.')).toBeVisible()
  await page.getByRole('textbox').last().fill('wrong')
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByText('expected: mache')).toBeVisible()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('textbox').last().fill('gehen')
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByText('success')).toBeVisible()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText('Round complete')).toBeVisible()

  await page.getByRole('combobox').selectOption('separable')
  await page.getByRole('button', { name: 'Start round' }).click()
  await expect(page.getByText('Ich ____ um 7 Uhr ____.')).toBeVisible()

  await page.getByRole('button', { name: 'Logout' }).click()
})
