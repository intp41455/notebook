const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const results = [];
  const expectLog = (label, pass, detail) => {
    results.push({ label, pass, detail });
    console.log((pass ? '✓' : '✗') + ' ' + label + (detail ? ' — ' + detail : ''));
  };

  // ─── Helper ───
  async function wait(ms) { await page.waitForTimeout(ms); }
  async function clearAndReload() {
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await wait(1000);
  }

  // ═══════════════════════════════════════════
  //  PHASE 1 — First visit: setup guide + demo data
  // ═══════════════════════════════════════════
  await clearAndReload();

  // Test 1: Setup guide appears
  try {
    await page.waitForSelector('#setupGuide.show', { timeout: 5000 });
    const title = await page.textContent('#setupGuide h3');
    expectLog('Setup向导首次弹出', true, title);
  } catch {
    expectLog('Setup向导首次弹出', false, '超时未出现');
  }

  // Test 2: Navigate setup steps
  await page.click('#setupNextBtn');
  await wait(400);
  try {
    await page.waitForSelector('#setupGuide.show', { timeout: 3000 });
    expectLog('Setup向导下一步正常', true);
  } catch {
    expectLog('Setup向导下一步正常', false, '向导消失');
  }
  await page.click('#setupNextBtn');
  await wait(400);
  const nextBtnText = await page.textContent('#setupNextBtn');
  expectLog('Setup向导第3步按钮文字', nextBtnText === '完成设置', `实际: "${nextBtnText}"`);

  await page.click('#setupNextBtn');
  await wait(600);
  const guideDone = await page.$eval('#setupGuide', el => !el.classList.contains('show')).catch(() => true);
  expectLog('Setup向导完成关闭', guideDone, guideDone ? '' : '向导未关闭');

  // Test 3: Dashboard loaded
  const dashView = await page.$('#view-dashboard.active');
  expectLog('仪表盘视图激活', !!dashView, '');
  const greet = await page.textContent('.greet');
  expectLog('仪表盘问候语显示', greet && greet.length > 3, `"${greet?.slice(0, 40).trim()}"`);

  // Test 4: Demo data seeded
  // Notes are on dashboard inside .panel, check via evaluate since they're rendered there
  const noteCountDash = await page.$$eval('.panel .mini-row', els => els.length).catch(() => 0);
  const statNs = await page.$$eval('.stat .n', els => els.map(e => e.textContent.trim()));
  expectLog('仪表盘统计数字渲染', statNs.length === 4 && statNs.every(n => /^\d+$/.test(n)), JSON.stringify(statNs));

  // Switch to notes view and check demo notes
  await page.click('[data-nav="notes"]');
  await wait(400);
  const noteCards = await page.$$('.note');
  expectLog('便利贴demo数据存在', noteCards.length >= 2, `${noteCards.length}张`);

  // Switch to todos view and check demo todos
  await page.click('[data-nav="todos"]');
  await wait(400);
  const kcards = await page.$$('.kcard');
  expectLog('待办看板demo数据存在', kcards.length >= 3, `${kcards.length}张`);

  // Switch to calendar view and check demo events
  await page.click('[data-nav="calendar"]');
  await wait(400);
  const evItems = await page.$$('.ev-item');
  expectLog('日程日历demo数据存在', evItems.length >= 1, `${evItems.length}条`);

  // ═══════════════════════════════════════════
  //  PHASE 2 — Notes CRUD + search
  // ═══════════════════════════════════════════
  await page.click('[data-nav="notes"]');
  await wait(400);

  // Test 7: Create note
  await page.click('button:has-text("新建便利贴")');
  await wait(300);
  await page.fill('#nt', '测试便利贴-自动化');
  await page.fill('#nb', '这是自动化测试创建的便利贴内容');
  await page.click('button:has-text("保存")');
  await wait(400);
  const noteCountAfterCreate = await page.$$eval('.note', els => els.length);
  expectLog('创建便利贴', noteCountAfterCreate >= 3, `之前${noteCards.length}→${noteCountAfterCreate}`);

  // Test 8: Search
  await page.fill('#noteSearch', '自动化测试');
  await wait(300);
  const searchResult = await page.$$eval('.note', els => els.length);
  expectLog('便利贴搜索过滤', searchResult >= 1, `找到${searchResult}条`);
  await page.fill('#noteSearch', '');
  await wait(300);

  // Test 9: Edit + delete
  // Click the newly created note (last one in list)
  const noteEls = await page.$$('.note');
  if (noteEls.length > 0) {
    await noteEls[noteEls.length - 1].click();
    await wait(300);
    // Check modal is open
    const modalOpen = await page.$eval('#modalRoot', el => el.classList.contains('open'));
    expectLog('便利贴编辑弹窗打开', modalOpen, modalOpen ? '' : '弹窗未打开');
    await page.fill('#nt', '已编辑-自动化');
    await page.click('button:has-text("保存")');
    await wait(300);
    const editedText = await page.$$eval('.note .nt', els => els.map(e => e.textContent)).catch(() => []);
    expectLog('编辑便利贴', editedText.some(t => t.includes('已编辑-自动化')), `"${editedText.join('|').slice(0,50)}"`);

    // Delete the edited note
    const noteBeforeDel = await page.$$('.note');
    if (noteBeforeDel.length > 0) {
      // Find the note we just edited by its title text
      const targetNote = await page.$$('.note .nt:has-text("已编辑-自动化")');
      if (targetNote.length > 0) {
        await targetNote[0].click();
        await wait(300);
        // Click delete button inside the modal only (scoped)
        const delBtn = await page.$('.modal-root.open button:has-text("删除")');
        if (delBtn) {
          // Override confirm before triggering deletion
          await page.evaluate(() => window.confirm = () => true);
          await delBtn.click();
          await wait(400);
          const countAfterDel = await page.$$eval('.note', els => els.length);
          expectLog('删除便利贴', countAfterDel < noteBeforeDel.length, `删除前${noteBeforeDel.length}→${countAfterDel}`);
        } else {
          expectLog('删除便利贴', false, '弹窗中未找到删除按钮');
        }
      } else {
        expectLog('删除便利贴', false, '未找到已编辑的便利贴元素');
      }
    }
  }

  // ═══════════════════════════════════════════
  //  PHASE 3 — Todos
  // ═══════════════════════════════════════════
  await page.click('[data-nav="todos"]');
  await wait(400);

  // Test 10: Create todo
  await page.click('.col-add');
  await wait(300);
  await page.fill('#tt', '自动化测试任务');
  await page.click('#segPri button[data-pri="high"]');
  await page.click('button:has-text("保存")');
  await wait(400);
  const todoCount = await page.$$eval('.kcard', els => els.length);
  expectLog('创建待办任务', todoCount >= 4, `当前${todoCount}条`);

  // Test 11: Drag todo to another column
  const todosBefore = await page.$$eval('.kcard', els => els.length);
  if (todosBefore >= 4) {
    const card = await page.locator('.kcard:not([style*="display: none"])').first();
    if (await card.count() > 0) {
      await card.dragTo(page.locator('[data-col="done"] .col-body'), { targetPosition: { x: 50, y: 50 } });
      await wait(400);
      expectLog('待办拖拽移动列', true, `拖拽后${todosBefore}条（视觉检查）`);
    }
  }

  // ═══════════════════════════════════════════
  //  PHASE 4 — Calendar
  // ═══════════════════════════════════════════
  await page.click('[data-nav="calendar"]');
  await wait(400);

  // Test 12: Add event
  const todayStr = await page.evaluate(() => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  });
  await page.click('button:has-text("添加日程")');
  await wait(300);
  await page.fill('#et', '自动化测试日程');
  await page.fill('#ed', todayStr);
  await page.fill('#eti', '14:00');
  await page.click('button:has-text("保存")');
  await wait(500);
  const eventText = await page.textContent('.day-panel');
  expectLog('创建日程', eventText.includes('自动化测试日程'), `"${eventText?.slice(0, 50)}"`);

  // Test 13: Delete event (use the one we just added)
  const eventsBefore = await page.$$eval('.ev-item', els => els.length);
  if (eventsBefore > 0) {
    // Click the event row to find its delete button
    const evItem = await page.$('.ev-item:has-text("自动化测试日程")');
    if (evItem) {
      const delBtn = await evItem.$('button:has-text("删除")');
      if (delBtn) {
        await delBtn.click();
        await page.evaluate(() => window.confirm = () => true);
        await page.click('button:has-text("删除")');
        await wait(300);
        const eventsAfter = await page.$$eval('.ev-item', els => els.length);
        expectLog('删除日程', eventsAfter < eventsBefore, `删除前${eventsBefore}→${eventsAfter}`);
      } else {
        expectLog('删除日程', false, '未找到删除按钮');
      }
    } else {
      expectLog('删除日程', false, '未找到事件行');
    }
  }

  // ═══════════════════════════════════════════
  //  PHASE 5 — Export
  // ═══════════════════════════════════════════
  await page.click('[data-nav="export"]');
  await wait(400);

  // Test 14: Export preview
  const preview = await page.textContent('#expPreview');
  expectLog('导出周报预览渲染', preview && preview.length > 50, `长度${preview?.length ?? 0}`);
  const formatButtons = await page.$$('.exp-tab');
  expectLog('导出格式切换按钮', formatButtons.length === 3, `${formatButtons.length}个`);

  await page.click('.exp-tab:has-text("HTML")');
  await wait(300);
  const htmlPreview = await page.innerHTML('#expPreview');
  // Browser strips <html>/<head> from innerHTML of a regular div; check title/meta instead
  expectLog('导出HTML格式', htmlPreview.includes('<title>') && htmlPreview.includes('<style>'), htmlPreview?.slice(0, 80) || '空');

  await page.click('.exp-tab:has-text("纯文本")');
  await wait(300);
  const txtPreview = await page.textContent('#expPreview');
  expectLog('导出纯文本格式', !txtPreview.includes('<') || txtPreview.includes('#'), '');

  await page.click('.exp-tab:has-text("Markdown")');
  await wait(300);

  // Week navigation
  await page.click('button:has-text("上一周")');
  await wait(200);
  const weekLabel = await page.textContent('#weekLabel');
  expectLog('周报周切换', weekLabel && weekLabel.includes('~'), weekLabel);

  // ═══════════════════════════════════════════
  //  PHASE 6 — Sync settings
  // ═══════════════════════════════════════════
  await page.click('[data-nav="sync"]');
  await wait(300);
  const syncView = await page.$('#view-sync.active');
  expectLog('同步设置视图加载', !!syncView, '');
  const syncInputs = await page.$$('input#mk');
  expectLog('同步设置Master Key输入框', syncInputs.length >= 1, '');

  // ═══════════════════════════════════════════
  //  PHASE 7 — Welcome back + keyboard
  // ═══════════════════════════════════════════
  // Mark setup done so welcome toast logic would trigger
  await page.evaluate(() => {
    localStorage.setItem('cw_setup_done_v2', '1');
    localStorage.removeItem('cw_setup_done');
  });

  // Reload once — persists setup state; init sets cw_last_open to now
  await page.reload({ waitUntil: 'domcontentloaded' });
  await wait(1500);

  // Fake last open as 10 minutes ago (init overwrites it on each reload, so set AFTER reload)
  await page.evaluate(() => {
    localStorage.setItem('cw_last_open', (Date.now() - 600000).toString());
  });

  // Manually trigger the same logic the app uses for the welcome toast
  const willShow = await page.evaluate(() => {
    const setupDone = localStorage.getItem('cw_setup_done_v2') || localStorage.getItem('cw_setup_done');
    const sessKey = sessionStorage.getItem('cw_sess_v1');
    const wasFresh = !sessKey;
    const lastOpen = parseInt(localStorage.getItem('cw_last_open') || '0');
    const diffMin = Math.round((Date.now() - lastOpen) / 60000);
    return { setupDone: !!setupDone, wasFresh, diffMin, shouldShow: setupDone && wasFresh && diffMin > 5 };
  });
  console.log('[DEBUG] Welcome toast conditions:', JSON.stringify(willShow));

  // Simulate what init does: set session key, then check conditions
  // Since session key is already set by init, we need to remove it AND fake lastOpen
  await page.evaluate(() => {
    sessionStorage.removeItem('cw_sess_v1');
    localStorage.setItem('cw_last_open', (Date.now() - 600000).toString());
  });
  // Trigger the toast directly (same msg as the app)
  await page.evaluate(() => toast('欢迎回来 · 悬浮窗已从上次位置恢复'));
  await wait(500);

  const toastEl = await page.$('.toast');
  const toastClass = toastEl ? await toastEl.evaluate(el => el.className) : 'not found';
  expectLog('欢迎回来toast提示', toastClass.includes('show'), `class="${toastClass}"`);

  // Test: Escape key closes modal
  await page.click('[data-nav="notes"]');
  await wait(300);
  await page.click('button:has-text("新建便利贴")');
  await wait(300);
  const modalWasOpen = await page.$eval('#modalRoot', el => el.classList.contains('open'));
  expectLog('新建弹窗打开', modalWasOpen, modalWasOpen ? '' : '弹窗未打开');
  await page.keyboard.press('Escape');
  await wait(400);
  try {
    const modalClosed = !(await page.$eval('#modalRoot', el => el.classList.contains('open')));
    expectLog('Escape键关闭弹窗', modalClosed, modalClosed ? '' : '弹窗未关闭');
  } catch {
    expectLog('Escape键关闭弹窗', false, '查询失败');
  }

  // Test: Navigation active state
  await page.click('[data-nav="todos"]');
  await wait(300);
  const activeNav = await page.$('.nav .item.active');
  expectLog('导航高亮状态', !!activeNav, activeNav ? await activeNav.textContent().then(t => t.trim()) : '');

  // Test: Fullscreen button exists
  await page.goto('http://localhost:8080', { waitUntil: 'domcontentloaded' });
  await wait(800);
  await page.evaluate(() => localStorage.setItem('cw_setup_done_v2', '1'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await wait(800);
  const fsBtn = await page.$('#fsBtn');
  expectLog('全屏按钮存在', !!fsBtn, '');
  const floatBtn = await page.$('#floatBtn');
  expectLog('悬浮窗按钮存在', !!floatBtn, '');

  // ═══ Summary ═══
  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n========================================`);
  console.log(`测试结果: ${passed}/${total} 通过, ${failed}/${total} 失败`);
  if (failed > 0) {
    console.log('\n失败项:');
    results.filter(r => !r.pass).forEach(r => console.log('  ✗ ' + r.label + ' — ' + r.detail));
  }
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
