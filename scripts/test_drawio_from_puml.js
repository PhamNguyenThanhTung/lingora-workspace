"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function loadBuilderWithoutBuildSideEffects() {
  const sourceDir = path.resolve(__dirname, "..", "docs", "modeling", "current-target", "src");
  const outputFile = path.resolve(__dirname, "..", "docs", "modeling", "current-target", "lingora-all-diagrams.drawio");
  const originalReadDir = fs.readdirSync;
  const originalWriteFile = fs.writeFileSync;
  fs.readdirSync = function (directory, ...args) {
    if (path.resolve(directory) === sourceDir) return [];
    return originalReadDir.call(fs, directory, ...args);
  };
  fs.writeFileSync = function (file, ...args) {
    if (path.resolve(file) === outputFile) return;
    return originalWriteFile.call(fs, file, ...args);
  };
  try {
    return require("./build_drawio_from_puml.js");
  } finally {
    fs.readdirSync = originalReadDir;
    fs.writeFileSync = originalWriteFile;
  }
}

const builder = loadBuilderWithoutBuildSideEffects();

function withSourceFixture(source, callback) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lingora-puml-"));
  const targetRoot = path.join(tempRoot, "current-target");
  const sourceDir = path.join(targetRoot, "src");
  fs.mkdirSync(sourceDir, { recursive: true });
  const sourcePath = path.join(sourceDir, "UC-01-sample.puml");
  fs.writeFileSync(sourcePath, source, "utf8");
  try {
    callback({ targetRoot, sourceDir, sourcePath });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function testResolvesOnlyTheSharedStyleInclude() {
  assert.equal(typeof builder.resolvePumlSource, "function", "builder must export its safe resolver");
  withSourceFixture("@startuml\n!include ../style.puml\nAlice --> Bob\n@enduml\n", ({ targetRoot, sourceDir, sourcePath }) => {
    fs.writeFileSync(
      path.join(targetRoot, "style.puml"),
      "@startuml\nskinparam shadowing false\n@enduml\n",
      "utf8",
    );
    const resolved = builder.resolvePumlSource(sourcePath, sourceDir);
    assert.equal(resolved.rawSource, "@startuml\n!include ../style.puml\nAlice --> Bob\n@enduml\n");
    assert.equal(resolved.expandedSource, "@startuml\nskinparam shadowing false\nAlice --> Bob\n@enduml\n");
  });
}

function testRejectsAnyOtherIncludeWithFileAndDirective() {
  assert.equal(typeof builder.resolvePumlSource, "function", "builder must export its safe resolver");
  for (const directive of ["!include ../outside.puml", "!include C:/private/style.puml"]) {
    withSourceFixture(`@startuml\n${directive}\nAlice --> Bob\n@enduml\n`, ({ sourceDir, sourcePath }) => {
      assert.throws(
        () => builder.resolvePumlSource(sourcePath, sourceDir),
        (error) => error.message.includes("UC-01-sample.puml") && error.message.includes(directive),
      );
    });
  }
}

function testWorksWithoutAnInclude() {
  assert.equal(typeof builder.resolvePumlSource, "function", "builder must export its safe resolver");
  withSourceFixture("@startuml\nAlice --> Bob\n@enduml\n", ({ sourceDir, sourcePath }) => {
    const resolved = builder.resolvePumlSource(sourcePath, sourceDir);
    assert.equal(resolved.expandedSource, resolved.rawSource);
  });
}

function testOmitsDeferredAct05FromThePrimaryDrawioSet() {
  assert.equal(typeof builder.shouldIncludeInPrimaryDrawio, "function", "builder must expose its active page filter");
  assert.equal(builder.shouldIncludeInPrimaryDrawio("ACT-05"), false);
  assert.equal(builder.shouldIncludeInPrimaryDrawio("ACT-04"), true);
  assert.equal(builder.shouldIncludeInPrimaryDrawio("ACT-06"), true);
}

function testNormalizesWindowsLineEndingsAroundSharedStyle() {
  assert.equal(typeof builder.resolvePumlSource, "function", "builder must export its safe resolver");
  withSourceFixture("@startuml\r\n!include ../style.puml\r\nAlice --> Bob\r\n@enduml\r\n", ({ targetRoot, sourceDir, sourcePath }) => {
    fs.writeFileSync(
      path.join(targetRoot, "style.puml"),
      "@startuml\r\nskinparam shadowing false\r\n@enduml\r\n",
      "utf8",
    );
    const resolved = builder.resolvePumlSource(sourcePath, sourceDir);
    assert.equal(
      resolved.expandedSource,
      "@startuml\nskinparam shadowing false\nAlice --> Bob\n@enduml\n",
    );
  });
}

function testResolvesReportViewsWithTheirSharedCurrentTargetStyle() {
  assert.equal(typeof builder.resolvePumlSource, "function", "builder must export its safe resolver");
  const reportDir = path.resolve(__dirname, "..", "docs", "modeling", "report-usecases");
  const sourcePath = path.join(reportDir, "VIEW-RUC-01-auth-profile.puml");
  const resolved = builder.resolvePumlSource(sourcePath, reportDir);
  assert.equal(resolved.rawSource.includes("!include ../current-target/style.puml"), true);
  assert.equal(resolved.expandedSource.includes("!include"), false);
  assert.equal(resolved.expandedSource.includes("skinparam"), true);
}

function testConvertsFourNotationTypesWithStandaloneEditableSource() {
  assert.equal(typeof builder.convertPumlToXml, "function", "builder must convert resolved source to native draw.io XML");
  const converter = builder.loadDrawioPlantUmlEngine();
  const sourceDir = path.resolve(__dirname, "..", "docs", "modeling", "current-target", "src");
  const representatives = ["UC-01", "ACT-03", "SEQ-01", "DATA-03"];
  for (const diagramId of representatives) {
    const filename = fs.readdirSync(sourceDir).find(name => name.startsWith(`${diagramId}-`) && name.endsWith(".puml"));
    assert.ok(filename, `missing canonical representative ${diagramId}`);
    const converted = builder.convertPumlToXml(path.join(sourceDir, filename), sourceDir, converter);
    assert.ok(converted.wrappedXml.match(/<mxCell\b/g)?.length > 2, `${diagramId} did not create native cells`);
    assert.ok(converted.wrappedXml.includes("plantUmlData="), `${diagramId} lost its source edit payload`);
    assert.equal(converted.expandedSource.includes("!include"), false, `${diagramId} payload is not self-contained`);
    const encodedPayload = /plantUmlData="([\s\S]*?)"/.exec(converted.wrappedXml)?.[1];
    assert.ok(encodedPayload, `${diagramId} has no PlantUML edit data`);
    const jsonText = encodedPayload
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
      .replace(/&#x([\da-f]+);/gi, (_match, code) => String.fromCodePoint(parseInt(code, 16)))
      .replace(/&amp;/g, "&");
    assert.equal(JSON.parse(jsonText).data, converted.expandedSource, `${diagramId} edit payload differs from converted source`);
  }
}

const tests = [
  testResolvesOnlyTheSharedStyleInclude,
  testRejectsAnyOtherIncludeWithFileAndDirective,
  testWorksWithoutAnInclude,
  testOmitsDeferredAct05FromThePrimaryDrawioSet,
  testNormalizesWindowsLineEndingsAroundSharedStyle,
  testResolvesReportViewsWithTheirSharedCurrentTargetStyle,
  testConvertsFourNotationTypesWithStandaloneEditableSource,
];
let failures = 0;
for (const test of tests) {
  try {
    test();
    process.stdout.write(`PASS ${test.name}\n`);
  } catch (error) {
    failures += 1;
    process.stderr.write(`FAIL ${test.name}: ${error.message}\n`);
  }
}
process.stdout.write(`${tests.length - failures}/${tests.length} resolver tests passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
