import { test, expect } from '@playwright/test';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
const PROJECT_REF = SUPABASE_URL.split('.')[0].split('//')[1] || 'example';
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

test.describe('ProjectPulse Deep Features', () => {

    test.beforeEach(async ({ page }) => {
        // Mock authenticated session
        const mockSession = {
            access_token: 'fake-token',
            expires_in: 3600,
            refresh_token: 'fake-refresh-token',
            user: {
                id: 'test-user-id',
                aud: 'authenticated',
                role: 'authenticated',
                email: 'tester@projectpulse.ai',
                app_metadata: { provider: 'discord' },
                user_metadata: { full_name: 'Test Agent' },
                created_at: new Date().toISOString(),
            }
        };

        await page.addInitScript(({ key, value }) => {
            window.localStorage.setItem(key, value);
        }, { key: STORAGE_KEY, value: JSON.stringify(mockSession) });
    });

    test('should load Analytics Dashboard with charts', async ({ page }) => {
        await page.goto('/dashboard/analytics');

        // Wait for page header
        await expect(page.locator('h1')).toContainText('Analytics');

        // Check for Overview Cards
        await expect(page.locator('text=Total Tickets')).toBeVisible();
        await expect(page.locator('text=Open Issues')).toBeVisible();

        // Check for Recharts container (it usually has specific classes or internal svg)
        const chartContainer = page.locator('.recharts-responsive-container');
        await expect(chartContainer).toHaveCount(3); // Trends, Priority, Status
    });

    test('should load Knowledge Base and search', async ({ page }) => {
        await page.goto('/dashboard/kb');

        // Check for page title
        await expect(page.locator('h1')).toContainText('Knowledge Base');

        // Check for search input
        const searchInput = page.locator('input[placeholder*="Search"]');
        await expect(searchInput).toBeVisible();

        // Check for "Add Entry" button
        await expect(page.locator('button:has-text("Add Entry")')).toBeVisible();
    });

    test('should load Tickets list and sidebar', async ({ page }) => {
        await page.goto('/dashboard/tickets');

        // Sidebar navigation checks
        await expect(page.locator('nav')).toContainText('Overview');
        await expect(page.locator('nav')).toContainText('Analytics');
        await expect(page.locator('nav')).toContainText('Tickets');

        // Verify Breadcrumbs
        await expect(page.locator('.lucide-chevron-right')).toBeVisible();
    });
});
