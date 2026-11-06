# 第四期 · 为什么每组都赢了，合起来却输了？

118秒；1920×1080、30fps，H.264/AAC，中文主字幕与英文对照，无旁白。复用第三期开场修订版的Canvas、离线字体、深色/米白/暖金、64px主字幕、指定原曲低音量渐入，以及BT.709导出链路。本期在独立目录制作，前三期不变。

## 工程与交付

- `delivery/final.mp4`：完整成片，已合入指定BGM及克制音效。
- `delivery/cover-portrait.png` / `.jpg`：1080×1920独立抖音封面；`cover-profile.jpg`：1080×1440主页封面。
- `index.html`、`scenes.js`、`timeline.js`：可编辑页面、分组/合并动画、字幕时轴。
- `model.py`、`records.json` / `records.js`、`model_checks.json`：教学数据、220次独立出手、精确核算证据。
- `script.md`、`storyboard.md`、`research/NOTES.md`：字幕、分镜和解释边界。
- `audio/`：同一原件分析、事件、节拍候选、编辑说明。公开包不分发音乐原件或独立原曲音轨。
- `review/QUALITY_REPORT.md`：最终编码、模型、画面与播放检查结果及边界。
- `PUBLISH.md`：可直接使用的标题、描述与话题。

## 复现

沿用仓库现有环境：Python/Playwright、Pillow、numpy、scipy、FFmpeg和系统Chromium。无需重新安装Skill或重建模板。源码ZIP包含离线字体及许可证。`CHROMIUM_PATH`可指定本地已有浏览器。

```bash
python projects/ep04-simpson/model.py
python projects/ep04-simpson/prepare_timeline.py
python projects/ep04-simpson/make_audio.py
python projects/ep04-simpson/render_project.py --jobs 3
ffmpeg -y -i projects/ep04-simpson/render/picture.mp4 -i projects/ep04-simpson/audio/final_mix.m4a \
  -map 0:v:0 -map 1:a:0 -c copy -t 118 -movflags +faststart \
  projects/ep04-simpson/delivery/final.mp4
python projects/ep04-simpson/verify_final.py
python projects/ep04-simpson/check_audio_alignment.py
python projects/ep04-simpson/run_repo_qa.py
python projects/ep04-simpson/check_browser_playback.py
python projects/ep04-simpson/capture_cover.py
```

`prepare_timeline.py`会按交付脚本重新生成字幕；手工改过字幕时应先保存修改。浏览器通过临时本地HTTP载入离线页面，不依赖外网字体。资源不足可将`--jobs 3`改为`--jobs 1`。

逐帧编码将JPEG全范围BT.601正确转换为BT.709有限范围；分段无损拼接时以`h264_metadata`明确写入BT.709色原、传递函数及矩阵标记，避免浏览器对缺省颜色标记作不同推断。该步不重编码像素。

音乐需将自己提供的合法同一原件放在`assets/audio/default_bgm/We_Never_Remix_0.9x_开智小曲.mp3`；SHA-256为`dbd4f093fc157373aba99649111e21083c8e8ce94e5073bfebdff160a59a82ca`。原件已经0.9×，本期播放速度1.0，不再减速。本期取源0–118秒连续片段，3秒淡入，开头低音量抬升、片尾3.2秒淡出。成片已包含这段指定配乐。

## 模型

每个圆点就是一次出手，实心命中、空心未命中，暖金保留近投来源、灰蓝保留远投来源；A/B身份由固定左右位置与标签区分。A近9/10、远30/100；B近80/100、远2/10。10次确实画10个点，100次画100个点。每人合计110次，同一批220条记录在合并与再分组中没有增删。

合并率按总命中/总出手算：39/110≈35.5%，82/110≈74.5%。分段条宽度直接取10/110和100/110。总率等于各组命中率按各组出手份额加权相加，不是直接平均两个百分比。示意数据不属于真实球员；结论不涉及得分、比赛胜负或真实球技优劣。

## 素材

指定BGM为用户上传原件，按用户标注为秋成 / Hi Noise《We Never (Remix)（若如初见）》、开智小曲0.9×。短音效由本期程序生成的柔和接触与分组摩擦声组成，非替代BGM；画面、球场、圆点与封面均由代码绘制。字体沿用Noto Sans/Serif CJK与DejaVu Serif Italic，许可在`fonts/licenses/`。完整素材清单见`ASSETS.md`。

## 检查边界

使用原尺寸、390px等效手机缩小图、过渡序列、最终MP4抽帧与真实Chromium HTML5播放检查；没有真实手机设备或真人全片试听，不将静音播放器测试、波形与算法结果称作真机或真人感知验收。
