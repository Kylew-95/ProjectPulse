import { test, expect } from '@playwright/test';

const PROJECT_REF = 'ztzmykkriwjlsijazvoi';
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

test.describe('Team Management Flow', () => {

    test.beforeEach(async ({ page }) => {
        // Mock user session
        const mockSession = {
            access_token: 'fake-token',
            expires_in: 3600,
            refresh_token: 'fake-refresh-token',
            user: {
                id: 'test-admin-id',
                aud: 'authenticated',
                role: 'authenticated',
                email: 'admin@example.com',
                app_metadata: { provider: 'discord' },
                user_metadata: { full_name: 'Admin User' },
                created_at: new Date().toISOString(),
            }
        };

        // Add session to localStorage
        await page.addInitScript(({ key, value }) => {
            window.localStorage.setItem(key, value);
        }, { key: STORAGE_KEY, value: JSON.stringify(mockSession) });

        // Mock Supabase API calls
        await page.route('**/*.supabase.co/rest/v1/**', async (route) => {
            const url = route.request().url();
            const method = route.request().method();

            if (url.includes('team_members') && method === 'GET') {
                if (url.includes('count=exact')) {
                    await route.fulfill({ status: 200, body: JSON.stringify([]), headers: { 'content-range': '0-0/0' } });
                } else if (url.includes('select=team_id')) {
                    // Fetching teams user belongs to
                    await route.fulfill({
                        status: 200,
                        body: JSON.stringify([
                            { team_id: 'team-1', teams: { id: 'team-1', name: 'Engineering' } }
                        ])
                    });
                } else {
                    // Fetching members of a team
                    await route.fulfill({
                        status: 200,
                        body: JSON.stringify([
                            {
                                id: 1,
                                user_id: 'test-admin-id',
                                role: 'Admin',
                                joined_at: new Date().toISOString(),
                                status: 'active',
                                profiles: { full_name: 'Admin User', email: 'admin@example.com' }
                            }
                        ])
                    });
                }
            } else if (url.includes('teams') && method === 'POST') {
                await route.fulfill({
                    status: 201,
                    body: JSON.stringify({ id: 'team-new', name: 'QA Engineering' })
                });
            } else if (url.includes('team_members') && method === 'POST') {
                await route.fulfill({ status: 201, body: JSON.stringify({ id: 2 }) });
            } else if (url.includes('profiles') && method === 'GET') {
                await route.fulfill({
                    status: 200,
                    body: JSON.stringify([
                        { id: 'test-admin-id', full_name: 'Admin User', email: 'admin@example.com' }
                    ])
                });
            } else {
                await route.continue();
            }
        });
    });

    test('should allow creating a team and viewing its members', async ({ page }) => {
        // 1. Go to Team Page
        await page.goto('/dashboard/team');
        await expect(page.locator('h1')).toContainText('Teams');

        // 2. Open Create Team Modal
        await page.click('button:has-text("Create Team")');
        await expect(page.locator('h2')).toContainText('Create New Team');

        // 3. Create Team
        await page.fill('input[placeholder*="Engineering"]', 'QA Engineering');

        // Mock the response for the newly created team when it re-fetches
        await page.route('**/team_members?user_id=eq.test-admin-id**', async (route) => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify([
                    { team_id: 'team-1', teams: { id: 'team-1', name: 'Engineering' } },
                    { team_id: 'team-new', teams: { id: 'team-new', name: 'QA Engineering' } }
                ])
            });
        });

        await page.click('button:has-text("Create Team")');

        // 4. Verify Team is created and visible in the list
        await expect(page.locator('text=QA Engineering')).toBeVisible();

        // 5. Navigate into the team
        await page.click('text=QA Engineering');
        await expect(page.locator('h1')).toContainText('QA Engineering');

        // 6. Verify Admin is in the member list
        await expect(page.locator('text=Admin User')).toBeVisible();
        await expect(page.locator('text=Admin')).toBeVisible();
    });

    test('should allow inviting a member', async ({ page }) => {
        // Go directly to a team members page
        await page.goto('/dashboard/team/team-1');
        await expect(page.locator('h1')).toContainText('Engineering');

        // Open Invite Modal
        await page.click('button:has-text("Invite")');
        await expect(page.locator('h2')).toContainText('Invite Team Member');

        // Fill Invite Info
        await page.fill('input[placeholder*="Discord ID"]', 'newmember@example.com');

        // Mock success alert (optional, but good for flow)
        page.on('dialog', dialog => dialog.dismiss());

        await page.click('button:has-text("Send Invitation")');

        // Verification: The modal should close
        await expect(page.locator('h2')).not.toBeVisible();
    });

    test('should allow updating a member role', async ({ page }) => {
        // Go to team members page
        await page.goto('/dashboard/team/team-1');

        // Find a member (not Admin, but we mocked Admin as the only one)
        // Let's mock another member
        await page.route('**/team_members?team_id=eq.team-1**', async (route) => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify([
                    {
                        id: 1,
                        user_id: 'test-admin-id',
                        role: 'Admin',
                        joined_at: new Date().toISOString(),
                        status: 'active',
                        profiles: { full_name: 'Admin User', email: 'admin@example.com' }
                    },
                    {
                        id: 2,
                        user_id: 'test-dev-id',
                        role: 'Developer',
                        joined_at: new Date().toISOString(),
                        status: 'active',
                        profiles: { full_name: 'Dev User', email: 'dev@example.com' }
                    }
                ])
            });
        });
        await page.reload();

        // Click on the role select for the Developer
        // The role select is a SearchableSelect component, we click the input/button
        const devRow = page.locator('tr').filter({ hasText: 'Dev User' });
        await devRow.locator('button').filter({ hasText: 'Developer' }).click();

        // Change to IT
        await page.click('text=IT');

        // Verify update role call (mocked to succeed)
        await page.route('**/team_members?id=eq.2**', async (route) => {
            await route.fulfill({ status: 200, body: JSON.stringify({}) });
        });

        // Handle the confirmation dialog
        page.once('dialog', async dialog => {
            expect(dialog.message()).toContain('Sure you want to change');
            await dialog.accept();
        });

        // The UI should update (though we'd need to mock the re-fetch or manual update)
        // Based on code: setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
        await expect(devRow.locator('button')).toContainText('IT');
    });
});

