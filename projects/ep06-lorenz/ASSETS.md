# 本期素材清单

|素材|来源/处理|
|---|---|
|主BGM|用户上传的《We Never (Remix)（若如初见）》秋成 / Hi Noise，开智小曲0.9×原件。根目录`assets/audio/default_bgm/`；SHA-256见`audio/analysis.json`。源0–125秒、速度1.0，仅叙事增益与淡入淡出。|
|音效|`make_audio.py`固定种子生成的轻微短提示、空间掠过声；无额外旋律。|
|轨迹、光点、距离曲线|`sim/integrate.py`双精度实际计算；`scenes.js`绘制，不使用外部视频或预制蝴蝶模型。|
|封面|与成片同一份计算轨迹，经专用纵向镜头及大字排版导出。|
|3D库|沿用第五期本地Three.js r160；`vendor/LICENSE`为MIT许可。|
|字体|沿用Noto Sans/Serif CJK及DejaVu Serif Italic；许可证在`fonts/licenses/`。字体原件在工作区及已提交的上一期`delivery/source.zip`中。|
|科学资料|Matplotlib、SciPy官方原文快照及出处，见`research/NOTES.md`。未把无法访问的原论文标记成已阅读。|

不对外单独分发原始音乐MP3或独立原曲分轨。保留源码、模型数据和本期实际使用的开源许可。
