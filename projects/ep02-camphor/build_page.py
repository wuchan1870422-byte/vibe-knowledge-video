from pathlib import Path
R=Path(__file__).resolve().parent
s=(R/'template.original.html').read_text()
a=s.index("  @import url(");b=s.index('\n',a);s=s[:a]+s[b:]
s=s[:s.index('<script>')]+'''<script src="timeline.js"></script><script src="scenes.js"></script>\n</body></html>'''
s=s.replace('<title>Vibe知识大赏 · 模板</title>','<title>没有发动机，谁在推这艘船？ · 第二期</title>')
s=s.replace('<div id="watermark">@你的名字</div>','')
s=s.replace('<div class="series">VIBE知识大赏</div>','<div class="series">第二期 · 界面上的物理</div>')
s=s.replace('</style>','''
  @font-face {font-family: FilmSans; src:url('fonts/sans.ttc'); font-weight:400;}
  @font-face {font-family: FilmSans; src:url('fonts/sans-bold.ttc'); font-weight:700 900;}
  @font-face {font-family: FilmSerif; src:url('fonts/serif.ttc');}
  @font-face {font-family: FilmItalic; src:url('fonts/latin-italic.ttf');}
  #toplabel {top:65px;font:400 24px FilmSans;letter-spacing:5px;color:#a79d88;}
  #annotation {top:811px;font:400 23px FilmSans;color:#9a978f;letter-spacing:1px;}
  #subtitle {top:906px;font:700 45px FilmSans;color:#ede4d3;letter-spacing:1px;}
  #subtitle-en {top:979px;font:italic 24px FilmItalic;color:#a29d95;letter-spacing:.1px;}
  #titlecard {pointer-events:none;}
  #titlecard .series {font:400 22px FilmSans;letter-spacing:8px;}
  #titlecard .name {font:400 63px FilmSerif;letter-spacing:3px;}
  #titlecard .q {font:400 26px FilmSans;color:#d8cdb6;}
  #titlecard .q-en {font:italic 24px FilmItalic;}
</style>''')
(R/'index.html').write_text(s)
import json
subs=json.loads((R/'subtitles.json').read_text());events=json.loads((R/'audio/events.json').read_text())
(R/'timeline.js').write_text('const SUBTITLES='+json.dumps(subs,ensure_ascii=False)+';\nconst EVENTS='+json.dumps(events)+';\n')
