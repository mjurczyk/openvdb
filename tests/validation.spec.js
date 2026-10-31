import fs from 'fs';
import path from 'path';
import jpeg from 'jpeg-js';
import { test, expect } from '@playwright/test';

// NOTE Each scenario is validation-set/<name>.json with its screenshot. Default scenarios drop "-default" from the screenshot name.
// JSON keys are GUI field ids. "demo" is the Example field. "drop" lists asset files for the Custom VDB drop zone.
const validationSetDir = path.join(__dirname, 'validation-set');
const resultsDir = path.join(__dirname, 'results');
const updateValidationSet = !!process.env.UPDATE_VALIDATION_SET;

const jpegQuality = 90;

// NOTE Loose limits. GPU noise and small turns pass. A broken demo, for example an overblown volume, fails.
const channelThreshold = 48;
const maxChangedPixelRatio = 0.01;

const frameTime = 1000 / 60;

// NOTE Overlays are hidden. The status text, FPS counter and GitHub star count change between runs.
const hideOverlays = `
  .lil-gui, #loading, #dropzone, .bottom-tab, body > div[style*="z-index: 10000"] {
    display: none !important;
  }
`;

const scenarios = fs
  .readdirSync(validationSetDir)
  .filter((file) => file.endsWith('.json'))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((file) => {
    const name = path.basename(file, '.json');

    return {
      name,
      config: JSON.parse(fs.readFileSync(path.join(validationSetDir, file), 'utf8')),
      screenshot: path.join(validationSetDir, `${name.replace(/-default$/, '')}.jpg`),
    };
  });

const setFields = (page, fields) =>
  page.evaluate(async (fields) => {
    // NOTE A demo change makes a new GUI, so each field reads the current one
    const guiModule = await import('/src/utils/gui.js');

    Object.entries(fields).forEach(([id, value]) => {
      const controller = guiModule.gui
        .controllersRecursive()
        .find((each) => each.property === id);

      if (!controller) {
        throw new Error(`No GUI field "${id}"`);
      }

      controller.setValue(value);
    });
  }, fields);

const dropFiles = (page, files) =>
  page.evaluate(async (files) => {
    const dropped = [];

    for (const file of files) {
      const blob = await (await fetch(file)).blob();

      dropped.push(new File([blob], file.split('/').pop()));
    }

    // NOTE simple-dropzone reads items with webkitGetAsEntry, which is null for script files. Without items it reads files.
    const event = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'dataTransfer', { value: { files: dropped, items: [] } });

    document.querySelector('#dropzone').dispatchEvent(event);
  }, files);

// NOTE The clock is paused, so zero-delay timeouts run but intervals and frames do not.
// Then animations do not move while assets load, for any load time.
const waitForIdle = async (page, pendingRequests, errors) => {
  let lastState = null;
  let stableSince = Date.now();

  while (Date.now() - stableSince < 1000) {
    await page.clock.runFor(0);
    await page.waitForTimeout(50);

    // NOTE A page error can stop the loading indicator. Then the scenario fails now, not at the timeout.
    expect(errors, 'Page errors').toEqual([]);

    const state = await page.evaluate(() => {
      const loading = document.querySelector('#loading').style.display !== 'none';
      const status = [...document.querySelectorAll('.lil-gui input[disabled]')]
        .map((input) => input.value)
        .join('|');

      return JSON.stringify({ loading, status });
    });
    const idle = !JSON.parse(state).loading && pendingRequests.size === 0;

    if (!idle || state !== lastState) {
      stableSince = Date.now();
    }

    lastState = state;
  }
};

const decode = (buffer) => jpeg.decode(buffer, { useTArray: true });

const countChangedPixels = (actual, expected) => {
  let changed = 0;

  for (let i = 0; i < actual.data.length; i += 4) {
    const difference = Math.max(
      Math.abs(actual.data[i] - expected.data[i]),
      Math.abs(actual.data[i + 1] - expected.data[i + 1]),
      Math.abs(actual.data[i + 2] - expected.data[i + 2]),
    );

    if (difference > channelThreshold) {
      changed++;
    }
  }

  return changed;
};

scenarios.forEach(({ name, config, screenshot }) => {
  test(name, async ({ page }) => {
    expect(config.demo, `No "demo" in ${name}.json`).toBeTruthy();

    const pendingRequests = new Set();
    page.on('request', (request) => pendingRequests.add(request));
    page.on('requestfinished', (request) => pendingRequests.delete(request));
    page.on('requestfailed', (request) => pendingRequests.delete(request));

    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
    await page.goto('/');
    await page.waitForFunction(() => !!document.querySelector('.lil-gui'));

    const { demo, drop, ...fields } = config;

    await setFields(page, { demo, ...fields });

    if (drop) {
      await dropFiles(page, drop);
    }

    await waitForIdle(page, pendingRequests, errors);

    // NOTE Fields that need the loaded volume, for example the animation frame
    if (drop) {
      await setFields(page, fields);
      await waitForIdle(page, pendingRequests, errors);
    }

    // NOTE One frame. More frames give the same image within the threshold.
    await page.clock.runFor(frameTime);
    await page.waitForTimeout(10);

    const actualBuffer = await page.screenshot({
      type: 'jpeg',
      quality: jpegQuality,
      style: hideOverlays,
    });

    expect(errors, 'Page errors').toEqual([]);

    if (updateValidationSet) {
      fs.writeFileSync(screenshot, actualBuffer);

      return;
    }

    expect(
      fs.existsSync(screenshot),
      `No screenshot for ${name}. Run "npm run test:update".`,
    ).toBe(true);

    const actual = decode(actualBuffer);
    const expected = decode(fs.readFileSync(screenshot));

    expect([actual.width, actual.height]).toEqual([expected.width, expected.height]);

    const changedPixelRatio = countChangedPixels(actual, expected) / (actual.width * actual.height);

    if (changedPixelRatio > maxChangedPixelRatio) {
      fs.mkdirSync(resultsDir, { recursive: true });
      fs.writeFileSync(path.join(resultsDir, `${name}-actual.jpg`), actualBuffer);
    }

    expect(changedPixelRatio, `Changed pixel ratio of ${name}`).toBeLessThanOrEqual(
      maxChangedPixelRatio,
    );
  });
});
