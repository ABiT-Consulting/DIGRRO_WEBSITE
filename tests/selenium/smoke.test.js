import webdriver from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

const { Builder, By, until } = webdriver;

const baseUrl = process.env.SELENIUM_BASE_URL ?? 'http://localhost:5173';
const headless = ['1', 'true', 'yes'].includes(
  (process.env.SELENIUM_HEADLESS ?? '').toLowerCase(),
);
const rawTimeout = Number.parseInt(
  process.env.SELENIUM_TIMEOUT_MS ?? '20000',
  10,
);
const timeoutMs = Number.isNaN(rawTimeout) ? 20000 : rawTimeout;

const options = new chrome.Options();
if (headless) {
  options.addArguments('headless=new');
}
options.addArguments('window-size=1400,900');

let driver;

const waitFor = (condition, message) => driver.wait(condition, timeoutMs, message);

try {
  driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driver.get(baseUrl);

  await waitFor(until.elementLocated(By.css('#hero')), 'Hero section not found.');
  const heroText = await driver.findElement(By.css('#hero h1')).getText();
  if (!heroText.includes('AI-Powered')) {
    throw new Error(`Unexpected hero heading: ${heroText}`);
  }

  await driver.findElement(By.css('#hero a[href="#contact"]')).click();
  await waitFor(until.elementLocated(By.css('#contact form')), 'Contact form not found.');

  await driver.findElement(By.css('#contact input[placeholder="Full Name"]')).sendKeys('Test User');
  await driver
    .findElement(By.css('#contact input[placeholder="Email Address"]'))
    .sendKeys('test@example.com');
  await driver.findElement(By.css('#contact input[placeholder="Company Name"]')).sendKeys('Digrro QA');
  await driver
    .findElement(By.css('#contact textarea[placeholder="Tell us about your project"]'))
    .sendKeys('Selenium smoke test.');

  await driver.findElement(By.css('#contact button[type="submit"]')).click();

  await waitFor(
    until.elementLocated(By.xpath("//button[contains(., 'Sending...')]")),
    'Submit state did not appear.',
  );
  await waitFor(
    until.elementLocated(By.xpath("//button[contains(., 'Talk to an AI Expert')]")),
    'Submit state did not reset.',
  );
} catch (error) {
  console.error('Selenium smoke test failed.');
  console.error(error);
  process.exitCode = 1;
} finally {
  if (driver) {
    await driver.quit();
  }
}
