# 第六期：只差百万分之一，未来为什么会彻底不同？

独立工程；复用第五期的本地 Three.js、字体、固定配乐、浏览器逐帧渲染与导出流程。原项目不变。

- 成片：125秒，1920×1080，30fps，H.264/AAC，BT.709 limited，faststart。
- `delivery/final.mp4`：完整成片；`cover-portrait.jpg/png`：1080×1920；`cover-profile.jpg`：1080×1440。
- `PUBLISH.md`：本期发布文案。`player.html`：本地成片播放器。
- `sim/integrate.py`：实际RK4积分与步长复核；`sim/*.bin`：float64预计算数据。
- `scenes.js`：三维历史路径、两条真实轨迹的光点与短尾、相机、放大窗、距离图、封面。
- `prepare_timeline.py` / `subtitles.json` / `script.md`：字幕与时间表。

进入仓库后先读根目录 `AGENTS.md` 和 `VIDEO_STYLE.md`。依赖沿用已有工程，不重装Skill。导出使用系统已有Mesa llvmpipe（ANGLE gl-egl，LP_NUM_THREADS=2），提高密集三维轨迹的CPU渲染效率；未降低轨迹采样密度。Python需要numpy、scipy、Pillow、Playwright、fontTools；系统需FFmpeg及Chromium。`vendor/`已包含Three.js与许可证。字体沿用第五期 `fonts/`；全新克隆运行 `python projects/ep06-lorenz/restore_fonts.py` 从仓库已有第五期源包恢复，字体大文件不重复提交，许可证保留。MP3仅在根目录受约定的音频路径读取，不随本期Git提交公开。

复现：

```bash
python projects/ep06-lorenz/sim/integrate.py
python projects/ep06-lorenz/validate_model.py
python projects/ep06-lorenz/prepare_timeline.py
python projects/ep06-lorenz/make_audio.py
python projects/ep06-lorenz/render_project.py --stills 6 14.5 43 63 72 95 103 123 --review manual
python projects/ep06-lorenz/render_project.py --jobs 3
ffmpeg -y -i projects/ep06-lorenz/render/picture.mp4 -i projects/ep06-lorenz/audio/final_mix.m4a -map 0:v:0 -map 1:a:0 -c copy -t 125 -movflags +faststart projects/ep06-lorenz/delivery/final.mp4
python projects/ep06-lorenz/capture_cover.py
python projects/ep06-lorenz/verify_final.py
python projects/ep06-lorenz/check_audio_alignment.py
python projects/ep06-lorenz/check_audio_levels.py
python projects/ep06-lorenz/check_browser_playback.py
python projects/ep06-lorenz/run_repo_qa.py
```

浏览器入口为HTTP而非直接file://：从本目录启动 `python -m http.server 8000`，访问 `index.html`。最终交付为MP4而非此预览页面。自动检查不替代实际看图；抽检记录见 `review/QUALITY.md`。`research/NOTES.md`说明事实、数字、数值精度与呈现边界。
