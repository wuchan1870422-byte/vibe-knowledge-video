"""真实HTML5视频播放与跨段seek检查；静音自动播放不等于人工试听。"""
import asyncio,functools,http.server,threading,json,os,re
from pathlib import Path
from playwright.async_api import async_playwright
R=Path(__file__).resolve().parent
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
 def end_headers(self):
  self.send_header('Accept-Ranges','bytes');super().end_headers()
 def send_head(self):
  self._byte_range=None
  path=self.translate_path(self.path)
  request=self.headers.get('Range')
  if request and Path(path).is_file():
   size=Path(path).stat().st_size;m=re.fullmatch(r'bytes=(\d+)-(\d*)',request)
   if m:
    start=int(m[1]);end=min(int(m[2]) if m[2] else size-1,size-1)
    if start> end:self.send_error(416);return None
    file=open(path,'rb');file.seek(start);self._byte_range=(start,end)
    self.send_response(206);self.send_header('Content-Type',self.guess_type(path));self.send_header('Content-Length',str(end-start+1));self.send_header('Content-Range',f'bytes {start}-{end}/{size}');self.end_headers();return file
  return super().send_head()
 def copyfile(self,source,output):
  try:
   if self._byte_range:
    left=self._byte_range[1]-self._byte_range[0]+1
    while left:
     data=source.read(min(left,65536))
     if not data:break
     output.write(data);left-=len(data)
   else:super().copyfile(source,output)
  except (BrokenPipeError,ConnectionResetError):pass
async def main(port):
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'))
  page=await b.new_page(viewport={'width':1920,'height':1200})
  await page.goto(f'http://127.0.0.1:{port}/player.html')
  await page.evaluate('''async()=>{const v=document.querySelector('video');v.muted=true;await v.play()}''')
  await page.wait_for_function("document.querySelector('video').currentTime>0.6")
  initial=await page.evaluate("(()=>{const v=document.querySelector('video');return {duration:v.duration,width:v.videoWidth,height:v.videoHeight,played_to:v.currentTime,readyState:v.readyState,error:v.error?.message||null}})()")
  assert initial['width']==1920 and initial['height']==1080 and abs(initial['duration']-118)<.1
  assert initial['error'] is None
  seeks=[]
  for t in [2,11,26,53,66,85,99,114]:
   meta=await page.evaluate('''async(t)=>{const v=document.querySelector('video');v.pause();await new Promise((resolve,reject)=>{v.addEventListener('seeked',resolve,{once:true});v.addEventListener('error',reject,{once:true});v.currentTime=t});return {time:v.currentTime,readyState:v.readyState}}''',t)
   await page.locator('video').screenshot(path=str(R/'review'/f'player-{t}.jpg'))
   assert abs(meta['time']-t)<.05,(t,meta)
   seeks.append(meta)
  report={'html5_playback':'passed','initial':initial,'seeks':seeks,'muted':True,'human_listening_verified':False}
  (R/'review/browser-playback.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2));await b.close()
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(R)))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:asyncio.run(main(server.server_port))
finally:server.shutdown()
