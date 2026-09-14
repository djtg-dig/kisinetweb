import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.js");

const pages = ["/", "/pharmacies", "/pharmacies/PH60A9VC77", "/tarifs"];

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  for (const path of pages) {
    await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle0" });
    await page.addScriptTag({ path: axePath });
    const results = await page.evaluate(async () => {
      // @ts-ignore
      return await window.axe.run();
    });
    console.log(`\n=== ${path} ===`);
    console.log(`Violations: ${results.violations.length}`);
    for (const v of results.violations) {
      console.log(`\n[${v.id}] ${v.impact} - ${v.description}`);
      for (const node of v.nodes.slice(0, 5)) {
        console.log(`  target: ${node.target.join(" > ")}`);
      }
    }
  }

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
