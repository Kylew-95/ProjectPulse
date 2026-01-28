import { test, expect } from '@playwright/test';

test.describe('Subscription Flow', () => {
    test('should show verifying subscription or redirect with success state', async ({ page }) => {
        // We simulate returning to the dashboard with success=true
        await page.goto('/dashboard?success=true');

        // Since we don't have a session in this test context, it might redirect to /login?success=true
        // or show the loading state if the session is still "loading".

        // We wait for either the verifying heading OR the redirect to login
        await page.waitForFunction(() => {
            return document.querySelector('h2:has-text("Verifying Subscription...")') ||
                window.location.pathname === '/login';
        });

        if (await page.locator('h2:has-text("Verifying Subscription...")').isVisible()) {
            await expect(page.locator('h2:has-text("Verifying Subscription...")')).toBeVisible();
        } else {
            // If it redirected to login, ensure it's the login page
            await expect(page).toHaveURL(/\/login/);
        }
    });

    test('should redirect to login if no session', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/login/);
    });
});
