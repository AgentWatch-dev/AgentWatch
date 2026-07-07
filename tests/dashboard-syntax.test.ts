/**
 * Dashboard syntax validation tests.
 *
 * Prevents recurring production outages from:
 * 1. TypeScript type annotations leaking into browser JS (function(b: any))
 * 2. Broken quote escaping in template literals ('' instead of \')
 * 3. Mismatched quotes in onclick/confirm handlers
 *
 * These caused multiple outages where the dashboard showed "--" values
 * and tabs/buttons stopped working.
 */

import { describe, it, expect } from "vitest";
import { dashboardHtml } from "../src/dashboard";

describe("Dashboard HTML syntax validation", () => {
  it("should not contain TypeScript type annotations in inline scripts", () => {
    const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
    let match;
    let scriptIndex = 0;

    while ((match = scriptRegex.exec(dashboardHtml)) !== null) {
      scriptIndex++;
      const script = match[1];

      // Check for TypeScript type annotations in function parameters
      const tsParamAnnotation = /function\s*\([^)]*:\s*(?:any|string|number|boolean|unknown|object|void|never|null|undefined)\b/g;
      const tsMatches = script.match(tsParamAnnotation);

      if (tsMatches) {
        throw new Error(
          `Script #${scriptIndex} has TypeScript annotations (causes "Unexpected token ':'"):\n` +
          tsMatches.map(m => `  "${m}"`).join("\n")
        );
      }

      // Check for empty catch blocks (causes syntax error in older browsers)
      const emptyCatches = script.match(/catch\s*\{\s*\}/g);
      if (emptyCatches) {
        throw new Error(
          `Script #${scriptIndex} has empty catch blocks (causes syntax error in older browsers):\n` +
          `  Use "catch (e) {}" instead of "catch {}"`
        );
      }
    }

    expect(scriptIndex).toBeGreaterThan(0);
  });

  it("should not contain broken single-quote escaping in template literals", () => {
    const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
    let match;
    let scriptIndex = 0;

    while ((match = scriptRegex.exec(dashboardHtml)) !== null) {
      scriptIndex++;
      const script = match[1];

      // Pattern: '' + variable + '' — this is broken, should be \' + var + \'
      // In template literals, \' becomes just ' (no backslash), producing ''
      const brokenQuotes = script.match(/'' \+ \w+(\.\w+)* \+ ''/g);
      if (brokenQuotes) {
        throw new Error(
          `Script #${scriptIndex} has broken quote escaping (causes "missing ) after argument list"):\n` +
          brokenQuotes.map(m => `  "${m}"`).join("\n") +
          `\nFix: use \\' in template literal to produce \\' in output`
        );
      }

      // Pattern: confirm('...' + var + '...') where the quotes are doubled
      const brokenConfirm = script.match(/confirm\('[^']*(?:''[^']*)+'\)/g);
      if (brokenConfirm) {
        throw new Error(
          `Script #${scriptIndex} has broken confirm() quoting:\n` +
          brokenConfirm.map(m => `  "${m}"`).join("\n")
        );
      }
    }
  });

  it("should not contain TypeScript interface or type declarations in scripts", () => {
    const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
    let match;

    while ((match = scriptRegex.exec(dashboardHtml)) !== null) {
      const script = match[1];
      const tsDecl = script.match(/\b(interface|type)\s+\w+\s*[={]/g);
      if (tsDecl) {
        throw new Error(`Script contains TypeScript declarations: ${tsDecl.join(", ")}`);
      }
    }
  });

  it("should not contain broken quote patterns in onclick/confirm handlers", () => {
    const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
    let match;

    while ((match = scriptRegex.exec(dashboardHtml)) !== null) {
      const script = match[1];

      // Detect the specific broken pattern: '' + variable + ''
      // This means the template literal \' became just ' producing ''
      const brokenPattern = /'' \+ \w+(\.\w+)* \+ ''/g;
      const broken = script.match(brokenPattern);
      if (broken) {
        throw new Error(
          `Broken quote pattern found (causes syntax error):\n` +
          broken.map(m => `  "${m}"`).join("\n") +
          `\nUse \\' in template literal to produce \\' in output`
        );
      }
    }
  });

  it("should contain required dashboard DOM elements", () => {
    const requiredIds = [
      "statCost",
      "statRequests",
      "statSessions",
      "statErrors",
      "sessionsBody",
      "budgetModal",
    ];

    for (const id of requiredIds) {
      expect(dashboardHtml).toContain(`id="${id}"`);
    }
  });

  it("should contain required JavaScript functions", () => {
    const requiredFunctions = [
      "window.saveTeamBudget",
      "window.generateKey",
      "window.createPolicy",
      "window.deletePolicy",
    ];

    for (const fn of requiredFunctions) {
      expect(dashboardHtml).toContain(fn);
    }
  });

  it("should not reference undefined DOM elements in core dashboard JS", () => {
    // Extract all element IDs defined in the HTML (outside <script> tags)
    const htmlWithoutScripts = dashboardHtml.replace(/<script>[\s\S]*?<\/script>/g, "");
    const definedIds = new Set<string>();
    const idRegex = /id="(\w+)"/g;
    let idMatch;
    while ((idMatch = idRegex.exec(htmlWithoutScripts)) !== null) {
      definedIds.add(idMatch[1]);
    }

    // Core elements that must exist — these are used by main dashboard functions
    // without null guards and would cause runtime errors if missing
    const coreUnguardedIds = [
      "statCost", "statRequests", "statSessions", "statErrors",
      "sessionsBody", "lastUpdated", "currentSectionTitle",
      "policiesBody", "settingsStatus",
    ];

    for (const id of coreUnguardedIds) {
      expect(definedIds).toContain(id);
    }
  });
});
