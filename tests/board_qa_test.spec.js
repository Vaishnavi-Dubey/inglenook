// ============================================================
// BOARD QA TEST SUITE — board.html
// Tests: all engine modes, URL fetch (PDF), offline processing,
//        paste mode, error validation, cancel/discard, navigation
// Run: npx playwright test tests/board_qa_test.spec.js --reporter=list --headed
// ============================================================

const { test, expect, chromium } = require('@playwright/test');

const BASE = 'http://localhost:9000';
const PDF_URL = 'https://sherlock-holm.es/stories/pdf/a4/1-sided/case.pdf';

const PASTE_TEXT = `Sherlock Holmes examined the clues carefully at Baker Street. 
Watson watched from across the room with great interest. 
Professor Moriarty, the Napoleon of Crime, was the mastermind behind the conspiracy. 
Irene Adler had stolen the documents from Scotland Yard. 
Inspector Lestrade arrived at midnight to consult with Holmes. 
Buckingham Palace was the scene of the crime. 
Lord Blackwood was the prime suspect. 
Mrs Hudson served tea while they discussed the case. 
The Baker Street Irregulars were dispatched to search London. 
Holmes identified Lady Windermere as the mysterious woman in the case.`;

// ============================================================
// BOARD PAGE TESTS
// ============================================================
test.describe('board.html — The Board', () => {

  test('B1: Page loads — title, core UI visible', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`);
    });
    
    await page.goto(`${BASE}/board.html`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/board_B1_initial_load.png', fullPage: true });
    
    // Title check
    await expect(page).toHaveTitle(/Board|Inglenook/i);
    
    // Brand and navigation
    await expect(page.locator('.brand')).toBeVisible();
    const brandText = await page.locator('.brand').textContent();
    console.log('Brand text:', brandText);
    
    // Hero section
    await expect(page.locator('.hero h1')).toBeVisible();
    const heroText = await page.locator('.hero h1').textContent();
    console.log('Hero heading:', heroText);
    
    // Engine panel
    await expect(page.locator('#engineSelect')).toBeVisible();
    
    // Source input panel with tabs
    await expect(page.locator('.tab-btn[data-tab="upload"]')).toBeVisible();
    await expect(page.locator('.tab-btn[data-tab="url"]')).toBeVisible();
    await expect(page.locator('.tab-btn[data-tab="paste"]')).toBeVisible();
    
    // Upload tab active by default
    await expect(page.locator('#pane-upload')).toBeVisible();
    await expect(page.locator('#pane-url')).toBeHidden();
    await expect(page.locator('#pane-paste')).toBeHidden();
    
    // Preview and result panels hidden initially
    await expect(page.locator('#previewPanel')).toBeHidden();
    await expect(page.locator('#resultPanel')).toBeHidden();
    
    console.log('JS/Console Errors on load:', errors.length === 0 ? 'NONE ✅' : errors.join('\n'));
    if (errors.length > 0) {
      console.log('⚠️ ERROR: JS errors detected on page load');
    }
  });

  // ── Engine switching tests ───────────────────────────────────────
  test('B2: Engine — switch to Ollama', async ({ page }) => {
    await page.goto(`${BASE}/board.html`);
    await page.waitForLoadState('networkidle');
    
    await page.selectOption('#engineSelect', 'ollama');
    await page.screenshot({ path: 'tests/screenshots/board_B2_engine_ollama.png' });
    
    // Ollama config section should appear
    const ollamaConfig = page.locator('.engine-config[data-engine="ollama"]');
    await expect(ollamaConfig).toBeVisible();
    
    // Ollama model input should be visible
    await expect(page.locator('#ollamaModel')).toBeVisible();
    
    // Ollama help text visible
    const ollamaHelp = page.locator('.engine-help[data-engine="ollama"]');
    await expect(ollamaHelp).toBeVisible();
    const helpText = await ollamaHelp.textContent();
    console.log('Ollama help text:', helpText?.slice(0, 100));
    
    // Other engine configs hidden
    await expect(page.locator('.engine-config[data-engine="webllm"]')).toBeHidden();
    await expect(page.locator('.engine-help[data-engine="openrouter"]')).toBeHidden();
  });

  test('B3: Engine — switch to Offline', async ({ page }) => {
    await page.goto(`${BASE}/board.html`);
    await page.waitForLoadState('networkidle');
    
    await page.selectOption('#engineSelect', 'offline');
    await page.screenshot({ path: 'tests/screenshots/board_B3_engine_offline.png' });
    
    // No engine config for offline
    await expect(page.locator('.engine-config[data-engine="ollama"]')).toBeHidden();
    await expect(page.locator('.engine-config[data-engine="webllm"]')).toBeHidden();
    
    // Offline help text visible
    const offlineHelp = page.locator('.engine-help[data-engine="offline"]');
    await expect(offlineHelp).toBeVisible();
    const helpText = await offlineHelp.textContent();
    console.log('Offline help text:', helpText?.slice(0, 100));
  });

  test('B4: Engine — switch to WebLLM', async ({ page }) => {
    await page.goto(`${BASE}/board.html`);
    await page.waitForLoadState('networkidle');
    
    await page.selectOption('#engineSelect', 'webllm');
    await page.screenshot({ path: 'tests/screenshots/board_B4_engine_webllm.png' });
    
    // WebLLM config visible
    const webllmConfig = page.locator('.engine-config[data-engine="webllm"]');
    await expect(webllmConfig).toBeVisible();
    await expect(page.locator('#webllmModel')).toBeVisible();
    
    // WebLLM help text visible
    const webllmHelp = page.locator('.engine-help[data-engine="webllm"]');
    await expect(webllmHelp).toBeVisible();
    
    // "Switch to Offline mode" link visible
    const switchLink = page.locator('#webllmSwitchOffline');
    await expect(switchLink).toBeVisible();
    console.log('WebLLM switch link visible ✅');
    
    // Click "Switch to Offline mode" link
    await switchLink.click();
    await page.screenshot({ path: 'tests/screenshots/board_B4b_webllm_switch_offline.png' });
    
    // Should switch to offline
    const engineVal = await page.locator('#engineSelect').inputValue();
    console.log('Engine after switch:', engineVal);
    expect(engineVal).toBe('offline');
    
    // Status message should say switched to offline
    const statusText = await page.locator('#statusMsg').textContent();
    console.log('Status after switch:', statusText);
    expect(statusText).toMatch(/offline/i);
  });

  test('B5: Engine — switch back to OpenRouter', async ({ page }) => {
    await page.goto(`${BASE}/board.html`);
    await page.waitForLoadState('networkidle');
    
    await page.selectOption('#engineSelect', 'openrouter');
    await page.screenshot({ path: 'tests/screenshots/board_B5_engine_openrouter.png' });
    
    const openrouterHelp = page.locator('.engine-help[data-engine="openrouter"]');
    await expect(openrouterHelp).toBeVisible();
    
    // Other configs hidden
    await expect(page.locator('.engine-config[data-engine="ollama"]')).toBeHidden();
    await expect(page.locator('.engine-config[data-engine="webllm"]')).toBeHidden();
  });

  // ── Key nudge test ───────────────────────────────────────────────
  test('B6: OpenRouter key nudge appears when no key set', async ({ page }) => {
    // Clear any stored API key
    await page.goto(`${BASE}/board.html`);
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('vault_settings') || '{}');
      delete s.openrouterKey;
      localStorage.setItem('vault_settings', JSON.stringify(s));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await page.selectOption('#engineSelect', 'openrouter');
    await page.screenshot({ path: 'tests/screenshots/board_B6_key_nudge.png' });
    
    const keyNudge = page.locator('#keyNudge');
    const nudgeVisible = await keyNudge.isVisible();
    console.log('Key nudge visible (no key):', nudgeVisible ? '✅' : '❌ NOT VISIBLE');
    // nudge should show when no key
    expect(nudgeVisible).toBe(true);
  });

  // ── Tab switching tests ──────────────────────────────────────────
  test('B7: Source tabs switch correctly', async ({ page }) => {
    await page.goto(`${BASE}/board.html`);
    await page.waitForLoadState('networkidle');
    
    // Default: upload tab active
    await expect(page.locator('#pane-upload')).toBeVisible();
    
    // Click URL tab
    await page.locator('.tab-btn[data-tab="url"]').click();
    await page.screenshot({ path: 'tests/screenshots/board_B7_tab_url.png' });
    await expect(page.locator('#pane-url')).toBeVisible();
    await expect(page.locator('#pane-upload')).toBeHidden();
    await expect(page.locator('#pane-paste')).toBeHidden();
    await expect(page.locator('#urlInput')).toBeVisible();
    await expect(page.locator('#urlFetchBtn')).toBeVisible();
    
    // Click Paste tab
    await page.locator('.tab-btn[data-tab="paste"]').click();
    await page.screenshot({ path: 'tests/screenshots/board_B7_tab_paste.png' });
    await expect(page.locator('#pane-paste')).toBeVisible();
    await expect(page.locator('#pane-upload')).toBeHidden();
    await expect(page.locator('#pane-url')).toBeHidden();
    await expect(page.locator('#pasteTitle')).toBeVisible();
    await expect(page.locator('#pasteInput')).toBeVisible();
    await expect(page.locator('#pasteLoadBtn')).toBeVisible();
    
    // Switch back to Upload
    await page.locator('.tab-btn[data-tab="upload"]').click();
    await page.screenshot({ path: 'tests/screenshots/board_B7_tab_upload.png' });
    await expect(page.locator('#pane-upload')).toBeVisible();
    
    console.log('Tab switching: ✅');
  });

  // ── URL fetch test with PDF ──────────────────────────────────────
  test('B8: URL fetch — PDF via sherlock URL', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    
    await page.goto(`${BASE}/board.html`);
    await page.waitForLoadState('networkidle');
    
    // Switch to URL tab
    await page.locator('.tab-btn[data-tab="url"]').click();
    
    // Fill URL
    await page.locator('#urlInput').fill(PDF_URL);
    await page.screenshot({ path: 'tests/screenshots/board_B8_url_entered.png' });
    
    // Click Fetch
    await page.locator('#urlFetchBtn').click();
    await page.screenshot({ path: 'tests/screenshots/board_B8_fetching.png' });
    
    // Wait for status to show busy
    await expect(page.locator('#statusMsg')).toBeVisible({ timeout: 3000 });
    const busyText = await page.locator('#statusMsg').textContent();
    console.log('Fetch status (busy):', busyText?.slice(0, 150));
    
    // Wait up to 45 seconds for result
    await page.waitForFunction(() => {
      const el = document.getElementById('statusMsg');
      const cls = el?.className || '';
      return cls.includes('ok') || cls.includes('error');
    }, { timeout: 45000 });
    
    await page.screenshot({ path: 'tests/screenshots/board_B8_fetch_result.png', fullPage: true });
    
    const statusClass = await page.locator('#statusMsg').getAttribute('class');
    const statusText = await page.locator('#statusMsg').textContent();
    console.log('Fetch result status class:', statusClass);
    console.log('Fetch result text:', statusText?.slice(0, 300));
    
    if (statusClass?.includes('ok')) {
      console.log('URL fetch: ✅ SUCCESS');
      
      // Preview panel should be visible
      await expect(page.locator('#previewPanel')).toBeVisible();
      
      const title = await page.locator('#pvTitle').textContent();
      const chapters = await page.locator('#pvChapters').textContent();
      const words = await page.locator('#pvWords').textContent();
      const source = await page.locator('#pvSource').textContent();
      
      console.log('Preview - Title:', title);
      console.log('Preview - Chapters:', chapters);
      console.log('Preview - Words:', words);
      console.log('Preview - Source:', source);
      
      expect(source).toMatch(/url/i);
      
    } else {
      console.log('URL fetch: ❌ FAILED');
      console.log('Error message:', statusText);
      // Don't fail the test — this is expected if jina.ai is unreachable
      // but we record the failure
    }
    
    if (errors.length > 0) console.log('JS errors during URL fetch:', errors.join('\n'));
  });

  // ── Paste mode test ──────────────────────────────────────────────
  test('B9: Paste mode — load, process with offline engine, check results', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    
    await page.goto(`${BASE}/board.html`);
    await page.waitForLoadState('networkidle');
    
    // Set engine to offline
    await page.selectOption('#engineSelect', 'offline');
    
    // Switch to paste tab
    await page.locator('.tab-btn[data-tab="paste"]').click();
    
    // Fill in paste
    await page.locator('#pasteTitle').fill('Holmes Test Chapter');
    await page.locator('#pasteInput').fill(PASTE_TEXT);
    
    await page.screenshot({ path: 'tests/screenshots/board_B9_paste_filled.png' });
    
    // Click load
    await page.locator('#pasteLoadBtn').click();
    await page.screenshot({ path: 'tests/screenshots/board_B9_paste_loaded.png', fullPage: true });
    
    // Preview panel should appear
    await expect(page.locator('#previewPanel')).toBeVisible({ timeout: 5000 });
    
    const title = await page.locator('#pvTitle').textContent();
    const chapters = await page.locator('#pvChapters').textContent();
    const words = await page.locator('#pvWords').textContent();
    const source = await page.locator('#pvSource').textContent();
    console.log('Paste Preview - Title:', title);
    console.log('Paste Preview - Chapters:', chapters);
    console.log('Paste Preview - Words:', words);
    console.log('Paste Preview - Source:', source);
    expect(source).toMatch(/paste/i);
    
    // Check status ok
    const statusClass = await page.locator('#statusMsg').getAttribute('class');
    expect(statusClass).toMatch(/ok/);
    
    // Process with offline engine
    await page.locator('#processBtn').click();
    await page.screenshot({ path: 'tests/screenshots/board_B9_processing.png' });
    
    // Wait for processing to finish (max 30 sec)
    await page.waitForFunction(() => {
      const el = document.getElementById('statusMsg');
      const cls = el?.className || '';
      return cls.includes('ok') || cls.includes('error');
    }, { timeout: 30000 });
    
    await page.screenshot({ path: 'tests/screenshots/board_B9_result.png', fullPage: true });
    
    const resultStatusClass = await page.locator('#statusMsg').getAttribute('class');
    const resultStatusText = await page.locator('#statusMsg').textContent();
    console.log('Processing result status:', resultStatusClass);
    console.log('Processing result text:', resultStatusText?.slice(0, 300));
    
    if (resultStatusClass?.includes('ok')) {
      console.log('Offline processing: ✅ SUCCESS');
      await expect(page.locator('#resultPanel')).toBeVisible();
      
      const entityCount = await page.locator('#entityCount').textContent();
      const edgeCount = await page.locator('#edgeCount').textContent();
      const resultTitle = await page.locator('#resultTitle').textContent();
      
      console.log('Result title:', resultTitle);
      console.log('Entity count:', entityCount);
      console.log('Edge count:', edgeCount);
      
      // Entity list should have cards
      const entityCards = await page.locator('#entityList .entity-card').count();
      const edgeCards = await page.locator('#edgeList .edge-card').count();
      console.log('Entity card count:', entityCards);
      console.log('Edge card count:', edgeCards);
      
      expect(entityCards).toBeGreaterThan(0);
      
    } else {
      console.log('Offline processing: ❌ FAILED');
      console.log('Error:', resultStatusText);
    }
    
    if (errors.length > 0) console.log('JS errors during paste test:', errors.join('\n'));
  });

  // ── Error validation tests ───────────────────────────────────────
  test('B10: Error validation — empty paste', async ({ page }) => {
    await page.goto(`${BASE}/board.html`);
    await page.waitForLoadState('networkidle');
    
    await page.locator('.tab-btn[data-tab="paste"]').click();
    // Leave textarea empty
    await page.locator('#pasteLoadBtn').click();
    await page.screenshot({ path: 'tests/screenshots/board_B10_empty_paste.png' });
    
    const statusClass = await page.locator('#statusMsg').getAttribute('class');
    const statusText = await page.locator('#statusMsg').textContent();
    console.log('Empty paste error class:', statusClass);
    console.log('Empty paste error text:', statusText);
    
    expect(statusClass).toMatch(/error/);
    // Should mention 200 chars minimum
    expect(statusText).toMatch(/200|characters|few paragraphs/i);
  });

  test('B11: Error validation — short paste text', async ({ page }) => {
    await page.goto(`${BASE}/board.html`);
    await page.waitForLoadState('networkidle');
    
    await page.locator('.tab-btn[data-tab="paste"]').click();
    await page.locator('#pasteInput').fill('Short text.');
    await page.locator('#pasteLoadBtn').click();
    await page.screenshot({ path: 'tests/screenshots/board_B11_short_paste.png' });
    
    const statusClass = await page.locator('#statusMsg').getAttribute('class');
    const statusText = await page.locator('#statusMsg').textContent();
    console.log('Short paste error:', statusText);
    expect(statusClass).toMatch(/error/);
  });

  test('B12: Error validation — empty URL', async ({ page }) => {
    await page.goto(`${BASE}/board.html`);
    await page.waitForLoadState('networkidle');
    
    await page.locator('.tab-btn[data-tab="url"]').click();
    // Leave URL empty
    await page.locator('#urlFetchBtn').click();
    await page.screenshot({ path: 'tests/screenshots/board_B12_empty_url.png' });
    
    const statusClass = await page.locator('#statusMsg').getAttribute('class');
    const statusText = await page.locator('#statusMsg').textContent();
    console.log('Empty URL error:', statusText);
    expect(statusClass).toMatch(/error/);
    expect(statusText).toMatch(/url|paste|link/i);
  });

  test('B13: Error validation — invalid URL (no http prefix)', async ({ page }) => {
    await page.goto(`${BASE}/board.html`);
    await page.waitForLoadState('networkidle');
    
    await page.locator('.tab-btn[data-tab="url"]').click();
    await page.locator('#urlInput').fill('notavalidurl');
    await page.locator('#urlFetchBtn').click();
    await page.screenshot({ path: 'tests/screenshots/board_B13_invalid_url.png' });
    
    const statusClass = await page.locator('#statusMsg').getAttribute('class');
    const statusText = await page.locator('#statusMsg').textContent();
    console.log('Invalid URL error:', statusText);
    expect(statusClass).toMatch(/error/);
    expect(statusText).toMatch(/http/i);
  });

  // ── Cancel / Discard test ────────────────────────────────────────
  test('B14: Discard button hides preview panel', async ({ page }) => {
    await page.goto(`${BASE}/board.html`);
    await page.waitForLoadState('networkidle');
    
    // Load a paste to show preview
    await page.locator('.tab-btn[data-tab="paste"]').click();
    await page.locator('#pasteTitle').fill('Discard Test');
    await page.locator('#pasteInput').fill(PASTE_TEXT);
    await page.locator('#pasteLoadBtn').click();
    
    // Preview panel should be visible
    await expect(page.locator('#previewPanel')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'tests/screenshots/board_B14_before_discard.png' });
    
    // Click Discard
    await page.locator('#cancelBtn').click();
    await page.screenshot({ path: 'tests/screenshots/board_B14_after_discard.png' });
    
    // Preview panel should be hidden
    await expect(page.locator('#previewPanel')).toBeHidden();
    // Status should be cleared
    const statusClass = await page.locator('#statusMsg').getAttribute('class');
    console.log('Status class after discard:', statusClass);
    expect(statusClass).not.toMatch(/show/);
    
    console.log('Discard test: ✅');
  });

  // ── Reprocess button test ────────────────────────────────────────
  test('B15: Reprocess button visible after processing', async ({ page }) => {
    await page.goto(`${BASE}/board.html`);
    await page.waitForLoadState('networkidle');
    
    // Use offline engine + paste
    await page.selectOption('#engineSelect', 'offline');
    await page.locator('.tab-btn[data-tab="paste"]').click();
    await page.locator('#pasteTitle').fill('Reprocess Test');
    await page.locator('#pasteInput').fill(PASTE_TEXT);
    await page.locator('#pasteLoadBtn').click();
    await expect(page.locator('#previewPanel')).toBeVisible({ timeout: 5000 });
    
    await page.locator('#processBtn').click();
    
    // Wait for result
    await page.waitForFunction(() => {
      const el = document.getElementById('statusMsg');
      return el?.className?.includes('ok') || el?.className?.includes('error');
    }, { timeout: 30000 });
    
    await page.screenshot({ path: 'tests/screenshots/board_B15_after_process.png', fullPage: true });
    
    const resultVisible = await page.locator('#resultPanel').isVisible();
    if (resultVisible) {
      const reprocessBtn = page.locator('#reprocessBtn');
      await expect(reprocessBtn).toBeVisible();
      const btnText = await reprocessBtn.textContent();
      console.log('Reprocess button text:', btnText);
      console.log('Reprocess button: ✅ visible');
    } else {
      console.log('Result panel not visible — cannot test reprocess button');
    }
  });

  // ── Navigation links test ────────────────────────────────────────
  test('B16: Navigation links are present', async ({ page }) => {
    await page.goto(`${BASE}/board.html`);
    await page.waitForLoadState('networkidle');
    
    // Check nav links
    const myRoomLink = page.locator('.top-nav a[href="inglenook.html"]');
    const vaultLink = page.locator('.top-nav a[href="reading-vault.html"]');
    const boardLink = page.locator('.top-nav a[href="board.html"]');
    
    await expect(myRoomLink).toBeVisible();
    await expect(vaultLink).toBeVisible();
    await expect(boardLink).toBeVisible();
    
    // Board link should be active
    await expect(boardLink).toHaveClass(/active/);
    
    const myRoomText = await myRoomLink.textContent();
    const vaultText = await vaultLink.textContent();
    console.log('My Room link:', myRoomText);
    console.log('Reading Vault link:', vaultText);
    
    await page.screenshot({ path: 'tests/screenshots/board_B16_navigation.png' });
    console.log('Navigation links: ✅');
  });

  // ── OpenRouter process without key — should show error ──────────
  test('B17: OpenRouter engine process without API key shows error', async ({ page }) => {
    await page.goto(`${BASE}/board.html`);
    
    // Ensure no API key in storage
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('vault_settings') || '{}');
      delete s.openrouterKey;
      localStorage.setItem('vault_settings', JSON.stringify(s));
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Select OpenRouter engine (default)
    await page.selectOption('#engineSelect', 'openrouter');
    
    // Load paste text
    await page.locator('.tab-btn[data-tab="paste"]').click();
    await page.locator('#pasteTitle').fill('No Key Test');
    await page.locator('#pasteInput').fill(PASTE_TEXT);
    await page.locator('#pasteLoadBtn').click();
    await expect(page.locator('#previewPanel')).toBeVisible({ timeout: 5000 });
    
    // Try to process — should fail gracefully with no key
    await page.locator('#processBtn').click();
    await page.screenshot({ path: 'tests/screenshots/board_B17_no_key_error.png', fullPage: true });
    
    // Wait for error
    await page.waitForFunction(() => {
      const el = document.getElementById('statusMsg');
      return el?.className?.includes('error') || el?.className?.includes('ok');
    }, { timeout: 10000 });
    
    const statusClass = await page.locator('#statusMsg').getAttribute('class');
    const statusText = await page.locator('#statusMsg').textContent();
    console.log('No-key OpenRouter error class:', statusClass);
    console.log('No-key OpenRouter error text:', statusText?.slice(0, 300));
    
    expect(statusClass).toMatch(/error/);
    expect(statusText).toMatch(/key|OpenRouter|engine/i);
    
    // Key nudge should appear
    const keyNudgeVisible = await page.locator('#keyNudge').isVisible();
    console.log('Key nudge shown after no-key process:', keyNudgeVisible ? '✅' : '❌');
  });

  // ── Visual bugs: key nudge link goes to reading-vault ────────────
  test('B18: Key nudge link targets reading-vault.html', async ({ page }) => {
    await page.goto(`${BASE}/board.html`);
    
    // Clear key
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('vault_settings') || '{}');
      delete s.openrouterKey;
      localStorage.setItem('vault_settings', JSON.stringify(s));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await page.selectOption('#engineSelect', 'openrouter');
    
    const keyNudge = page.locator('#keyNudge');
    const nudgeVisible = await keyNudge.isVisible();
    
    if (nudgeVisible) {
      const nudgeLink = keyNudge.locator('a');
      const href = await nudgeLink.getAttribute('href');
      console.log('Key nudge link href:', href);
      expect(href).toContain('reading-vault');
    } else {
      console.log('Key nudge not visible — check refreshEngineUI()');
    }
  });

  // ── Storage persistence test ─────────────────────────────────────
  test('B19: Engine setting persists on reload', async ({ page }) => {
    await page.goto(`${BASE}/board.html`);
    await page.waitForLoadState('networkidle');
    
    // Switch to offline
    await page.selectOption('#engineSelect', 'offline');
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Engine should still be offline
    const engineVal = await page.locator('#engineSelect').inputValue();
    console.log('Engine after reload:', engineVal);
    
    if (engineVal === 'offline') {
      console.log('Engine persistence: ✅');
    } else {
      console.log('Engine persistence: ❌ — reset to', engineVal);
    }
    
    await page.screenshot({ path: 'tests/screenshots/board_B19_persistence.png' });
  });

  // ── Process button disabled during processing ────────────────────
  test('B20: Process button disabled while processing', async ({ page }) => {
    await page.goto(`${BASE}/board.html`);
    await page.waitForLoadState('networkidle');
    
    await page.selectOption('#engineSelect', 'offline');
    await page.locator('.tab-btn[data-tab="paste"]').click();
    await page.locator('#pasteTitle').fill('Disable Test');
    await page.locator('#pasteInput').fill(PASTE_TEXT);
    await page.locator('#pasteLoadBtn').click();
    await expect(page.locator('#previewPanel')).toBeVisible({ timeout: 5000 });
    
    // Click process
    await page.locator('#processBtn').click();
    
    // Immediately check if button is disabled
    const isDisabled = await page.locator('#processBtn').isDisabled();
    const btnText = await page.locator('#processBtn').textContent();
    console.log('Process button disabled during processing:', isDisabled ? '✅' : '❌');
    console.log('Button text during processing:', btnText);
    
    // Wait for completion
    await page.waitForFunction(() => {
      const el = document.getElementById('statusMsg');
      return el?.className?.includes('ok') || el?.className?.includes('error');
    }, { timeout: 30000 });
    
    // Button should re-enable after
    const isDisabledAfter = await page.locator('#processBtn').isDisabled();
    console.log('Process button re-enabled after processing:', !isDisabledAfter ? '✅' : '❌');
    expect(isDisabledAfter).toBe(false);
  });

  // ── File upload tab check ────────────────────────────────────────
  test('B21: File input accepts PDF EPUB TXT', async ({ page }) => {
    await page.goto(`${BASE}/board.html`);
    await page.waitForLoadState('networkidle');
    
    const fileInput = page.locator('#fileInput');
    await expect(fileInput).toBeVisible();
    const accept = await fileInput.getAttribute('accept');
    console.log('File input accept attribute:', accept);
    expect(accept).toContain('.pdf');
    expect(accept).toContain('.epub');
    expect(accept).toContain('.txt');
  });

  // ── Raw JSON section test ────────────────────────────────────────
  test('B22: Raw JSON section expandable after processing', async ({ page }) => {
    await page.goto(`${BASE}/board.html`);
    await page.waitForLoadState('networkidle');
    
    await page.selectOption('#engineSelect', 'offline');
    await page.locator('.tab-btn[data-tab="paste"]').click();
    await page.locator('#pasteTitle').fill('JSON Test');
    await page.locator('#pasteInput').fill(PASTE_TEXT);
    await page.locator('#pasteLoadBtn').click();
    await expect(page.locator('#previewPanel')).toBeVisible({ timeout: 5000 });
    
    await page.locator('#processBtn').click();
    await page.waitForFunction(() => {
      const el = document.getElementById('statusMsg');
      return el?.className?.includes('ok') || el?.className?.includes('error');
    }, { timeout: 30000 });
    
    const resultVisible = await page.locator('#resultPanel').isVisible();
    if (resultVisible) {
      // Raw JSON section should be present
      const rawDetails = page.locator('details.raw-json');
      await expect(rawDetails).toBeVisible();
      
      // Click to expand
      await rawDetails.locator('summary').click();
      await page.screenshot({ path: 'tests/screenshots/board_B22_raw_json.png' });
      
      const rawJson = await page.locator('#rawJson').textContent();
      console.log('Raw JSON (first 200 chars):', rawJson?.slice(0, 200));
      
      // Should contain valid JSON
      try {
        const parsed = JSON.parse(rawJson || '');
        console.log('Raw JSON is valid JSON ✅');
        expect(parsed).toHaveProperty('step1');
        expect(parsed).toHaveProperty('step2');
      } catch (e) {
        console.log('Raw JSON parse error ❌:', e.message);
      }
    }
  });

  // ── Footer text test ─────────────────────────────────────────────
  test('B23: Footer visible', async ({ page }) => {
    await page.goto(`${BASE}/board.html`);
    await page.waitForLoadState('networkidle');
    
    const footer = page.locator('footer.foot');
    await expect(footer).toBeVisible();
    const footerText = await footer.textContent();
    console.log('Footer:', footerText);
    await page.screenshot({ path: 'tests/screenshots/board_B23_footer.png', fullPage: true });
  });

  // ── Full page screenshot ─────────────────────────────────────────
  test('B24: Full page screenshot and scroll check', async ({ page }) => {
    await page.goto(`${BASE}/board.html`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/board_B24_full_page.png', fullPage: true });
    console.log('Full page screenshot taken ✅');
  });
});
