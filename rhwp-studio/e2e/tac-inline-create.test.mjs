/**
 * E2E 테스트: 빈 문서에서 인라인 TAC 표 직접 생성 (Issue #32)
 *
 * 문서 작성 과정을 단계별로 시각화하며,
 * tac-case-001.hwp와 동일한 구조를 WASM API로 직접 만든다.
 *
 * 실행: node e2e/tac-inline-create.test.mjs [--mode=host|headless]
 */
import {
  runTest, createNewDocument, clickEditArea, screenshot, assert,
  getPageCount, moveCursorTo, getCursorPosition,
} from './helpers.mjs';

/** 렌더링 갱신 + 대기 */
async function refresh(page) {
  await page.evaluate(() => {
    window.__eventBus?.emit?.('document-changed');
    window.__canvasView?.loadDocument?.();
  });
  await page.evaluate(() => new Promise(r => setTimeout(r, 800)));
}

runTest('인라인 TAC 표 — 빈 문서에서 직접 생성', async ({ page }) => {
  // ── Step 0: 빈 문서 생성 ──
  await createNewDocument(page);
  await clickEditArea(page);
  await screenshot(page, 'tac-build-00-blank');
  console.log('  Step 0: 빈 문서');

  // ── Step 1: 제목 입력 (키보드) ──
  await moveCursorTo(page, 0, 0, 0);
  await page.keyboard.type('TC #20', { delay: 50 });
  await page.evaluate(() => new Promise(r => setTimeout(r, 300)));
  await screenshot(page, 'tac-build-01-title');
  console.log('  Step 1: 제목 "TC #20" 입력');

  // ── Step 2: Enter → 새 문단 ──
  await page.keyboard.press('Enter');
  await page.evaluate(() => new Promise(r => setTimeout(r, 300)));
  await screenshot(page, 'tac-build-02-enter');
  console.log('  Step 2: Enter (pi=1 생성)');

  // ── Step 3: pi=1 전체 텍스트 입력 (표 앞 + 표 뒤 텍스트를 먼저 모두 입력) ──
  await page.keyboard.type('tacglkj ', { delay: 50 });
  await page.evaluate(() => new Promise(r => setTimeout(r, 100)));
  await page.keyboard.type('표 3 배치 시작', { delay: 80 });
  await page.evaluate(() => new Promise(r => setTimeout(r, 100)));
  // 표가 들어갈 자리 이후의 텍스트도 미리 입력
  await page.keyboard.type('4 tacglkj ', { delay: 50 });
  await page.evaluate(() => new Promise(r => setTimeout(r, 100)));
  await page.keyboard.type('표 다음', { delay: 80 });
  await page.evaluate(() => new Promise(r => setTimeout(r, 300)));
  await screenshot(page, 'tac-build-03-all-text');
  console.log('  Step 3: pi=1 전체 텍스트 입력');

  // ── Step 4: "시작" 뒤에 인라인 TAC 표 삽입 ──
  // "tacglkj 표 3 배치 시작" = 17자, 표는 offset 17에 삽입
  const tableResult = await page.evaluate(() => {
    const w = window.__wasm;
    return JSON.parse(w.doc.createTableEx(JSON.stringify({
      sectionIdx: 0, paraIdx: 1, charOffset: 17,
      rowCount: 2, colCount: 2,
      treatAsChar: true,
      colWidths: [6777, 6777],
    })));
  });
  assert(tableResult.ok, `createTableEx 실패: ${JSON.stringify(tableResult)}`);
  await refresh(page);
  await screenshot(page, 'tac-build-04-table-inserted');
  console.log(`  Step 4: 인라인 TAC 2×2 표 삽입 (ci=${tableResult.controlIdx})`);

  // ── Step 5: 셀 텍스트 입력 ──
  await page.evaluate((ci) => {
    const w = window.__wasm;
    w.doc.insertTextInCell(0, 1, ci, 0, 0, 0, '1');
    w.doc.insertTextInCell(0, 1, ci, 1, 0, 0, '2');
    w.doc.insertTextInCell(0, 1, ci, 2, 0, 0, '3 tacglkj');
    w.doc.insertTextInCell(0, 1, ci, 3, 0, 0, '4 tacglkj');
  }, tableResult.controlIdx);
  await refresh(page);
  await screenshot(page, 'tac-build-05-cell-text');
  console.log('  Step 5: 셀 텍스트 입력 (1, 2, 3 tacglkj, 4 tacglkj)');

  // ── Step 6: Enter → pi=2 ──
  // 커서를 pi=1 끝으로 이동
  {
    const pi1Len = await page.evaluate(() => {
      return window.__wasm.doc.getParagraphLength(0, 1);
    });
    await moveCursorTo(page, 0, 1, pi1Len);
  }
  await page.keyboard.press('Enter');
  await page.evaluate(() => new Promise(r => setTimeout(r, 300)));
  await screenshot(page, 'tac-build-06-enter2');
  console.log('  Step 6: Enter (pi=2 생성)');

  // ── Step 7: 마지막 줄 텍스트 (키보드) ──
  await page.keyboard.type('tacglkj ', { delay: 50 });
  await page.evaluate(() => new Promise(r => setTimeout(r, 200)));
  await page.keyboard.type('가나 옮', { delay: 80 });
  await page.evaluate(() => new Promise(r => setTimeout(r, 300)));
  await screenshot(page, 'tac-build-07-final-text');
  console.log('  Step 7: 마지막 줄 "tacglkj 가나 옮"');

  // ── 최종 검증 ──
  const final_ = await page.evaluate(() => {
    const w = window.__wasm;
    const getParaText = (s, p) => {
      try {
        const len = w.doc.getParagraphLength(s, p);
        return w.doc.getTextRange(s, p, 0, len);
      } catch { return ''; }
    };
    return {
      pageCount: w.pageCount,
      paraCount: w.getParagraphCount(0),
      pi0: getParaText(0, 0),
      pi1: getParaText(0, 1),
      pi2: getParaText(0, 2),
    };
  });

  console.log(`\n  === 최종 결과 ===`);
  console.log(`  페이지: ${final_.pageCount}, 문단: ${final_.paraCount}`);
  console.log(`  pi=0: "${final_.pi0}"`);
  console.log(`  pi=1: "${final_.pi1}"`);
  console.log(`  pi=2: "${final_.pi2}"`);

  assert(final_.pageCount === 1, `1페이지 예상, 실제: ${final_.pageCount}`);
  assert(final_.paraCount >= 3, `3문단 이상 예상, 실제: ${final_.paraCount}`);
  assert(final_.pi1.includes('배치 시작'), `pi=1에 '배치 시작' 포함 예상`);
  assert(final_.pi1.includes('표 다음'), `pi=1에 '표 다음' 포함 예상`);

  await screenshot(page, 'tac-build-08-final');
  console.log('\n  인라인 TAC 표 직접 생성 E2E 완료 ✓');
});
