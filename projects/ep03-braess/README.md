# 第三期 · 开场修订版 ·《多修一条路，为什么大家反而更堵？》

118秒，1920×1080、30fps，H.264/AAC，无旁白双语字幕。本期复用第二期的画幅、离线字体、色彩、字幕层、指定原曲与BT.709导出链路；内容改为同一张单向路网的变化，未覆盖前两期或重装Skill。

## 交付与源代码

- `delivery/final-v2.mp4`：当前完整修订版（`final.mp4`为当前版复现输出）；旧版在原Git版本和本地`final-v1.mp4`保留。
- `delivery/cover-portrait.png` / `.jpg`：**单独构图**的1080×1920抖音封面，非视频截图；另附1080×1440的`cover-profile.jpg`适配主页裁切。
- `index.html`、`scenes.js`、`timeline.js`：页面、固定节点路网、车辆示意、字幕和卡点。
- `model.py` / `model_checks.json`：精确有理数模型、关键状态及单人偏离检查。
- `script.md`、`storyboard.md`、`research/NOTES.md`：文案、逐镜设计、数字条件与边界。
- `audio/analysis.json`、`beat_map.csv`、`events.json`：同一原件的分析记录及本期时间映射。
- `render_project.py`、`make_audio.py`、`verify_final.py`、`check_audio_alignment.py`：渲染、混音与实际编码检查。
- `review/QUALITY_REPORT.md`：检查结果与未完成的感知检查。

## 复现

在已有仓库根目录使用已准备好的Python环境（Playwright、Pillow、numpy、scipy、FFmpeg和系统Chromium）。完整工程ZIP附带离线字体；Git源码保留生成/复用入口。

```bash
python projects/ep03-braess/model.py
python projects/ep03-braess/make_audio.py
python projects/ep03-braess/render_project.py --jobs 3
ffmpeg -y -i projects/ep03-braess/render/picture.mp4 -i projects/ep03-braess/audio/final_mix.m4a \
  -map 0:v:0 -map 1:a:0 -c copy -t 118 -movflags +faststart \
  projects/ep03-braess/delivery/final.mp4
python projects/ep03-braess/verify_final.py
python projects/ep03-braess/check_audio_alignment.py
python projects/ep03-braess/capture_cover.py
```

浏览器默认`/usr/bin/chromium`，其他本地系统可用`CHROMIUM_PATH`指定已安装浏览器。通过临时loopback HTTP读取工程，渲染结束关闭服务；无外网字体或地图依赖。3路渲染适合本环境4CPU配额，资源不足可用`--jobs 1`。

`prepare.py`记录了从第二期继承字幕层和工具的初始准备步骤；它用于记录初始继承步骤，后续若手工修改本期源码，请先保留修改再决定是否重跑。直接使用本期已交付的`index.html`、`timeline.js`、`scenes.js`、字体和脚本即可。

## 模型与解释

总需求始终4000，SA和BT各用自己的流量除以100，AT和SB固定45，新增AB仅A→B、耗时≈0为理想化假设。检查65、约40、80、85对应条件，详见`research/NOTES.md`。40不是永久不变的新路线成本；关闭后的重排不是实际交通仿真。各节点全片固定，车辆符号每个约代表50辆。

## 素材与音乐清单

- 指定BGM：用户上传`assets/audio/default_bgm/We_Never_Remix_0.9x_开智小曲.mp3`，按用户标注为秋成 / Hi Noise《We Never (Remix)（若如初见）》、开智小曲0.9×。直接使用，不再次减速或变调。
- 原件SHA-256：`dbd4f093fc157373aba99649111e21083c8e8ce94e5073bfebdff160a59a82ca`。本期源0–118秒连续剪辑；3秒淡入，前段低音量缓慢抬起，末3.2秒淡出，无音乐跳切。
- 约111.6 BPM为已保存的算法估计，73.8 BPM为另一节奏层候选；未人工确认拍号和第一重拍。卡点取原件实际起音峰附近，并换算本期时间，不伪报人工试听通过。
- 音效：本期程序生成的柔和路线切换接触声与轻微过渡声，非替代配乐。音轨分开保留。
- 路网、车辆、图例、对比和封面：本期代码绘制；所有关键数字来自给定模型。
- 字体：沿用Noto Sans/Serif CJK、DejaVu Serif Italic，许可证见`fonts/licenses/`。
- 公开工程包不单独分发音乐原件；用户需把自己提供的同一文件放到指定路径。成片已合入指定曲目。当前私有工作区保留完整分轨和原件。

## 检查边界

已检查手机等效390px缩小预览、原尺寸图、迁移片段与最终编码抽帧。没有真实手机设备或真人全片试听，不把算法、截图和解码结果冒充真人感知验收。实际编码、模型核验和工具提示在质量报告逐项说明。

## 本次修订

先交代4000辆车从起点前往终点，再提出增设近路的问题，在8–12秒完整展示本期标题。移除开头缺乏背景的65→80数字，12秒起再讲原路。16秒之后的模型与数字解释画面复用旧版。BGM从原曲开头低音量进入，不再从中段强行切入。旧版成片已另存且原Git提交链接保留，修订版另行交付。
