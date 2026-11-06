# 音频与素材清单

|素材|来源与处理|位置|
|---|---|---|
|主BGM|用户上传；按用户标注为秋成 / Hi Noise《We Never (Remix)（若如初见）》、开智小曲0.9×；原件直接使用，源0–118秒，不再减速|仓库`assets/audio/default_bgm/We_Never_Remix_0.9x_开智小曲.mp3`|
|BGM编辑分轨|上述原件连续裁剪、渐入渐出、开头增益包络|`audio/bgm_edit.wav`（工作区/私有分轨包）|
|短音效|本期`make_audio.py`确定性合成的轻微接触与分组声，无第二主旋律|`audio/sfx.wav`（工作区/分轨包）|
|总混音|固定曲目+克制音效；恒定增益保留低音量开头|`audio/final_mix.wav` / `.m4a`；MP4已内嵌AAC|
|投篮示意数据|用户给定教学构造数据，不是真实球员记录|`model.py`、`records.json`|
|画面和封面|本期Canvas代码绘制，无外部图片/模型/视频|`scenes.js`|
|中日文字体集合|沿用上期Noto Sans CJK Regular/Bold及Noto Serif CJK；原集合不改|`fonts/sans.ttc`、`sans-bold.ttc`、`serif.ttc`|
|英文斜体|沿用DejaVu Serif Italic|`fonts/latin-italic.ttf`|
|字体许可|随工程保留|`fonts/licenses/`|

原始音乐SHA-256：`dbd4f093fc157373aba99649111e21083c8e8ce94e5073bfebdff160a59a82ca`。文件7,311,321字节；MP3单声道44.1kHz，时长约182.72秒。混音48kHz双声道。

公开源码ZIP含字体与许可证，不单独公开音乐原件/原曲分轨。公开MP4已按用户要求合入指定音乐；私人工作区保留带用户原件的完整源包及音轨包。合法取得用于制作的原件，不等于另行授权公开分发原曲。
