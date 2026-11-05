"""准备字幕、分镜、事件卡点与离线字体。"""
from pathlib import Path
import json,csv,shutil
R=Path(__file__).resolve().parent
# 连续使用源文件48–173秒；不变速，避开额外转码拼接。
a=json.loads((R/'audio/analysis.json').read_text());a['source_in_s']=48;a['source_out_s']=173
for v in a['energy_sections']:v['video_start_s']=v['start_s']-48
a['rms_loudest_video_second']=a['rms_loudest_second']-48
(R/'audio/analysis.json').write_text(json.dumps(a,ensure_ascii=False,indent=2))
rows=list(csv.DictReader((R/'audio/beat_map.csv').open()))
for row in rows:
 row['video_time_s']=float(row['source_time_s'])-48;row['frame']=round(row['video_time_s']*30)
with (R/'audio/beat_map.csv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=rows[0].keys());w.writeheader();w.writerows(rows)
events={}
for name,target in [('launch',7.1),('release',21.8),('field',31.1),('marangoni',55.8),('accelerate',75.3),('energy',108.5)]:
 choices=[r for r in rows if abs(float(r['video_time_s'])-target)<.4 and float(r['strength'])>0]
 r=max(choices,key=lambda r:float(r['strength'])) if choices else {'video_time_s':target,'strength':0}
 events[name]=round(float(r['video_time_s'])*30)/30
(R/'audio/events.json').write_text(json.dumps(events,indent=2));print('events',events)
subs=[
(0.7,3.5,'没有风。没有发动机。','No wind. No engine.'),
(3.8,6.7,'也没有人推它。','And no one is pushing.'),
(7.1,10.0,'没有发动机，谁在推它？','No engine. What moves this boat?'),
(10.5,14,'答案，藏在船尾。','The answer is at the stern.'),
(14.3,18.0,'一小块樟脑，接触着水。','A small piece of camphor touches the water.'),
(21.0,25.0,'分子不断释放，进入水与界面。','Molecules enter the water and its surface.'),
(25.3,29.3,'随机运动，把分子扩散开。','Random motion spreads them by diffusion.'),
(30.1,34.2,'船尾附近，樟脑分子更多。','More camphor accumulates near the stern.'),
(34.5,38.8,'这些分子改变了界面自由能。','These molecules change the interfacial free energy.'),
(39.1,43.1,'在这里，水面的张力降低。','Here, the surface tension falls.'),
(43.4,47.5,'前方较高，后方较低。','Higher ahead. Lower behind.'),
(48.0,52.2,'差异沿水面分布，形成梯度。','A variation along the surface creates a gradient.'),
(52.5,55.4,'它既有大小，也有方向。','The gradient has both magnitude and direction.'),
(57.0,61.0,'水面从低张力处流向高张力处。','The surface flows from low to high tension.'),
(61.4,65.5,'这就是马兰戈尼效应。','This is the Marangoni effect.'),
(66.0,70.0,'但水的流向，不等于船的受力。','Water flow and force on the boat are different.'),
(70.4,74.5,'前后张力不对称，产生向前合力。','Unequal tension creates a forward resultant.'),
(75.0,79.5,'合力与水动力，共同决定运动。','Capillary and hydrodynamic forces set the motion.'),
(81,85,'樟脑的储量，却是有限的。','The supply of camphor is finite.'),
(85.4,89.4,'释放减弱，前后差异逐渐缩小。','As release weakens, the difference fades.'),
(89.8,93.8,'驱动变弱，阻力让小船减速。','Less drive. Drag slows the boat.'),
(94.2,98.5,'供给耗尽，运动最终停下。','When the supply runs out, motion dies away.'),
(100,103.5,'它没有发动机。','It has no engine.'),
(104,107.5,'但它并非没有能量来源。','But it does have an energy source.'),
(108,111.8,'樟脑释放，消耗化学自由能。','Camphor release spends chemical free energy.'),
(112.1,115.8,'维持不均匀，也在持续耗散。','Maintaining the gradient also dissipates energy.'),
(116.1,119.5,'这是非平衡系统，不是永动机。','A nonequilibrium system, not perpetual motion.'),
(120,124.6,'真正驱动它的，是水面上微小的不均匀。','What moves it is a tiny imbalance at the surface.'),
]
(R/'subtitles.json').write_text(json.dumps(subs,ensure_ascii=False,indent=2))
text='# 第二期字幕稿\n\n《没有发动机，谁在推这艘船？》 · 125秒 · 无旁白\n\n用户已明确授权自主制作，不等待中途确认。\n\n| 起止秒 | 中文 | English |\n| --- | --- | --- |\n'
for s,e,z,en in subs:text+=f'| {s:.1f}–{e:.1f} | {z} | {en} |\n'
(R/'script.md').write_text(text)
shots=[(0,10,'静水与启动','俯视金色船体、柔和折射与细波；船在实测起音附近启动','让观众动手','无外部机械驱动也有可见运动'),(10,21,'尾部推近与片名','镜头推进船尾白色樟脑晶体；18–21秒显示完整片名','照句子演','樟脑位于船尾且接触水'),(21,30,'分子释放与扩散','晶体边缘放大；固定种子随机游走路径展开，部分分子向水内消散','小题现场跑','随机扩散不同于定向水流'),(30,43,'浓度与张力','真实计算的解析示意浓度场、等浓度线与局部样本；转为γ(c)关系曲线','收进一张图','浓度改变界面自由能和局部表面张力'),(43,55.6,'前后梯度','船头/船尾两个采样区以相同标尺比较张力；梯度曲线从船尾指向船头','同版式对照','差值与沿界面方向的空间变化'),(55.6,66,'马兰戈尼流','低张力源周围朝高张力方向的虚线流迹；术语落版','照句子演','界面流由张力梯度驱动'),(66,75,'流与力分开','灰蓝流线退后；金色接触线力，前方长后方短，白色净力箭头独立','同版式对照','流动箭头与船体净力不是同一物理量'),(75,81,'运动回场','镜头拉远，小船向前；推进与阻力箭头先显示后淡出','回场','驱动力和流体作用共同决定运动'),(81,100,'供给衰减','储量晶体缩小，释放/梯度/速度三个示意量同步衰减，小船减速','小题现场跑','有限供给不能无限维持驱动；过程时间压缩'),(100,108,'系统拉远','船、水和空气纳入同一系统；保留可读留白','停住亮字','系统有内部物质与能量来源'),(108,120,'自由能耗散','樟脑→界面梯度→运动→耗散；有限能量粒子沿路径转移，不闭合循环','合体','非平衡供给消耗自由能，不是永动机'),(120,125,'回扣与出处','静水小船回场；两条文献和示意声明；结论落在音乐尾段','停住亮字','微小的不均匀需要能量维持')]
s='# 分镜与声画编排\n\n核心形象：同一艘尾置樟脑的小船。金色=分子/浓度/接触线力；灰蓝虚线=水面流动；米白粗箭头=净驱动。全部模型均示意，不展示伪造实测量值。\n\n| 时间 | 镜头 | 画面与动作 | 呈现动作 | 观众明白什么 |\n| --- | --- | --- | --- | --- |\n'
for a,b,title,vis,typ,meaning in shots:s+=f'| {a}–{b} | {title} | {vis} | {typ} | {meaning} |\n'
s+='\n## 音乐关键事件\n\n原件从48秒取连续125秒，不再减速。以下影片时刻按邻近的实测起音候选选取，不宣称已人工听辨拍号或首重拍：\n\n'+json.dumps(events,ensure_ascii=False,indent=2)+'\n\n字幕逐行见 script.md，源音频拍点与帧号见 audio/beat_map.csv。只对关键动作卡点，字幕阅读时间优先。\n'
(R/'storyboard.md').write_text(s)
(R/'fonts').mkdir(exist_ok=True)
for src,name in [('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','sans.ttc'),('/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc','serif.ttc'),('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc','sans-bold.ttc'),('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf','latin-italic.ttf')]:shutil.copy2(src,R/'fonts'/name)
# 模板作为起点，后续保留render(t)和预览接管契约。
shutil.copy2(R.parents[1]/'assets/template.html',R/'template.original.html')
