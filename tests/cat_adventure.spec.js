const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:9000';

async function setupInglenook(page) {
    await page.goto(`${BASE}/inglenook.html`);
    await page.evaluate(() => {
      const books = [
        { id: 'b1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', status: 'in_progress', genres: ['Fiction'], moods: ['Reflective'], rating: 5, pages: 180 },
        { id: 'b2', title: 'To Kill a Mockingbird', author: 'Harper Lee', status: 'tbr', genres: ['Classics'], moods: ['Thoughtful'], rating: 4, pages: 320 },
        { id: 'b3', title: 'The Hobbit', author: 'J.R.R. Tolkien', status: 'finished', genres: ['Fantasy'], moods: ['Adventurous'], rating: 5, pages: 310 }
      ];
      localStorage.setItem('inglenook_books', JSON.stringify(books));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
}

test('Capture Inglenook features', async ({ page }) => {
  // 1. Load room
  await setupInglenook(page);
  await page.screenshot({ path: 'assets/inglenook_room.png' });

  // 2. Click the cat and capture it mid-adventure
  const cat = page.locator('#cozyCat');
  await cat.click();
  
  // Wait 1.3 seconds - the cat should be jumping or walking on the shelf
  await page.waitForTimeout(1300);
  await page.screenshot({ path: 'assets/cat_walking_on_shelf.png' });

  // Wait another 1.2 seconds - the cat should be swiping or the book should be falling
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'assets/cat_knocking_book.png' });

  // Wait 4 seconds for the adventure to finish
  await page.waitForTimeout(4000);

  // 3. Toggle Dark Mode (Pull String)
  const pullString = page.locator('.cozy-pull-string').first();
  await pullString.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'assets/inglenook_dark.png' });

  // Switch back to light mode for other screenshots
  await pullString.click();
  await page.waitForTimeout(800);

  // 4. Navigation views
  // Explore view
  await page.locator('a[data-view="explore"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'assets/inglenook_explore.png' });

  // TBR view
  await page.locator('a[data-view="tbr"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'assets/inglenook_tbr.png' });

  // Stats view
  await page.locator('a[data-view="stats"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'assets/inglenook_stats.png' });
});
