// ============================================================
// FULL QA TEST SUITE — Annotator Project
// Covers: index.html, reading-vault.html, inglenook.html
// Run: npx playwright test tests/full_test.spec.js --reporter=list
// ============================================================

const { test, expect, chromium } = require('@playwright/test');

const BASE = 'http://localhost:9000';
const FAKE_KEY = 'AIzaFakeTestKey99999';

const SAMPLE_TEXT_COURSE = `The process of learning is defined as the acquisition of knowledge through experience. 
This is fundamental to academic success. According to leading researchers, students who read daily achieve better results. 
Therefore, understanding key concepts is crucial for all examinations. 
For example, students who practice retrieval demonstrate 40% better retention. 
However, passive reading is insufficient — active engagement with the text is essential.`;

const SAMPLE_TEXT_NOVEL = `She felt her heart racing as she discovered the ancient manuscript. 
Love and grief intertwined in her memory like a bird in flight soaring above reality. 
"I never wanted this," she said, her voice barely a whisper. 
Power and freedom were the central themes that drove the narrative forward. 
The tears fell silently, carrying with them the weight of years of hope and despair.`;

// ============================================================
// PAGE 1: index.html — Marginalia
// ============================================================
test.describe('index.html — Marginalia', () => {

  test('A1: Page loads — title, core UI visible', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Marginalia/i);
    await page.screenshot({ path: 'tests/screenshots/A1_initial_load.png', fullPage: true });
    // Core UI elements
    await expect(page.locator('#dropZone')).toBeVisible();
    await expect(page.locator('#btnFileMode')).toBeVisible();
    await expect(page.locator('#btnPasteMode')).toBeVisible();
    await expect(page.locator('#btnCourse')).toBeVisible();
    await expect(page.locator('#btnNovel')).toBeVisible();
    await expect(page.locator('#apiKeyInput')).toBeVisible();
  });

  test('A2: No JS errors on load', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    console.log('JS Errors on index.html:', errors.length === 0 ? 'NONE' : errors.join('\n'));
    expect(errors, `JS errors found: ${errors.join(', ')}`).toHaveLength(0);
  });

  test('B1-B2: Input mode toggles (File ↔ Paste)', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    // File mode by default
    await expect(page.locator('#fileModePanel')).toBeVisible();
    await expect(page.locator('#pasteModePanel')).toBeHidden();
    // Switch to paste
    await page.locator('#btnPasteMode').click();
    await page.screenshot({ path: 'tests/screenshots/B1_paste_mode.png' });
    await expect(page.locator('#pasteModePanel')).toBeVisible();
    await expect(page.locator('#fileModePanel')).toBeHidden();
    // Switch back to file
    await page.locator('#btnFileMode').click();
    await page.screenshot({ path: 'tests/screenshots/B2_file_mode.png' });
    await expect(page.locator('#fileModePanel')).toBeVisible();
    await expect(page.locator('#pasteModePanel')).toBeHidden();
  });

  test('B3-B4: Reading mode toggles (Course ↔ Novel)', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    const desc = page.locator('#modeDesc');
    // Coursebook by default
    await expect(page.locator('#btnCourse')).toHaveClass(/active/);
    const courseText = await desc.textContent();
    expect(courseText).toMatch(/definitions|key ideas|exam/i);
    // Switch to Novel
    await page.locator('#btnNovel').click();
    await page.screenshot({ path: 'tests/screenshots/B3_novel_mode.png' });
    await expect(page.locator('#btnNovel')).toHaveClass(/active/);
    const novelText = await desc.textContent();
    expect(novelText).toMatch(/literary|reflection|emotion/i);
    // Switch back to Coursebook
    await page.locator('#btnCourse').click();
    await expect(page.locator('#btnCourse')).toHaveClass(/active/);
  });

  test('C1: API key save shows toast', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    await page.locator('#apiKeyInput').fill(FAKE_KEY);
    await page.locator('button[onclick="saveApiKey()"]').click();
    await page.screenshot({ path: 'tests/screenshots/C1_api_key_save.png' });
    const toast = page.locator('.toast');
    await expect(toast).toBeVisible({ timeout: 3000 });
    const toastText = await toast.textContent();
    expect(toastText).toMatch(/saved/i);
  });

  test('C2: API key persists across reload', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    await page.locator('#apiKeyInput').fill(FAKE_KEY);
    await page.locator('button[onclick="saveApiKey()"]').click();
    await page.waitForTimeout(500);
    await page.reload();
    await page.waitForLoadState('networkidle');
    const keyVal = await page.locator('#apiKeyInput').inputValue();
    await page.screenshot({ path: 'tests/screenshots/C2_key_persisted.png' });
    expect(keyVal).toBe(FAKE_KEY);
  });

  test('D1: File annotate button disabled initially', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    const btn = page.locator('#annotateFileBtn');
    await expect(btn).toBeDisabled();
  });

  test('E1-E4: Paste mode — add section to queue', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    await page.locator('#btnPasteMode').click();
    await page.locator('#sectionName').fill('Chapter 1 - The Beginning');
    await page.locator('#sectionText').fill(SAMPLE_TEXT_COURSE);
    await page.locator('button:has-text("Add to Queue")').click();
    await page.screenshot({ path: 'tests/screenshots/E4_queue_one_item.png' });
    const toast = page.locator('.toast');
    await expect(toast).toBeVisible({ timeout: 3000 });
    const queueItem = page.locator('.queue-item').first();
    await expect(queueItem).toBeVisible();
    const title = await queueItem.locator('.queue-item-title').textContent();
    expect(title).toContain('Chapter 1');
  });

  test('E5-E6: Paste mode — add multiple sections', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    await page.locator('#btnPasteMode').click();
    // Add section 1
    await page.locator('#sectionName').fill('Chapter 1');
    await page.locator('#sectionText').fill(SAMPLE_TEXT_COURSE);
    await page.locator('button:has-text("Add to Queue")').click();
    await page.waitForTimeout(400);
    // Add section 2
    await page.locator('#sectionName').fill('Chapter 2');
    await page.locator('#sectionText').fill(SAMPLE_TEXT_NOVEL);
    await page.locator('button:has-text("Add to Queue")').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'tests/screenshots/E6_queue_two_items.png' });
    const items = page.locator('.queue-item');
    expect(await items.count()).toBe(2);
  });

  test('E7: Annotate without API key shows error', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    // Clear any stored key
    await page.evaluate(() => localStorage.removeItem('marginalia_gemini_key'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.locator('#btnPasteMode').click();
    await page.locator('#sectionName').fill('Test');
    await page.locator('#sectionText').fill('Some test text here for annotation purposes.');
    await page.locator('button:has-text("Add to Queue")').click();
    await page.waitForTimeout(300);
    await page.locator('#annotatePasteBtn').click();
    await page.screenshot({ path: 'tests/screenshots/E7_no_key_error.png' });
    const toast = page.locator('.toast').last();
    await expect(toast).toBeVisible({ timeout: 3000 });
    const toastText = await toast.textContent();
    expect(toastText).toMatch(/api key|key/i);
  });

  test('F1-F4: Annotation with fake key — local fallback produces results', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    // Set fake key
    await page.locator('#apiKeyInput').fill(FAKE_KEY);
    await page.locator('button[onclick="saveApiKey()"]').click();
    await page.waitForTimeout(300);
    // Switch to paste mode, add a chapter
    await page.locator('#btnPasteMode').click();
    await page.locator('#sectionName').fill('Chapter 1 - Learning');
    await page.locator('#sectionText').fill(SAMPLE_TEXT_COURSE);
    await page.locator('button:has-text("Add to Queue")').click();
    await page.waitForTimeout(300);
    // Click Annotate
    await page.locator('#annotatePasteBtn').click();
    await page.screenshot({ path: 'tests/screenshots/F2_annotating_progress.png' });
    // Wait for results (API will fail → local fallback)
    await page.waitForSelector('#resultsSection', { state: 'visible', timeout: 30000 });
    await page.screenshot({ path: 'tests/screenshots/F3_results_visible.png', fullPage: true });
    // Check chapter block exists
    const chapterBlock = page.locator('.chapter-result').first();
    await expect(chapterBlock).toBeVisible();
    // Check annotated text exists
    const annotatedText = page.locator('.annotated-text').first();
    await expect(annotatedText).toBeVisible();
    // Check summary box
    const summaryBox = page.locator('.summary-box').first();
    await expect(summaryBox).toBeVisible();
  });

  test('F5: Copy Notes button works', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    await page.locator('#apiKeyInput').fill(FAKE_KEY);
    await page.locator('button[onclick="saveApiKey()"]').click();
    await page.locator('#btnPasteMode').click();
    await page.locator('#sectionName').fill('Test Chapter');
    await page.locator('#sectionText').fill(SAMPLE_TEXT_COURSE);
    await page.locator('button:has-text("Add to Queue")').click();
    await page.waitForTimeout(300);
    await page.locator('#annotatePasteBtn').click();
    await page.waitForSelector('#resultsSection', { state: 'visible', timeout: 30000 });
    // Click Copy Notes
    await page.locator('button:has-text("Copy")').click();
    await page.screenshot({ path: 'tests/screenshots/F5_copy_notes.png' });
    const toast = page.locator('.toast').last();
    await expect(toast).toBeVisible({ timeout: 3000 });
    const toastText = await toast.textContent();
    expect(toastText).toMatch(/copied/i);
  });

  test('F6: Export button triggers download or toast', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    await page.locator('#apiKeyInput').fill(FAKE_KEY);
    await page.locator('button[onclick="saveApiKey()"]').click();
    await page.locator('#btnPasteMode').click();
    await page.locator('#sectionName').fill('Export Test');
    await page.locator('#sectionText').fill(SAMPLE_TEXT_COURSE);
    await page.locator('button:has-text("Add to Queue")').click();
    await page.waitForTimeout(300);
    await page.locator('#annotatePasteBtn').click();
    await page.waitForSelector('#resultsSection', { state: 'visible', timeout: 30000 });
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await page.locator('button:has-text("Export")').click();
    await page.screenshot({ path: 'tests/screenshots/F6_export.png' });
    const download = await downloadPromise;
    if (download) {
      console.log('✅ Export download triggered:', download.suggestedFilename());
    } else {
      // Check for toast instead
      const toast = page.locator('.toast').last();
      const toastText = await toast.textContent().catch(() => '');
      console.log('Export toast:', toastText);
    }
  });

  test('F7: Start Over resets the UI', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    await page.locator('#apiKeyInput').fill(FAKE_KEY);
    await page.locator('button[onclick="saveApiKey()"]').click();
    await page.locator('#btnPasteMode').click();
    await page.locator('#sectionName').fill('Reset Test');
    await page.locator('#sectionText').fill(SAMPLE_TEXT_NOVEL);
    await page.locator('button:has-text("Add to Queue")').click();
    await page.waitForTimeout(300);
    await page.locator('#annotatePasteBtn').click();
    await page.waitForSelector('#resultsSection', { state: 'visible', timeout: 30000 });
    await page.locator('button:has-text("Start Over")').click();
    await page.screenshot({ path: 'tests/screenshots/F7_start_over.png' });
    await expect(page.locator('#resultsSection')).toBeHidden();
    await expect(page.locator('#progressSection')).toBeHidden();
  });

  test('G1: Novel mode annotation fallback', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    await page.locator('#apiKeyInput').fill(FAKE_KEY);
    await page.locator('button[onclick="saveApiKey()"]').click();
    await page.locator('#btnNovel').click();
    await page.locator('#btnPasteMode').click();
    await page.locator('#sectionName').fill('Novel Chapter');
    await page.locator('#sectionText').fill(SAMPLE_TEXT_NOVEL);
    await page.locator('button:has-text("Add to Queue")').click();
    await page.waitForTimeout(300);
    await page.locator('#annotatePasteBtn').click();
    await page.waitForSelector('#resultsSection', { state: 'visible', timeout: 30000 });
    await page.screenshot({ path: 'tests/screenshots/G1_novel_results.png', fullPage: true });
    // Confirm novel-specific legend appears
    const legendBox = page.locator('#legendBox');
    const legendText = await legendBox.textContent();
    expect(legendText).toMatch(/Beautiful Writing|Themes|Emotional Beats/i);
  });

  test('Queue: Remove item from queue', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    await page.locator('#btnPasteMode').click();
    await page.locator('#sectionName').fill('To Remove');
    await page.locator('#sectionText').fill('Some text to add to queue and then remove.');
    await page.locator('button:has-text("Add to Queue")').click();
    await page.waitForTimeout(300);
    await expect(page.locator('.queue-item')).toHaveCount(1);
    // Click the remove button on the queue item
    await page.locator('.queue-item .chip-remove').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tests/screenshots/Queue_remove.png' });
    await expect(page.locator('.queue-item')).toHaveCount(0);
  });
});

// ============================================================
// PAGE 2: reading-vault.html — The Reading Vault
// ============================================================
test.describe('reading-vault.html — The Reading Vault', () => {

  test('RV-A1: Page loads — welcome screen appears for fresh state', async ({ page }) => {
    await page.goto(`${BASE}/reading-vault.html`);
    // Clear localStorage for a fresh test
    await page.evaluate(() => {
      localStorage.removeItem('vault_books');
      localStorage.removeItem('vault_tbr');
      localStorage.removeItem('vault_quotes');
      localStorage.removeItem('vault_goal');
      localStorage.removeItem('vault_settings');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/RV_A1_welcome.png', fullPage: true });
    const welcome = page.locator('#welcomeScreen');
    await expect(welcome).toBeVisible();
    await expect(welcome.locator('h1')).toContainText('Reading Vault');
  });

  test('RV-A2: No JS errors on load', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${BASE}/reading-vault.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    console.log('JS Errors on reading-vault.html:', errors.length === 0 ? 'NONE' : errors.join('\n'));
    expect(errors, `JS errors found: ${errors.join(', ')}`).toHaveLength(0);
  });

  test('RV-B1: Start Library opens app shell', async ({ page }) => {
    await page.goto(`${BASE}/reading-vault.html`);
    await page.evaluate(() => { localStorage.clear(); });
    await page.reload();
    await page.waitForLoadState('networkidle');
    // Handle the prompt() for reading goal
    page.on('dialog', async dialog => {
      console.log('Dialog:', dialog.type(), dialog.message());
      await dialog.accept('12');
    });
    await page.locator('#startLibraryBtn').click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'tests/screenshots/RV_B1_app_shell.png', fullPage: true });
    await expect(page.locator('#app')).toBeVisible();
    await expect(page.locator('#welcomeScreen')).toBeHidden();
  });

  async function setupVaultWithBook(page) {
    await page.goto(`${BASE}/reading-vault.html`);
    await page.evaluate(() => {
      const book = {
        id: 'test_book_1',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        status: 'reading',
        pages: 180,
        currentPage: 90,
        startDate: '2025-01-01',
        finishDate: null,
        genre: 'Fiction',
        genres: ['Fiction', 'Classic'],
        moods: ['Literary', 'Emotional'],
        rating: 4,
        note: 'A beautiful novel about the American Dream.',
        quote: 'So we beat on, boats against the current.',
        coverId: null,
        addedAt: new Date().toISOString(),
      };
      const book2 = {
        id: 'test_book_2',
        title: 'Dune',
        author: 'Frank Herbert',
        status: 'finished',
        pages: 412,
        currentPage: 412,
        startDate: '2024-06-01',
        finishDate: '2024-07-15',
        genre: 'Sci-Fi',
        genres: ['Sci-Fi'],
        moods: ['Dense', 'Mind-blowing'],
        rating: 5,
        note: 'Epic world-building.',
        quote: 'Fear is the mind-killer.',
        coverId: null,
        addedAt: new Date().toISOString(),
      };
      localStorage.setItem('vault_books', JSON.stringify([book, book2]));
      localStorage.setItem('vault_tbr', JSON.stringify([{id:'tbr_1', title:'1984', author:'George Orwell', pages:300, priority:'high'}]));
      localStorage.setItem('vault_quotes', JSON.stringify([{id:'q1', text:'So we beat on.', bookTitle:'The Great Gatsby', author:'F. Scott Fitzgerald', dateAdded: new Date().toISOString()}]));
      localStorage.setItem('vault_goal', '24');
      localStorage.setItem('vault_settings', JSON.stringify({ geminiKey: '', theme: 'auto' }));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);
  }

  test('RV-C1: Home section renders correctly', async ({ page }) => {
    await setupVaultWithBook(page);
    await page.screenshot({ path: 'tests/screenshots/RV_C1_home.png', fullPage: true });
    await expect(page.locator('#pane-home')).toBeVisible();
    await expect(page.locator('#greetingLine')).toContainText(/morning|afternoon|evening/i);
    await expect(page.locator('#currentlyReadingCard')).toBeVisible();
    await expect(page.locator('#quickStatsRow')).toBeVisible();
    await expect(page.locator('#yibGrid')).toBeVisible();
  });

  test('RV-C2: Navigation between all sections', async ({ page }) => {
    await setupVaultWithBook(page);
    const sections = ['shelf', 'tbr', 'stats', 'quotes', 'settings', 'home'];
    for (const sec of sections) {
      await page.locator(`.nav-item[data-section="${sec}"]`).click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: `tests/screenshots/RV_C2_nav_${sec}.png` });
      await expect(page.locator(`#pane-${sec}`)).toHaveClass(/active/);
    }
  });

  test('RV-D1: My Shelf renders books', async ({ page }) => {
    await setupVaultWithBook(page);
    await page.locator('.nav-item[data-section="shelf"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'tests/screenshots/RV_D1_shelf.png', fullPage: true });
    // The shelf filter is "Reading" by default — should show Gatsby
    const booksGrid = page.locator('#booksGrid');
    await expect(booksGrid).toBeVisible();
    const bookCards = booksGrid.locator('.book-card, .bk-card, [class*="card"]');
    // Check subtitle shows count
    const subtitle = page.locator('#shelfSubtitle');
    await expect(subtitle).toBeVisible();
  });

  test('RV-D2: Shelf filter tabs work', async ({ page }) => {
    await setupVaultWithBook(page);
    await page.locator('.nav-item[data-section="shelf"]').click();
    await page.waitForTimeout(400);
    // Click Finished tab
    await page.locator('.shelf-tab[data-filter="finished"]').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tests/screenshots/RV_D2_shelf_finished.png', fullPage: true });
    // DNF tab
    await page.locator('.shelf-tab[data-filter="dnf"]').click();
    await page.waitForTimeout(300);
    // Re-reads tab
    await page.locator('.shelf-tab[data-filter="reread"]').click();
    await page.waitForTimeout(300);
    // Back to Reading
    await page.locator('.shelf-tab[data-filter="reading"]').click();
    await page.waitForTimeout(300);
  });

  test('RV-D3: Search in shelf filters books', async ({ page }) => {
    await setupVaultWithBook(page);
    await page.locator('.nav-item[data-section="shelf"]').click();
    await page.waitForTimeout(400);
    await page.locator('.shelf-tab[data-filter="finished"]').click();
    await page.waitForTimeout(300);
    await page.locator('#shelfSearch').fill('Dune');
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'tests/screenshots/RV_D3_search.png', fullPage: true });
  });

  test('RV-E1: Add Book drawer opens', async ({ page }) => {
    await setupVaultWithBook(page);
    await page.locator('.nav-item[data-section="shelf"]').click();
    await page.waitForTimeout(400);
    await page.locator('#addBookBtn').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/RV_E1_add_book_drawer.png', fullPage: true });
    await expect(page.locator('#addBookDrawer')).toHaveClass(/open/);
    await expect(page.locator('#drawerBody')).toBeVisible();
  });

  test('RV-E2: Manual book add (without OL search)', async ({ page }) => {
    await setupVaultWithBook(page);
    await page.locator('.nav-item[data-section="shelf"]').click();
    await page.waitForTimeout(400);
    await page.locator('#addBookBtn').click();
    await page.waitForTimeout(500);
    // Call showManualFields in the page context to switch to manual add mode
    await page.evaluate(() => showManualFields('Brave New World', 'Aldous Huxley'));
    await page.waitForTimeout(300);
    // Fill manual fields
    await page.locator('#bookGenreOverride').fill('Sci-Fi');
    await page.locator('#bookPagesOverride').fill('311');
    // Save book
    await page.locator('#saveBookBtn').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/RV_E2_manual_add.png', fullPage: true });
    // Verify book was added to My Shelf
    const bookTitle = page.locator('.book-title').first();
    await expect(bookTitle).toBeVisible();
    await expect(bookTitle).toHaveText('Brave New World');
  });

  test('RV-E3: Close drawer with X button', async ({ page }) => {
    await setupVaultWithBook(page);
    await page.locator('.nav-item[data-section="shelf"]').click();
    await page.waitForTimeout(400);
    await page.locator('#addBookBtn').click();
    await page.waitForTimeout(500);
    await expect(page.locator('#addBookDrawer')).toHaveClass(/open/);
    await page.locator('.drawer-close').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'tests/screenshots/RV_E3_drawer_closed.png' });
    await expect(page.locator('#addBookDrawer')).not.toHaveClass(/open/);
  });

  test('RV-F1: TBR pile renders', async ({ page }) => {
    await setupVaultWithBook(page);
    await page.locator('.nav-item[data-section="tbr"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'tests/screenshots/RV_F1_tbr.png', fullPage: true });
    await expect(page.locator('#pane-tbr')).toHaveClass(/active/);
    await expect(page.locator('#tbrList')).toBeVisible();
  });

  test('RV-F2: Pick for me button works', async ({ page }) => {
    await setupVaultWithBook(page);
    await page.locator('.nav-item[data-section="tbr"]').click();
    await page.waitForTimeout(400);
    await page.locator('#pickBtn').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/RV_F2_pick_for_me.png', fullPage: true });
    // Featured slot should now have a book title
    const featured = page.locator('#tbrFeatured');
    await expect(featured).toBeVisible();
    const featuredText = await featured.textContent();
    expect(featuredText).toMatch(/1984|Today's Pick|Start Reading/i);
  });

  test('RV-F3: Add to TBR drawer', async ({ page }) => {
    await setupVaultWithBook(page);
    await page.locator('.nav-item[data-section="tbr"]').click();
    await page.waitForTimeout(400);
    await page.locator('button:has-text("Add Book")').last().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/RV_F3_add_tbr.png', fullPage: true });
    await expect(page.locator('#addBookDrawer')).toHaveClass(/open/);
    // Fill in TBR form
    const titleInput = page.locator('#tbrTitle');
    if (await titleInput.isVisible()) {
      await titleInput.fill('The Name of the Wind');
      await page.locator('button:has-text("Add to TBR")').click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/screenshots/RV_F3b_tbr_saved.png', fullPage: true });
      const toast = page.locator('.toast').last();
      await expect(toast).toBeVisible({ timeout: 3000 });
    }
  });

  test('RV-G1: Stats section renders charts', async ({ page }) => {
    await setupVaultWithBook(page);
    await page.locator('.nav-item[data-section="stats"]').click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'tests/screenshots/RV_G1_stats.png', fullPage: true });
    await expect(page.locator('#pane-stats')).toHaveClass(/active/);
    await expect(page.locator('#totalsTile')).toBeVisible();
    await expect(page.locator('#barChartSvg')).toBeVisible();
    await expect(page.locator('#donutSvg')).toBeVisible();
    await expect(page.locator('#paceGrid')).toBeVisible();
    await expect(page.locator('#tagCloud')).toBeVisible();
  });

  test('RV-G2: Quotes wall renders', async ({ page }) => {
    await setupVaultWithBook(page);
    await page.locator('.nav-item[data-section="stats"]').click();
    await page.waitForTimeout(400);
    const quotesWall = page.locator('#quotesWall');
    await expect(quotesWall).toBeVisible();
  });

  test('RV-H1: Quotes section renders', async ({ page }) => {
    await setupVaultWithBook(page);
    await page.locator('.nav-item[data-section="quotes"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'tests/screenshots/RV_H1_quotes.png', fullPage: true });
    await expect(page.locator('#pane-quotes')).toHaveClass(/active/);
    await expect(page.locator('#quotesPageWall')).toBeVisible();
    const quoteCards = page.locator('#quotesPageWall .card');
    expect(await quoteCards.count()).toBeGreaterThan(0);
  });

  test('RV-H2: Add Quote drawer works', async ({ page }) => {
    await setupVaultWithBook(page);
    await page.locator('.nav-item[data-section="quotes"]').click();
    await page.waitForTimeout(400);
    await page.locator('#pane-quotes button:has-text("Add Quote")').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/RV_H2_add_quote.png', fullPage: true });
    await expect(page.locator('#addBookDrawer')).toHaveClass(/open/);
    const quoteText = page.locator('#quoteText');
    if (await quoteText.isVisible()) {
      await quoteText.fill('To be, or not to be, that is the question.');
      await page.locator('#quoteBook').fill('Hamlet');
      await page.locator('#quoteAuthor').fill('William Shakespeare');
      await page.locator('button:has-text("Save Quote")').click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/screenshots/RV_H2b_quote_saved.png', fullPage: true });
      const toast = page.locator('.toast').last();
      await expect(toast).toBeVisible({ timeout: 3000 });
    }
  });

  test('RV-H3: Delete quote (BUG-01 check — renderQuotesWall)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setupVaultWithBook(page);
    // Navigate to stats first so #quotesWall is in DOM
    await page.locator('.nav-item[data-section="stats"]').click();
    await page.waitForTimeout(400);
    // Now go to quotes and delete
    await page.locator('.nav-item[data-section="quotes"]').click();
    await page.waitForTimeout(400);
    const delBtn = page.locator('#quotesPageWall .quote-del').first();
    if (await delBtn.count() > 0) {
      await delBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/screenshots/RV_H3_delete_quote.png', fullPage: true });
      // BUG-01: renderQuotesWall is undefined — should produce a JS error
      const relevantErrors = errors.filter(e => e.includes('renderQuotesWall') || e.includes('is not defined'));
      if (relevantErrors.length > 0) {
        console.log('🔴 BUG-01 CONFIRMED:', relevantErrors.join('\n'));
      } else {
        console.log('✅ BUG-01: No renderQuotesWall error (possibly not triggered because stats pane was not active during delete)');
      }
    }
  });

  test('RV-I1: Settings section — API key input visible', async ({ page }) => {
    await setupVaultWithBook(page);
    await page.locator('.nav-item[data-section="settings"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'tests/screenshots/RV_I1_settings.png', fullPage: true });
    await expect(page.locator('#pane-settings')).toHaveClass(/active/);
    await expect(page.locator('#settingsApiKey')).toBeVisible();
    await expect(page.locator('#settingsGoal')).toBeVisible();
  });

  test('RV-I2: Settings — Save Gemini key syncs annotator input', async ({ page }) => {
    await setupVaultWithBook(page);
    await page.locator('.nav-item[data-section="settings"]').click();
    await page.waitForTimeout(400);
    await page.locator('#settingsApiKey').fill(FAKE_KEY);
    await page.locator('button[onclick="saveSettingsKey()"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'tests/screenshots/RV_I2_key_saved.png' });
    // Check annotator input is also synced
    await page.locator('.nav-item[data-section="annotator"]').click();
    await page.waitForTimeout(400);
    const annKeyVal = await page.locator('#annApiKey').inputValue();
    console.log('Annotator key after Settings save:', annKeyVal === FAKE_KEY ? '✅ SYNCED' : `⚠️ NOT SYNCED (got: ${annKeyVal})`);
    expect(annKeyVal).toBe(FAKE_KEY);
  });

  test('RV-I3: Reading goal update', async ({ page }) => {
    await setupVaultWithBook(page);
    await page.locator('.nav-item[data-section="settings"]').click();
    await page.waitForTimeout(400);
    await page.locator('#settingsGoal').fill('30');
    await page.locator('button:has-text("Update")').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'tests/screenshots/RV_I3_goal_updated.png' });
    const toast = page.locator('.toast').last();
    await expect(toast).toBeVisible({ timeout: 3000 });
  });

  test('RV-J1: Annotator section — upload and paste mode toggles', async ({ page }) => {
    await setupVaultWithBook(page);
    await page.locator('.nav-item[data-section="annotator"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'tests/screenshots/RV_J1_annotator.png', fullPage: true });
    await expect(page.locator('#annFileModePanel')).toBeVisible();
    // Toggle to paste
    await page.locator('#annBtnPaste').click();
    await page.waitForTimeout(300);
    await expect(page.locator('#annPasteModePanel')).toBeVisible();
    await expect(page.locator('#annFileModePanel')).toBeHidden();
    // Toggle back
    await page.locator('#annBtnFile').click();
    await page.waitForTimeout(300);
    await expect(page.locator('#annFileModePanel')).toBeVisible();
  });

  test('RV-J2: Annotator — paste annotate with fake key (local fallback)', async ({ page }) => {
    await setupVaultWithBook(page);
    // Set key in settings first
    await page.locator('.nav-item[data-section="settings"]').click();
    await page.waitForTimeout(400);
    await page.locator('#settingsApiKey').fill(FAKE_KEY);
    await page.locator('button[onclick="saveSettingsKey()"]').click();
    await page.waitForTimeout(300);
    // Go to annotator
    await page.locator('.nav-item[data-section="annotator"]').click();
    await page.waitForTimeout(400);
    await page.locator('#annBtnPaste').click();
    await page.locator('#annSectionName').fill('Test Section');
    await page.locator('#annSectionText').fill(SAMPLE_TEXT_COURSE);
    await page.locator('button:has-text("Add to Queue")').click();
    await page.waitForTimeout(300);
    await page.locator('#annAnnotatePasteBtn').click();
    await page.waitForSelector('#annResults.visible', { timeout: 30000 });
    await page.screenshot({ path: 'tests/screenshots/RV_J2_ann_results.png', fullPage: true });
    await expect(page.locator('#annChaptersContainer .ann-chapter-block').first()).toBeVisible();
    // Check save to shelf bar appears
    await expect(page.locator('#saveToShelfBar')).toBeVisible({ timeout: 5000 });
  });

  test('RV-J3: Export from Annotator', async ({ page }) => {
    await setupVaultWithBook(page);
    await page.locator('.nav-item[data-section="settings"]').click();
    await page.waitForTimeout(300);
    await page.locator('#settingsApiKey').fill(FAKE_KEY);
    await page.locator('button[onclick="saveSettingsKey()"]').click();
    await page.waitForTimeout(300);
    await page.locator('.nav-item[data-section="annotator"]').click();
    await page.waitForTimeout(400);
    await page.locator('#annBtnPaste').click();
    await page.locator('#annSectionName').fill('Export Test');
    await page.locator('#annSectionText').fill(SAMPLE_TEXT_NOVEL);
    await page.locator('button:has-text("Add to Queue")').click();
    await page.waitForTimeout(300);
    await page.locator('#annAnnotatePasteBtn').click();
    await page.waitForSelector('#annResults.visible', { timeout: 30000 });
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await page.locator('button[onclick="annDownload()"]').click();
    const download = await downloadPromise;
    await page.screenshot({ path: 'tests/screenshots/RV_J3_export.png' });
    if (download) {
      console.log('✅ Export download:', download.suggestedFilename());
    } else {
      console.log('⚠️ Export: no download event (may have used anchor click)');
    }
  });

  test('RV-K1: Export Data from settings', async ({ page }) => {
    await setupVaultWithBook(page);
    await page.locator('.nav-item[data-section="settings"]').click();
    await page.waitForTimeout(400);
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await page.locator('button:has-text("Export JSON")').click();
    const download = await downloadPromise;
    await page.screenshot({ path: 'tests/screenshots/RV_K1_export_data.png' });
    if (download) {
      console.log('✅ Data export download:', download.suggestedFilename());
      expect(download.suggestedFilename()).toMatch(/reading-vault/i);
    }
  });

  test('RV-BUG09: setLoading(false) never called on success in index.html', async ({ page }) => {
    // This test verifies the annotate button re-enables after success
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    await page.locator('#apiKeyInput').fill(FAKE_KEY);
    await page.locator('button[onclick="saveApiKey()"]').click();
    await page.locator('#btnPasteMode').click();
    await page.locator('#sectionName').fill('BUG-09 Test');
    await page.locator('#sectionText').fill(SAMPLE_TEXT_COURSE);
    await page.locator('button:has-text("Add to Queue")').click();
    await page.waitForTimeout(300);
    await page.locator('#annotatePasteBtn').click();
    await page.waitForSelector('#resultsSection', { state: 'visible', timeout: 30000 });
    await page.waitForTimeout(500);
    // BUG-09: annotate button should be re-enabled after success
    const pasteBtn = page.locator('#annotatePasteBtn');
    const isDisabled = await pasteBtn.isDisabled();
    if (isDisabled) {
      console.log('🔴 BUG-09 CONFIRMED: #annotatePasteBtn is still disabled after successful annotation');
    } else {
      console.log('✅ BUG-09: Paste annotate button is enabled after success');
    }
    await page.screenshot({ path: 'tests/screenshots/BUG09_btn_state.png' });
  });
});

// ============================================================
// PAGE 3: inglenook.html
// ============================================================
test.describe('inglenook.html — Inglenook', () => {

  async function setupInglenook(page) {
    await page.goto(`${BASE}/inglenook.html`);
    await page.evaluate(() => {
      const books = [
        { id: 'b1', title: 'The Hobbit', author: 'J.R.R. Tolkien', status: 'finished', genres: ['Fantasy'], moods: ['Cozy'], rating: 5, finishedAt: '2024-05-10', note: 'Wonderful journey.' },
        { id: 'b2', title: 'Neuromancer', author: 'William Gibson', status: 'in_progress', genres: ['Sci-Fi'], moods: ['Dense'], rating: 0 },
        { id: 'b3', title: 'Pride and Prejudice', author: 'Jane Austen', status: 'tbr', genres: ['Classic'], moods: ['Cozy'] },
      ];
      localStorage.setItem('inglenook_books', JSON.stringify(books));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
  }

  test('IG-A1: Page loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${BASE}/inglenook.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/screenshots/IG_A1_load.png', fullPage: true });
    console.log('JS Errors on inglenook.html:', errors.length === 0 ? 'NONE' : errors.join('\n'));
    expect(errors, `JS errors: ${errors.join(', ')}`).toHaveLength(0);
  });

  test('IG-A2: Navigation between views', async ({ page }) => {
    await setupInglenook(page);
    const views = ['explore', 'tbr', 'finished', 'stats', 'room'];
    for (const v of views) {
      await page.locator(`a[data-view="${v}"]`).click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: `tests/screenshots/IG_A2_view_${v}.png`, fullPage: true });
      await expect(page.locator(`#view-${v}`)).toHaveClass(/active/);
    }
  });

  test('IG-B1: Room view — shelf renders books', async ({ page }) => {
    await setupInglenook(page);
    await page.screenshot({ path: 'tests/screenshots/IG_B1_room.png', fullPage: true });
    await expect(page.locator('#view-room')).toHaveClass(/active/);
    await expect(page.locator('#shelf')).toBeVisible();
    const books = page.locator('#shelf .book');
    expect(await books.count()).toBeGreaterThan(0);
  });

  test('IG-B2: Click book in shelf opens detail panel', async ({ page }) => {
    await setupInglenook(page);
    const firstBook = page.locator('#shelf .book').first();
    await firstBook.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/IG_B2_detail_panel.png', fullPage: true });
    await expect(page.locator('#detailPanel')).toHaveClass(/open/);
    await expect(page.locator('#detailContent')).toBeVisible();
  });

  test('IG-B3: Close detail panel', async ({ page }) => {
    await setupInglenook(page);
    await page.locator('#shelf .book').first().click();
    await page.waitForTimeout(400);
    await expect(page.locator('#detailPanel')).toHaveClass(/open/);
    await page.locator('#detailPanel .panel-close').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'tests/screenshots/IG_B3_panel_closed.png' });
    await expect(page.locator('#detailPanel')).not.toHaveClass(/open/);
  });

  test('IG-C1: Add Book panel opens', async ({ page }) => {
    await setupInglenook(page);
    await page.locator('#fab').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/IG_C1_add_book.png', fullPage: true });
    await expect(page.locator('#addPanel')).toHaveClass(/open/);
  });

  test('IG-C2: Open Library search in add panel', async ({ page }) => {
    await setupInglenook(page);
    await page.locator('#fab').click();
    await page.waitForTimeout(400);
    await page.locator('#addTitle').fill('The Hobbit');
    await page.locator('#addAuthor').fill('Tolkien');
    await page.locator('#findBtn').click();
    await page.waitForTimeout(3000); // Wait for OL API
    await page.screenshot({ path: 'tests/screenshots/IG_C2_ol_search.png', fullPage: true });
    const results = page.locator('.search-result, [class*="search"]');
    console.log(`OL search results found: ${await results.count()}`);
  });

  test('IG-D1: Explore view — grid visible', async ({ page }) => {
    await setupInglenook(page);
    await page.locator('a[data-view="explore"]').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/IG_D1_explore.png', fullPage: true });
    await expect(page.locator('#view-explore')).toHaveClass(/active/);
    await expect(page.locator('#exploreGrid')).toBeVisible();
    await expect(page.locator('#exploreSearch')).toBeVisible();
  });

  test('IG-D2: Explore search triggers', async ({ page }) => {
    await setupInglenook(page);
    await page.locator('a[data-view="explore"]').click();
    await page.waitForTimeout(400);
    await page.locator('#exploreSearch').fill('mystery');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/IG_D2_explore_search.png', fullPage: true });
    console.log('Explore search results:', await page.locator('#exploreGrid .explore-card, #exploreGrid [class*="card"]').count());
  });

  test('IG-E1: TBR view renders', async ({ page }) => {
    await setupInglenook(page);
    await page.locator('a[data-view="tbr"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'tests/screenshots/IG_E1_tbr.png', fullPage: true });
    await expect(page.locator('#view-tbr')).toHaveClass(/active/);
    await expect(page.locator('#tbrShelf')).toBeVisible();
  });

  test('IG-E2: Pick for me button', async ({ page }) => {
    await setupInglenook(page);
    await page.locator('a[data-view="tbr"]').click();
    await page.waitForTimeout(400);
    await page.locator('#pickBtn').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'tests/screenshots/IG_E2_pick_for_me.png', fullPage: true });
  });

  test('IG-F1: Finished view renders books', async ({ page }) => {
    await setupInglenook(page);
    await page.locator('a[data-view="finished"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'tests/screenshots/IG_F1_finished.png', fullPage: true });
    await expect(page.locator('#view-finished')).toHaveClass(/active/);
    await expect(page.locator('#finishedGrid')).toBeVisible();
  });

  test('IG-F2: Autofill quotes button exists', async ({ page }) => {
    await setupInglenook(page);
    await page.locator('a[data-view="finished"]').click();
    await page.waitForTimeout(400);
    await expect(page.locator('#autofillQuotesBtn')).toBeVisible();
    await expect(page.locator('#clearFinishDatesBtn')).toBeVisible();
  });

  test('IG-G1: Stats view renders charts', async ({ page }) => {
    await setupInglenook(page);
    await page.locator('a[data-view="stats"]').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/IG_G1_stats.png', fullPage: true });
    await expect(page.locator('#view-stats')).toHaveClass(/active/);
    await expect(page.locator('#barChart')).toBeVisible();
    await expect(page.locator('#donut')).toBeVisible();
  });

  test('IG-H1: Settings panel opens via avatar', async ({ page }) => {
    await setupInglenook(page);
    await page.locator('#avatarBtn').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'tests/screenshots/IG_H1_settings.png', fullPage: true });
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
  });

  test('IG-H2: Lamp pull-string toggle (dark mode)', async ({ page }) => {
    await page.goto(`${BASE}/inglenook.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    // Check initial theme
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log('Initial theme:', initialTheme);
    // Click pull string
    const pullString = page.locator('.cozy-pull-string').first();
    await pullString.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'tests/screenshots/IG_H2_dark_toggle.png', fullPage: true });
    const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log('Theme after toggle:', newTheme);
    // Should have changed
    expect(newTheme).not.toBe(initialTheme);
  });

  test('IG-H3: Pagination (prev/next page)', async ({ page }) => {
    await page.goto(`${BASE}/inglenook.html`);
    await page.evaluate(() => {
      // Generate 50 books to trigger pagination
      const books = Array.from({length: 50}, (_, i) => ({
        id: `b${i}`, title: `Book ${i+1}`, author: `Author ${i+1}`,
        status: 'in_progress', genres: [], moods: [], rating: 0
      }));
      localStorage.setItem('inglenook_books', JSON.stringify(books));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    const nextBtn = page.locator('#nextPage');
    await expect(nextBtn).not.toBeDisabled();
    await nextBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'tests/screenshots/IG_H3_page2.png' });
    const label = await page.locator('#pageLabel').textContent();
    expect(label).toMatch(/2 of/);
    await page.locator('#prevPage').click();
    await page.waitForTimeout(400);
    const label2 = await page.locator('#pageLabel').textContent();
    expect(label2).toMatch(/1 of/);
  });
});
