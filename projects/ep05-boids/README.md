# 第五期 · 没有指挥官，几千只鸟为什么能像一个生命一样转弯？

125秒，1920×1080、30fps，H.264/AAC，无旁白，中文主字幕与英文斜体对照。复用第四期的字体、字幕层、指定原曲、Playwright→FFmpeg导出与检查流程。本期新增真实局部Boids计算与实例化三维鸟体，未改动前四期工程或成片。

## 交付

- `delivery/final.mp4`：完整成片，已合入用户指定0.9× BGM，未再次减速。
- `delivery/cover-portrait.png` / `.jpg`：1080×1920独立抖音封面；`cover-profile.jpg`：1080×1440主页封面。封面直接渲染同一真实模拟状态。
- `delivery/source.zip`：可编辑工程、模拟输入/程序、完整计算回放、字体及许可、分镜、素材与检查记录；不单独分发音乐原件。
- `PUBLISH.md`：标题、描述及话题。
- `review/QUALITY_REPORT.md`：最终检查结果与范围。

## 计算与视觉

`sim/boids.cpp`以60Hz固定步长积分3200个体，使用空间网格查找8.5模型单位内最近的最多16个邻居。三项局部作用为分离、对齐、聚合，速度限制6.5–11.5、加速度上限12、转向上限0.9rad/s。模型单位不对应真实鸟类的米/秒。

环境包含公开的软椭球边界、88秒起加入的局部球形避障。边界会影响群体转向，片中字幕和注释明确说明。没有共享的鸟群目标点、领头个体、路径跟随或强制图案。相机可以跟随群体中心；该中心只用于取景/记录，不进入群集受力。

`sim/replay.bin`是**实际积分后的计算缓存**，不是事先设计每只鸟的轨迹。位置/速度以7.5Hz取样，位置用Hermite插值平滑回放；`sim/focus.bin`保存60Hz的观察个体及其实际邻居原生状态、ID与转向。特写和连线直接读取这些原生记录。预览和最终逐帧导出读同一缓存，`render(t)`与墙钟无关。

`sim/demos.py`是三条规则的独立小实验，不把它们冒充主鸟群的连续个体。分别显示实际排斥加速度、速度方向、排除自身后的局部邻居平均位置。所有画面标记单条规则示意。

`scenes.js`使用本地Three.js r160，实例化绘制立体鸟体/羽翼、透视遮挡、由历史位置产生的青色短轨迹、深度纹理驱动的轻微景深与克制泛光。金色为观察个体；避障段的青蓝变化由实际转向幅度驱动。羽翼动画是外观，不参与质点动力学；Boids不是全鸟体刚体碰撞或真实空气动力学仿真。

## 复现

沿用本仓库已有环境，不重装Skill或重建模板。需要现有Python（numpy、scipy、Pillow、Playwright）、g++、FFmpeg、Chromium。可用`CHROMIUM_PATH`指定本机已有浏览器。完整源码ZIP包含离线字体、Three.js和回放。

```bash
# 仅在修改模拟后重算；当前回放已随工程交付。
g++ -O3 -std=c++17 projects/ep05-boids/sim/boids.cpp -o projects/ep05-boids/sim/boids
projects/ep05-boids/sim/boids projects/ep05-boids/sim
python projects/ep05-boids/sim/demos.py
python projects/ep05-boids/prepare_timeline.py
python projects/ep05-boids/validate_simulation.py
python projects/ep05-boids/make_audio.py
python projects/ep05-boids/render_project.py --jobs 3
ffmpeg -y -i projects/ep05-boids/render/picture.mp4 -i projects/ep05-boids/audio/final_mix.m4a \
  -map 0:v:0 -map 1:a:0 -c copy -t 125 -movflags +faststart \
  projects/ep05-boids/delivery/final.mp4
python projects/ep05-boids/verify_final.py
python projects/ep05-boids/check_audio_alignment.py
python projects/ep05-boids/check_audio_levels.py
python projects/ep05-boids/run_repo_qa.py
python projects/ep05-boids/check_browser_playback.py
python projects/ep05-boids/capture_cover.py
```

需要合法同一音乐原件位于`assets/audio/default_bgm/We_Never_Remix_0.9x_开智小曲.mp3`；当前成片已配好该曲。源包不单独公开原曲。修改字幕后不要盲目重跑`prepare_timeline.py`覆盖手工修改。资源不足可改为`--jobs 1`。

本环境无专用GPU，Chromium以SwiftShader绘制WebGL；逐帧仍按125秒×30fps完整导出。JPEG全范围BT.601转换至BT.709有限范围，拼接时明确写入BT.709色原/传递函数/矩阵标记。视频采用CRF17及5800k VBV上限，兼顾细线与交付文件体积。

## 说明

本片是基于Boids的简化群集演示。真实鸟群还受感知、环境、个体差异等因素影响，三条规则不完整解释所有真实行为。资料及模型边界见`research/NOTES.md`。检查包括图像、模拟连续性、实际MP4解码和浏览器播放，没有真人全片试听或真机验收。
