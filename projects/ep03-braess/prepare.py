"""沿用第二期画幅、离线字体与字幕层；只更新本期内容和字号。"""
from pathlib import Path
import json,shutil
R=Path(__file__).resolve().parent;O=R.parent/'ep02-camphor'
subs=[
[.6,4.1,'多一条近路，反而更堵？','One more shortcut. More congestion?'],
[4.3,7.7,'同样4000辆车，65分钟变80？','The same 4,000 cars: from 65 to 80 minutes?'],
[8.3,11.6,'先看修路之前。','First, before the shortcut.'],
[11.9,15.6,'走这段路的车越多，耗时越长。','More cars on a variable road mean more time.'],
[16,19.4,'上下两条路线，各走2000辆。','Two routes, with 2,000 cars on each.'],
[20,23.5,'上路：20加45，共65分钟。','Upper route: 20 + 45 = 65 minutes.'],
[24,27.5,'下路：45加20，也是65分钟。','Lower route: 45 + 20 = 65 minutes.'],
[27.8,30.8,'换一条路线，并不能更快。','Switching routes gives no time advantage.'],
[32,35.7,'现在，打开一条A到B的近路。','Now open a shortcut from A to B.'],
[36,39.8,'刚开放时，看起来只要约40分钟。','At first, the new route looks like about 40 minutes.'],
[40.2,43.3,'这只是原有车流附近的估算。','That estimate is near the original traffic split.'],
[44,47.5,'越来越多人，改走这条近路。','More and more drivers choose the shortcut.'],
[48,52,'两段路都挤进了更多车辆。','Both variable roads take on more cars.'],
[52.5,56.1,'车越多，两段耗时就越长。','As their loads grow, so do their travel times.'],
[56.6,60.2,'近路仍诱人，大家继续往里走。','The shortcut still looks better to each driver.'],
[61,64.2,'直到4000辆车，全走近路。','Eventually all 4,000 cars use the new route.'],
[65,68.5,'40加0加40，一共80分钟。','40 + 0 + 40 = 80 minutes.'],
[69,73,'一个人改回上路，要85分钟。','One driver switching to the upper route takes 85.'],
[74,78.4,'改回下路，同样要85分钟。','Switching alone to the lower route also takes 85.'],
[79,82.5,'大家都慢了，单独换路却更慢。','Everyone is slower, yet switching alone is worse.'],
[83,86.9,'关掉近路，再让车辆重新分流。','Close the shortcut, then let traffic split again.'],
[87.3,91.1,'各回2000辆，又是65分钟。','Back to 2,000 per route and 65 minutes.'],
[92,96,'多一条路，所有人反而多花15分钟。','With the extra link, everyone loses 15 minutes.'],
[96.4,99.8,'这就是布雷斯悖论。',"This is Braess’s paradox."],
[100.4,104.1,'对自己最快的选择，','The fastest choice for each individual'],
[104.4,109.1,'未必带来对所有人最快的结果。','need not produce the fastest outcome for everyone.'],
[110,113.6,'它只会出现在特定路网和条件下。','It requires particular networks and traffic conditions.'],
[114,117.8,'不代表修路一定会更堵。','It does not mean that road building always makes things worse.'],
]
(R/'subtitles.json').write_text(json.dumps(subs,ensure_ascii=False,indent=2))
(R/'timeline.js').write_text('const DURATION=118;\nconst SUBTITLES='+json.dumps(subs,ensure_ascii=False)+';\nconst EVENTS='+ (R/'audio/events.json').read_text()+';\n')
s=(O/'index.html').read_text().replace('没有发动机，谁在推这艘船？ · 第二期','多修一条路，为什么大家反而更堵？ · 第三期')
s=s.replace('第二期 · 界面上的物理','第三期 · 路网里的选择')
s=s.replace('top:65px;font:400 24px','top:50px;font:400 32px').replace('top:811px;font:400 23px','top:856px;font:400 30px')
s=s.replace('top:906px;font:700 45px','top:912px;font:700 64px').replace('top:979px;font:italic 24px','top:998px;font:italic 32px')
s=s.replace('<div id="titlecard">','<div id="titlecard" style="display:none">')
(R/'index.html').write_text(s)
# 复用已有渲染器，118秒3540帧；边界检查更新为本期真实节点。
s=(O/'render_project.py').read_text().replace('3750','3540').replace('[10,21,30,43,55.6,66,75,81,100,120]','[8,16,20,24,31.133333333333,35,43,65,69,74,79,83,90.5,96.4,110]')

s=s.replace("await page.evaluate('window.render(69.2)')","await page.evaluate('window.render(71.2)')")
(R/'render_project.py').write_text(s)
# 核验器按本期帧数/时长及抽查点更新，检查逻辑保持。
s=(O/'verify_final.py').read_text().replace('3750','3540').replace('-125','-118').replace('==125','==118').replace('[2,8,14,19,25,33,40,47,58,71.8,77,87,97,105,113,122]','[2.5,12.5,18,21.5,25.5,33,38,49,58,66.5,71,76,85,91,98,115]')
s=s.replace("'one_second_samples':len(frames)","'one_second_samples':len(frames)")
(R/'verify_final.py').write_text(s)
# 音频只改取用时长/事件音色，不替换指定原曲。
s=(O/'make_audio.py').read_text().replace('N=125*SR','N=118*SR').replace("'-t','125'","'-t','118'").replace('st=121.8:d=3.2','st=114.8:d=3.2')
start=s.index("for at,g,p in [(events['launch']");end=s.index('wav(R/',start)
s=s[:start]+'''# 克制的道路开启/切换短提示，无发动机轰鸣，不逐字配音。
for name,gain in [('hook',.025),('split',.022),('open',.038),('migrate',.022),('equilibrium',.032),('close',.036),('name',.028)]:
 t=np.arange(int(.22*SR))/SR
 click=(np.sin(2*np.pi*1100*t)+.3*np.sin(2*np.pi*1900*t))*np.exp(-t*33)*np.minimum(t*700,1)
 add(events[name],click,gain,0,'soft route-switch contact')
for at in [31.0,65.0,83.0,96.4]:add(at,wash(.5),.018,0,'subtle transition air')
'''+s[end:]
s=s.replace('source 48–173s','source 55–173s').replace('125秒','118秒')
(R/'make_audio.py').write_text(s)
# 把口头稿与逐镜图表共同保存。
lines=['# 第三期字幕稿','', '118秒；中文主句+英文对照，无旁白。用户给定完整模型并要求直接完成，本期不设置中途确认关卡。','', '| 起止秒 | 中文 | English |','| --- | --- | --- |']
for a,b,zh,en in subs:lines.append(f'| {a}–{b} | {zh} | {en} |')
(R/'script.md').write_text('\n'.join(lines)+'\n')

# Git检出或新机器上也能复用已有字体；完整工程ZIP已含相同原件。
for name in ['render','review','delivery','fonts']:(R/name).mkdir(exist_ok=True)
for name,system in [('sans.ttc','/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'),('sans-bold.ttc','/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'),('serif.ttc','/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc'),('latin-italic.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf')]:
 dst=R/'fonts'/name
 if not dst.exists():
  src=O/'fonts'/name
  if not src.exists():src=Path(system)
  if not src.exists():raise FileNotFoundError('请恢复工程ZIP中的字体：'+name)
  shutil.copy2(src,dst)
