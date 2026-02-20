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

  // Landing page
  await page.goto('http://localhost:8903/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 14000)); // Three.js + HDRI load
  await page.screenshot({ path: '/home/tawfeeq/lookdev-landing.png' });

  // Check GPU renderer
  const renderer = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return 'NO CANVAS';
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return 'NO WEBGL';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'no ext';
  });
  console.log('GPU:', renderer);

  // Fullscreen
  await page.evaluate(() => {
    if (typeof openClockFullscreen === 'function') openClockFullscreen();
  });
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: '/home/tawfeeq/lookdev-fullscreen.png' });

  // Subdial crop (fullscreen) — subdial at 6 o'clock, center-bottom
  // Clock center approx (430, 932) at 2x DPR = (860, 1864) pixel space
  // Subdial at ~6 o'clock = below center, center-x
  // In fullscreen, clock fills screen, center at (430, ~850)
  // Subdial at Y = center + R*0.5 = 850 + R*0.5
  // At 2x: subdial center roughly (430, 1100-1200)
  await page.screenshot({ path: '/home/tawfeeq/lookdev-subdial.png', clip: { x: 280, y: 1050, width: 300, height: 300 } });

  // Tilt left simulation
  await page.evaluate(() => {
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 466 }));
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/home/tawfeeq/lookdev-tilt-left.png' });

  // Tilt right simulation
  await page.evaluate(() => {
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 380, clientY: 466 }));
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/home/tawfeeq/lookdev-tilt-right.png' });

  await browser.close();
  console.log('Done');
})();
