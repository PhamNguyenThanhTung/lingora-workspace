#!/usr/bin/env node
/**
 * Build a multi-page draw.io file directly from Lingora canonical PlantUML source files (.puml).
 *
 * Uses draw.io's native PlantUML converter engine (mxPlantUmlToDrawio) to convert
 * all 36 diagrams into fully editable draw.io vector shapes (native cells, text, boxes, arrows).
 *
 * Each diagram is placed on an independent page/tab, preserves editable text and shapes,
 * and carries its PlantUML source code for direct re-editing via draw.io's built-in PlantUML editor.
 *
 * Usage:
 *     node scripts/build_drawio_from_puml.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

// Canonical group ordering
const GROUP_ORDER = [
  'SYS',   // 1. System
  'UC',    // 2. Use Case
  'VIEW-RUC', // Report-oriented functional Use Case views
  'ACT',   // 3. Activity
  'STA',   // 4. State
  'DOM',   // 5. Domain
  'DATA',  // 6. Data / ERD
  'SEQ',   // 7. Sequence
  'SEC',   // 8. Security
  'DEP',   // 9. Deployment
];

// Deferred Reassessment remains in the canonical source inventory, but not in
// the active primary draw.io deliverable.
const OMITTED_PRIMARY_DRAWIO_IDS = new Set(['ACT-05']);
const REPORT_PUML_DIR = path.join(__dirname, '..', 'docs', 'modeling', 'report-usecases');
const DIAGRAM_ID_PATTERN = /^(VIEW-RUC-\d{2}[A-B]?|[A-Z]+-\d+)/;

function shouldIncludeInPrimaryDrawio(diagramId) {
  return !OMITTED_PRIMARY_DRAWIO_IDS.has(diagramId);
}

// ID to friendly name mapping
const ID_MAP = {
  // System
  'SYS-01': 'Hệ thống - Tổng quan hệ thống hiện tại',
  'SYS-02': 'Hệ thống - Tổng quan hệ thống mục tiêu',
  'SYS-03': 'Hệ thống - Components hiện tại',
  'SYS-04': 'Hệ thống - Components mục tiêu',

  // Use Case
  'UC-01': 'Use Case - Tổng quan Lingora',
  'UC-02': 'Use Case - Học viên',
  'UC-03': 'Use Case - Giáo viên',
  'UC-04': 'Use Case - Quản trị viên',

  // Report-oriented functional Use Case views (not canonical UC identities)
  'VIEW-RUC-01': 'Use Case - Đăng ký, đăng nhập và hồ sơ',
  'VIEW-RUC-02': 'Use Case - Ngữ cảnh học tập',
  'VIEW-RUC-03': 'Use Case - Học bài và luyện tập',
  'VIEW-RUC-04': 'Use Case - Ôn tập SRS',
  'VIEW-RUC-05': 'Use Case - Placement và Level-up',
  'VIEW-RUC-06': 'Use Case - Tiến độ và lịch sử học tập',
  'VIEW-RUC-07': 'Use Case - Giáo viên biên soạn nội dung',
  'VIEW-RUC-08A': 'Use Case - Phân công, duyệt và xuất bản nội dung',
  'VIEW-RUC-08B': 'Use Case - Quản lý tài khoản và hỗ trợ',

  // Activity
  'ACT-01': 'Activity - Onboarding học viên',
  'ACT-02': 'Activity - Placement Assessment',
  'ACT-03': 'Activity - Học bài và luyện tập',
  'ACT-04': 'Activity - Level-up Assessment',
  'ACT-05': 'Activity - Reassessment - Deferred',
  'ACT-06': 'Activity - Ôn tập SRS',
  'ACT-07': 'Activity - Provision và quản lý Teacher',
  'ACT-08': 'Activity - Content Governance',
  'ACT-09': 'Activity - Revision Replacement',

  // State
  'STA-01': 'State - Trạng thái tài khoản',
  'STA-02': 'State - Vòng đời Assignment',
  'STA-03': 'State - Vòng đời Content Revision',

  // Domain
  'DOM-01': 'Domain - Mô hình miền Lingora',

  // Data / ERD
  'DATA-01': 'Data - Migration ERD hiện tại',
  'DATA-02': 'Data - Prisma Model hiện tại',
  'DATA-03': 'Data - Logical ERD mục tiêu',

  // Sequence
  'SEQ-01': 'Sequence - Đăng nhập và kiểm tra tài khoản',
  'SEQ-02': 'Sequence - Provision Teacher',
  'SEQ-03': 'Sequence - Teacher soạn và submit nội dung',
  'SEQ-04': 'Sequence - Review approve và publish',
  'SEQ-05': 'Sequence - Thay thế revision',
  'SEQ-06': 'Sequence - Học bài và xử lý exercise',
  'SEQ-07': 'Sequence - Placement và Level-up',
  'SEQ-08': 'Sequence - Ôn tập SRS',
  'SEQ-09': 'Sequence - Hỗ trợ và disable tài khoản',

  // Security
  'SEC-01': 'Security - Trust Boundary DFD',

  // Deployment
  'DEP-01': 'Deployment - Hệ thống hiện tại',
  'DEP-02': 'Deployment - Kiến trúc triển khai mục tiêu',
};

function loadDrawioPlantUmlEngine() {
  const enginePath = path.join(__dirname, 'vendor', 'drawio-plantuml.min.js');
  if (!fs.existsSync(enginePath)) {
    throw new Error(`drawio-plantuml engine not found at ${enginePath}`);
  }
  const code = fs.readFileSync(enginePath, 'utf8');
  const sandbox = { window: {}, document: {}, console: console };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  if (!sandbox.mxPlantUmlToDrawio || typeof sandbox.mxPlantUmlToDrawio.parseText !== 'function') {
    throw new Error('Failed to initialize mxPlantUmlToDrawio engine');
  }
  return sandbox.mxPlantUmlToDrawio;
}

function resolvePumlSource(sourcePath, pumlDir) {
  const sourceRoot = fs.realpathSync(pumlDir);
  const canonicalSourcePath = fs.realpathSync(sourcePath);
  const sourceRelative = path.relative(sourceRoot, canonicalSourcePath);
  if (!sourceRelative || sourceRelative.startsWith('..') || path.isAbsolute(sourceRelative)) {
    throw new Error(`PlantUML source is outside the canonical source directory: ${sourcePath}`);
  }

  const rawSource = fs.readFileSync(canonicalSourcePath, 'utf8');
  const normalizedSource = rawSource.replace(/\r\n?/g, '\n');
  const directives = rawSource.split(/\r?\n/).filter(line => /^\s*!include(?:url)?\b/i.test(line));
  if (directives.length === 0) {
    return { rawSource, expandedSource: normalizedSource };
  }
  const includeTargets = new Map([
    ['!include ../style.puml', path.resolve(sourceRoot, '..', 'style.puml')],
    ['!include ../current-target/style.puml', path.resolve(sourceRoot, '..', 'current-target', 'style.puml')],
  ]);
  const directive = directives[0]?.trim();
  if (directives.length !== 1 || !includeTargets.has(directive)) {
    throw new Error(`Unsupported PlantUML include in ${path.basename(sourcePath)}: ${directives.join('; ')}`);
  }

  const sharedStylePath = includeTargets.get(directive);
  const requestedStylePath = path.resolve(sourceRoot, directive.replace(/^!include\s+/, ''));
  if (requestedStylePath !== sharedStylePath || !fs.existsSync(sharedStylePath)) {
    throw new Error(`Unsupported PlantUML include in ${path.basename(sourcePath)}: ${directives[0].trim()}`);
  }

  const normalizedStyle = fs.readFileSync(sharedStylePath, 'utf8').replace(/\r\n?/g, '\n');
  const styleBody = normalizedStyle
    .split('\n')
    .filter(line => !/^\s*@(start|end)uml\b/i.test(line))
    .join('\n')
    .replace(/^\n+|\n+$/g, '');
  const expandedSource = normalizedSource.replace(/^[ \t]*!include(?:url)?\b[^\n]*$/m, styleBody);
  return { rawSource, expandedSource };
}

function convertPumlToXml(sourcePath, pumlDir, converter) {
  const { rawSource, expandedSource } = resolvePumlSource(sourcePath, pumlDir);
  const rawModelXml = converter.parseText(expandedSource);
  const wrappedXml = converter.wrapGroup(rawModelXml, expandedSource, null);
  return { rawSource, expandedSource, wrappedXml };
}

function calculateDiagramBounds(xml) {
  let maxX = 800;
  let maxY = 600;
  // Match x, y, width, height in mxGeometry
  const geomRegex = /<mxGeometry\b([^>]+)\/?>/g;
  let match;
  while ((match = geomRegex.exec(xml)) !== null) {
    const attrs = match[1];
    const xMatch = attrs.match(/\bx="([^"]+)"/);
    const yMatch = attrs.match(/\by="([^"]+)"/);
    const wMatch = attrs.match(/\bwidth="([^"]+)"/);
    const hMatch = attrs.match(/\bheight="([^"]+)"/);

    const x = xMatch ? parseFloat(xMatch[1]) : 0;
    const y = yMatch ? parseFloat(yMatch[1]) : 0;
    const w = wMatch ? parseFloat(wMatch[1]) : 0;
    const h = hMatch ? parseFloat(hMatch[1]) : 0;

    if (!isNaN(x) && !isNaN(w) && x + w > maxX) maxX = x + w;
    if (!isNaN(y) && !isNaN(h) && y + h > maxY) maxY = y + h;
  }
  return { width: Math.round(maxX + 60), height: Math.round(maxY + 60) };
}

function applyNativeCellLayout(outputFile) {
  const repoRoot = path.join(__dirname, '..');
  const layoutScript = path.join(__dirname, 'layout_drawio_native.py');
  const python = process.env.LINGORA_PYTHON || (process.platform === 'win32' ? 'py' : 'python3');
  const pythonArgs = process.platform === 'win32' ? ['-3.13'] : [];
  const result = spawnSync(
    python,
    [...pythonArgs, layoutScript, '--drawio', outputFile],
    { cwd: repoRoot, stdio: 'inherit', windowsHide: true },
  );
  if (result.error) {
    throw new Error(`Failed to apply native-cell geometry pass with ${python}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`Native-cell geometry pass failed with ${python} (exit ${result.status})`);
  }
}

function main() {
  const pumlDir = path.join(__dirname, '..', 'docs', 'modeling', 'current-target', 'src');
  const outputFile = path.join(__dirname, '..', 'docs', 'modeling', 'current-target', 'lingora-all-diagrams.drawio');

  console.log(`Loading draw.io PlantUML engine...`);
  const converter = loadDrawioPlantUmlEngine();

  const sourceDirectories = [pumlDir, REPORT_PUML_DIR];
  const files = sourceDirectories.flatMap(sourceDir =>
    fs.readdirSync(sourceDir).filter(filename => filename.endsWith('.puml')).map(filename => ({ filename, sourceDir }))
  ).sort((a, b) => a.filename.localeCompare(b.filename));
  console.log(`Found ${files.length} PlantUML source files across the canonical and report view directories`);

  // Extract ID and map
  const items = [];
  const duplicateIds = [];
  const seenIds = new Set();

  for (const file of files) {
    const { filename, sourceDir } = file;
    const m = filename.match(DIAGRAM_ID_PATTERN);
    if (!m) {
      console.warn(`Warning: file does not match ID pattern: ${filename}`);
      continue;
    }
    const id = m[1];
    if (seenIds.has(id)) {
      duplicateIds.push(id);
    }
    seenIds.add(id);
    items.push({ id, filename, fullPath: path.join(sourceDir, filename), sourceDir });
  }

  const activeItems = items.filter(item => shouldIncludeInPrimaryDrawio(item.id));

  // Place report functional views between the actor-oriented UC pages and activities.
  activeItems.sort((a, b) => {
    const groupFor = id => id.startsWith('VIEW-RUC-') ? 'VIEW-RUC' : id.match(/^([A-Z]+)-/)[1];
    const mA = a.id.match(/-(\d+)/);
    const mB = b.id.match(/-(\d+)/);
    const grpA = GROUP_ORDER.indexOf(groupFor(a.id));
    const grpB = GROUP_ORDER.indexOf(groupFor(b.id));
    if (grpA !== grpB) return grpA - grpB;
    const numA = Number(mA[1]);
    const numB = Number(mB[1]);
    return numA - numB || a.id.localeCompare(b.id);
  });

  console.log(`Converting ${activeItems.length} active diagrams from ${items.length} canonical and report sources into native editable draw.io shapes...`);

  const diagramNodes = [];
  let totalNativeCells = 0;

  activeItems.forEach((item, index) => {
    const numStr = String(index + 1).padStart(2, '0');
    const friendly = ID_MAP[item.id] || item.id;
    const pageName = `${numStr} - ${friendly} (${item.id})`;

    // Resolve the shared style once for both native conversion and the editable source payload.
    const { wrappedXml } = convertPumlToXml(item.fullPath, item.sourceDir, converter);

    // Extract <root>...</root> content
    const rootMatch = wrappedXml.match(/<root>([\s\S]*?)<\/root>/);
    if (!rootMatch) {
      throw new Error(`Failed to extract <root> from converted XML for ${item.id}`);
    }
    const rootContent = rootMatch[1];

    // Count cells
    const cellMatches = rootContent.match(/<mxCell\b/g) || [];
    totalNativeCells += cellMatches.length;

    // Calculate dimensions
    const bounds = calculateDiagramBounds(rootContent);

    const diagramXml = `  <diagram id="page-${item.id}" name="${pageName}">
    <mxGraphModel dx="0" dy="0" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${bounds.width}" pageHeight="${bounds.height}" math="0" shadow="0">
      <root>${rootContent}      </root>
    </mxGraphModel>
  </diagram>`;

    diagramNodes.push(diagramXml);
    console.log(`  [${numStr}/${activeItems.length}] Converted ${item.id} -> ${pageName} (${cellMatches.length} native cells)`);
  });

  const nowIso = new Date().toISOString();
  const fileXml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="Electron" modified="${nowIso}" agent="Lingora PlantUML Builder" version="24.7.17" type="device">
${diagramNodes.join('\n')}
</mxfile>
`;

  fs.writeFileSync(outputFile, fileXml, 'utf8');
  console.log('Applying deterministic native-cell layout using local SVG references...');
  applyNativeCellLayout(outputFile);
  const stat = fs.statSync(outputFile);
  console.log(`\nSuccessfully generated: ${outputFile}`);
  console.log(`  - File size: ${(stat.size / 1024).toFixed(1)} KB`);
  console.log(`  - Total pages: ${diagramNodes.length}`);
  console.log(`  - Total native editable cells: ${totalNativeCells}`);
  console.log(`  - Duplicate IDs: ${duplicateIds.length}`);
  console.log(`  - Omitted deferred pages: ${[...OMITTED_PRIMARY_DRAWIO_IDS].join(', ')}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  resolvePumlSource,
  convertPumlToXml,
  loadDrawioPlantUmlEngine,
  applyNativeCellLayout,
  shouldIncludeInPrimaryDrawio,
  DIAGRAM_ID_PATTERN,
};
