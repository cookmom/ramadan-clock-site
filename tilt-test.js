const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-sandbox', '--use-gl=angle', '--use-angle=gl-egl',
           '--ozone-platform=headless', '--ignore-gpu-blocklist', '--disable-dev-shm-usage',
           '--in-process-gpu', '--enable-webgl'],
    env: {
      ...process.env,
      GALLIUM_DRIVER: 'd3d12',
      MESA_D3D12_DEFAULT_ADAPTER_NAME: 'NVIDIA',
      LD_LIBRARY_PATH: '/usr/lib/wsl/lib:' + (process.env.LD_LIBRARY_PATH || ''),
    },
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });
  await page.goto('http://localhost:8903/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 14000));
  await page.evaluate(() => { if(typeof openClockFullscreen==='function') openClockFullscreen(); });
  await new Promise(r => setTimeout(r, 4000));

  // Center
  await page.mouse.move(215, 466);
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/home/tawfeeq/tilt-center.png', clip: { x: 115, y: 456, width: 200, height: 200 } });

  // Tilt far left
  await page.mouse.move(20, 466);
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: '/home/tawfeeq/tilt-left.png', clip: { x: 115, y: 456, width: 200, height: 200 } });

  // Tilt far right
  await page.mouse.move(410, 466);
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: '/home/tawfeeq/tilt-right.png', clip: { x: 115, y: 456, width: 200, height: 200 } });

  await browser.close();
  console.log('Done');
})();
