"""本期专用离线渲染入口；复用仓库Playwright+Chromium链路和render(t)契约。"""
import argparse,asyncio,functools,http.server,threading,subprocess,json,hashlib,os
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
from playwright.async_api import async_playwright
R=Path(__file__).resolve().parent
for name in ['render','review','delivery']:(R/name).mkdir(exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a):pass
async def capture(port,start,end,output,stills=None):
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--force-color-profile=srgb','--disable-lcd-text'])
  page=await browser.new_page(viewport={'width':1920,'height':1080},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(f'http://127.0.0.1:{port}/index.html');await page.evaluate('document.fonts.ready');await page.evaluate('window.assetsReady');await page.evaluate('window.__RENDER_MODE__=true')
  await page.evaluate('''()=>{for(const b of [4.1,7.9,8,12,16,20,24,31.133333333333,35,43,65,69,74,79,83,90.5,96.4,110]){for(let k=-14;k<=14;k++)window.render(b+k/30)}return true}''')
  print(output,'all transition boundary samples passed',flush=True)
  if stills:
   from PIL import Image,ImageDraw
   paths=[]
   for t in stills:
    await page.evaluate('(t)=>window.render(t)',t)
    f=R/'review'/output/f'{t:06.2f}.png';f.parent.mkdir(parents=True,exist_ok=True);await page.screenshot(path=str(f));paths.append(f)
   im=Image.new('RGB',(1920,288*((len(paths)+3)//4)),(5,8,13));d=ImageDraw.Draw(im)
   for i,f in enumerate(paths):
    im.paste(Image.open(f).resize((480,270)),((i%4)*480,(i//4)*288));d.text(((i%4)*480+8,(i//4)*288+272),f.stem,fill=(201,169,106))
   im.save(R/'review'/output/'sheet.jpg',quality=94)
  else:
   out=R/'render'/output
   cmd=['ffmpeg','-nostdin','-y','-v','error','-f','image2pipe','-framerate','30','-vcodec','mjpeg','-i','-','-an','-c:v','libx264','-preset','fast','-crf','17','-vf','scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709','-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-threads','2','-movflags','+faststart',str(out)]
   proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
   try:
    for i in range(start,end):
     await page.evaluate('(t)=>window.render(t)',i/30)
     frame=await page.screenshot(type='jpeg',quality=97)
     proc.stdin.write(frame)
     if (i-start)%150==0:print(f'{output}: {i-start}/{end-start}',flush=True)
    proc.stdin.close();ret=proc.wait()
    if ret:raise RuntimeError(f'encoder failed {ret}')
   except:
    proc.kill();proc.wait();raise
  if errors:raise RuntimeError('JS errors: '+str(errors))
  tests=await page.evaluate('window.selftest()');print(output,tests,flush=True)
  assert all(t['ok'] for t in tests)
  # 同帧重绘+非顺序seek检查，截图哈希一致。
  await page.evaluate('window.render(71.2)');a=await page.screenshot()
  await page.evaluate('window.render(5)');await page.evaluate('window.render(71.2)');b=await page.screenshot()
  if a!=b:raise RuntimeError('determinism failed')
  print(output,'deterministic screenshot',hashlib.sha256(a).hexdigest(),flush=True)
  await browser.close()
def job(start,end,output,stills=None):
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(R)))
 threading.Thread(target=server.serve_forever,daemon=True).start()
 try:asyncio.run(capture(server.server_port,start,end,output,stills))
 finally:server.shutdown()
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--stills',type=float,nargs='+');ap.add_argument('--review',default='round2');ap.add_argument('--jobs',type=int,default=3);ap.add_argument('--start',type=int);ap.add_argument('--end',type=int);ap.add_argument('--out',default='clip.mp4');args=ap.parse_args()
 if args.stills:job(0,0,args.review,args.stills)
 elif args.start is not None:job(args.start,args.end,args.out)
 else:
  chunks=[(i*3540//args.jobs,(i+1)*3540//args.jobs,f'part_{i:02d}.mp4') for i in range(args.jobs)]
  with ProcessPoolExecutor(max_workers=args.jobs) as pool:
   fs=[pool.submit(job,*chunk) for chunk in chunks]
   for f in fs:f.result()
  concat=R/'render/concat.txt';concat.write_text(''.join(f"file '{n}'\n" for _,_,n in chunks))
  subprocess.run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',str(concat),'-c','copy','-movflags','+faststart',str(R/'render/picture.mp4')],check=True)
