# 第二期 ·《没有发动机，谁在推这艘船？》

125秒 · 1920×1080 · 30fps · H.264/AAC · 无旁白双语字幕。

## 文件与复现

本项目在已有仓库 `assets/template.html` 的分层Canvas骨架上实现，没有重装Skill。用户已明确授权不等待中途确认。所有文件独立于已有项目，未覆盖第一期或其他成片。

- `index.html` / `scenes.js` / `timeline.js`：页面、确定性动画与字幕/音乐事件。
- `script.md` / `storyboard.md` / `subtitles.json`：文案和分镜。
- `research/NOTES.md`：科学依据、文献访问限制、模型边界和数字来源。
- `analyze_audio.py` / `prepare_project.py` / `prepare_water.py` / `build_page.py`：可重复的分析与素材生成。
- `render_project.py`：系统Chromium通过本地HTTP离线读取项目；渲染结束停止服务，不依赖file://或外网字体。
- `make_audio.py`：原曲连续剪辑、原创短音效、独立分轨与两遍响度归一；没有合成替代BGM。
- `audio/analysis.json` / `beat_map.csv` / `events.json`：原曲哈希、起音/节拍候选、卡点。
- `audio/bgm_edit.wav` / `sfx.wav` / `final_mix.wav`：125秒独立分轨与总混音。
- `render/picture.mp4`：独立无声画面，可以直接重新合入音轨。
- `delivery/final.mp4`：最终可播放成片。
- `review/QUALITY_REPORT.md`：实际完成的检查和未完成的感知检查。

在仓库根目录使用已经准备好的Python环境（需numpy、scipy、Pillow、Playwright、FFmpeg）：

```bash
python projects/ep02-camphor/analyze_audio.py
python projects/ep02-camphor/prepare_project.py
python projects/ep02-camphor/prepare_water.py
python projects/ep02-camphor/build_page.py
python projects/ep02-camphor/make_audio.py
python projects/ep02-camphor/render_project.py --jobs 3
ffmpeg -y -i projects/ep02-camphor/render/picture.mp4 -i projects/ep02-camphor/audio/final_mix.m4a \
  -map 0:v:0 -map 1:a:0 -c copy -t 125 -movflags +faststart \
  projects/ep02-camphor/delivery/final.mp4
```

系统浏览器默认`/usr/bin/chromium`，其他已安装浏览器可设`CHROMIUM_PATH`；不需要重新安装Skill。`fonts/`与`water/`由上述步骤生成，工程压缩包也附带生成好的文件，可直接渲染。3路并行适用于本次4CPU配额；内存/CPU不足用`--jobs 1`。已有输出应先保留或改名，避免重跑覆盖自己的新修改。

内部静帧检查：

```bash
python projects/ep02-camphor/render_project.py --stills 2 8 14 25 33 40 47 58 71.8 87 97 113 122 --review custom
```

## 音乐与素材

- 用户提供原件：`assets/audio/default_bgm/We_Never_Remix_0.9x_开智小曲.mp3`。
- 按用户指定标注为《We Never (Remix)（若如初见）》、秋成 / Hi Noise、开智小曲0.9×。原件不再减速、不改调；源48–173秒连续裁剪，1.4秒入、末3.2秒淡出。源文件是单声道，混音复制到双声道，不伪称获得原生立体声空间信息。
- 文件SHA-256：`dbd4f093fc157373aba99649111e21083c8e8ce94e5073bfebdff160a59a82ca`。
- 算法估计BPM约111.6；自相关还存在约73.8 BPM的节奏层候选。4/4与首拍相位是分析候选，**未人工听辨确认**。关键动作选取邻近的实际起音峰，不把全曲强制锁在单一网格上。完整过程见`audio/audio_analysis.md`。
- 水滴/流动/轻触音效：本项目原创，固定随机种子、衰减共振与滤波噪声，不是另一首配乐。
- 小船、樟脑、多尺度示意图、水面纹理：本项目代码生成。水面反射由示意波面法线计算，分子轨迹是固定种子随机游走；不是实拍或定量实验重建。
- 字体：Noto Sans/Serif CJK、DejaVu Serif Italic，源于现有系统；随工程附带版权/许可说明。
- 用户音乐仅用于所要求作品与私有交付；本项目不声明已获得公开再分发音乐原件或抖音全平台商业使用授权。按用户持有的使用范围发布。

## 交付范围与诚实说明

图中没有伪造实验物理数值，81–100秒耗尽过程是时间压缩示意。真实樟脑小船可以振荡、转向或间歇运动，水面污染也可能使其停下；本片选择尾置樟脑且前后不对称的简化构型。樟脑酸凝胶实验仅作相关佐证，不冒充纯樟脑实验。

本环境没有真人试听/观看全片的感知确认；提供全片解码、图像抽检、音量/真峰值和帧数检查，并如实记录可核实的结果。样片和调试片不是最终交付，最终文件仅`delivery/final.mp4`。
