// Requires a running dev server at E2E_BASE_URL (default http://localhost:5173).
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const timeoutMs = Number.parseInt(process.env.E2E_TIMEOUT_MS ?? '15000', 10);
const headless = process.env.HEADLESS !== 'false';

const options = new chrome.Options();
if (headless) {
  options.addArguments('--headless=new');
}
options.addArguments('--no-sandbox', '--disable-dev-shm-usage');

let driver;

try {
  driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driver.get(baseUrl);
  await driver.wait(until.elementLocated(By.css('#hero')), timeoutMs);

  const heroHeading = await driver.findElement(By.css('#hero h1'));
  const heroText = (await heroHeading.getText()).trim();
  if (!heroText) {
    throw new Error('Expected hero heading to contain text.');
  }

  const contactSection = await driver.findElement(By.css('#contact'));
  await driver.executeScript('arguments[0].scrollIntoView({block: "center"});', contactSection);

  await driver.wait(until.elementLocated(By.css('#contact form')), timeoutMs);

  const nameInput = await driver.findElement(By.css('#contact input[placeholder="Full Name"]'));
  await nameInput.sendKeys('Test User');

  const emailInput = await driver.findElement(By.css('#contact input[type="email"]'));
  await emailInput.sendKeys('test@example.com');

  const messageInput = await driver.findElement(By.css('#contact textarea'));
  await messageInput.sendKeys('Testing contact form.');

  const submitButton = await driver.findElement(By.css('#contact button[type="submit"]'));
  await submitButton.click();

  await driver.wait(until.elementTextContains(submitButton, 'Sending'), timeoutMs);
  await driver.wait(until.elementTextContains(submitButton, 'Talk to an AI Expert'), timeoutMs);

  console.log('E2E smoke test passed.');
} catch (error) {
  console.error('E2E smoke test failed.');
  console.error(error);
  process.exitCode = 1;
} finally {
  if (driver) {
    await driver.quit();
  }
}
