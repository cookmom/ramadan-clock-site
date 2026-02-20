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

  // Go to fullscreen clock
  await page.goto('http://localhost:8903/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 14000));
  await page.evaluate(() => { if(typeof openClockFullscreen==='function') openClockFullscreen(); });
  await new Promise(r => setTimeout(r, 4000));

  // Get actual subdial position from the Three.js scene
  const info = await page.evaluate(() => {
    const canvas = document.querySelector('.clock-fs-overlay canvas') || document.querySelector('canvas');
    if (!canvas) return { error: 'no canvas' };
    const rect = canvas.getBoundingClientRect();
    return {
      canvasX: rect.x, canvasY: rect.y,
      canvasW: rect.width, canvasH: rect.height,
      vpW: window.innerWidth, vpH: window.innerHeight,
    };
  });
  console.log('Canvas info:', JSON.stringify(info));

  // The clock center is at the center of the viewport in fullscreen
  // Subdial is at Y = center + R*0.5 where R is about 40% of viewport width
  // At 430px wide, clock radius ~180px in CSS, subdial center at ~(215, 466 + 90) = (215, 556) CSS
  // At 2x DPR: (430, 1112)
  // Crop a 400x400 area centered on the subdial
  await page.screenshot({ path: '/home/tawfeeq/lookdev-subdial-crop.png', clip: { x: 115, y: 456, width: 200, height: 200 } });

  // Also get the full clock area for context
  await page.screenshot({ path: '/home/tawfeeq/lookdev-clock-full.png', clip: { x: 15, y: 50, width: 400, height: 850 } });

  await browser.close();
  console.log('Done');
})();
