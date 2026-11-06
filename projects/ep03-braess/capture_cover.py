"""独立封面构图，不截取视频帧，不改动视频。"""
import asyncio,functools,http.server,threading,os
from pathlib import Path
from playwright.async_api import async_playwright
R=Path(__file__).resolve().parent
(R/'delivery').mkdir(exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
async def main(port):
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'))
  page=await b.new_page(viewport={'width':1080,'height':1920},device_scale_factor=1)
  await page.goto(f'http://127.0.0.1:{port}/index.html');await page.evaluate('window.__RENDER_MODE__=true');await page.evaluate('document.fonts.ready');await page.evaluate('window.renderCover()')
  await page.screenshot(path=str(R/'delivery/cover-portrait.png'))
  await page.screenshot(path=str(R/'delivery/cover-portrait.jpg'),type='jpeg',quality=97)
  await page.set_viewport_size({'width':1080,'height':1440})
  await page.evaluate('window.renderCover(1440)')
  await page.screenshot(path=str(R/'delivery/cover-profile.jpg'),type='jpeg',quality=97)
  await b.close()
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(R)))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:asyncio.run(main(server.server_port))
finally:server.shutdown()
