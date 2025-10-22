import { test, expect } from '@playwright/test';
import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided.");
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const TEST_URL = 'http://localhost:3000';

async function cleanupUser(email: string) {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing users:', error);
    return;
  }
  const user = users.find(u => u.email === email);
  if (user) {
    await supabase.auth.admin.deleteUser(user.id);
  }
}

test.describe('Claim Letter Flow', () => {
  const email = `test-claim-${uuidv4()}@test.com`;
  const password = 'password123';

  test.afterAll(async () => {
    await cleanupUser(email);
  });

  test('should create a letter anonymously, sign up, and see it in the sent folder', async ({ page }) => {
    // 1. Create a letter anonymously
    await page.goto(`${TEST_URL}/create`);
    await page.getByPlaceholder('Your name').fill('Anonymous Sender');
    await page.getByPlaceholder('Your friend\'s name').fill('Test Recipient');
    const letterContent = `This is a test letter for the claim flow ${Date.now()}`;
    await page.locator('textarea').fill(letterContent);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.waitForURL(`${TEST_URL}/create/music`);
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.waitForURL(`${TEST_URL}/create/preview`);
    await page.getByRole('button', { name: 'Finalize & Share' }).click();
    await page.waitForURL((url) => url.toString().includes('/letter/'));

    // 2. Sign up
    await page.goto(`${TEST_URL}/login`);
    await page.getByRole('button', { name: 'Sign up' }).click();
    await page.getByPlaceholder('Your email address').fill(email);
    await page.getByRole('button', { name: 'Continue with Email' }).click();

    // In a real scenario, we would need to handle the magic link.
    // For this test, we assume the user is logged in after this step.
    // The test environment will need to handle the magic link or mock the session.
    // Since we can't do that here, we will just wait for the dashboard to load.
    await page.waitForURL(`${TEST_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // 3. Verify the letter is in the "Sent" folder
    await page.getByRole('button', { name: 'Sent' }).click();

    // Wait for letters to load
    await expect(page.locator('text=Loading letters...')).not.toBeVisible({ timeout: 10000 });

    const letterLocator = page.locator(`p:has-text("${letterContent}")`);
    await expect(letterLocator).toBeVisible({ timeout: 15000 });

    const letterCard = page.locator('.bg-secondary-bg', { has: letterLocator });
    await expect(letterCard.getByRole('button', { name: 'View Letter' })).toBeVisible();
  });
});
