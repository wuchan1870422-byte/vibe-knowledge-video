# 素材与音轨清单

|项目|来源与处理|文件|
|---|---|---|
|主BGM|用户上传，按用户标注为秋成 / Hi Noise《We Never (Remix)（若如初见）》、开智小曲0.9×；源0–125秒连续使用，播放速度1.0，不再减速|仓库`assets/audio/default_bgm/We_Never_Remix_0.9x_开智小曲.mp3`|
|编辑BGM|3秒淡入，开头低音量；规则解释与群体高潮有增益编排；末3.2秒淡出|`audio/bgm_edit.wav`（工作区/私人分轨包）|
|拟声音效|本期程序生成的少量空气掠过、柔和规则落定声，不代替主音乐|`audio/sfx.wav`（工作区/私人分轨包）|
|总混音|原曲+克制音效，少量峰值控制后测量并用恒定增益达到响度目标，保留安静片头|`audio/final_mix.wav` / `.m4a`，MP4内含AAC|
|群集状态|本期C++真实局部计算结果；并非外部视频/预制轨迹|`sim/boids.cpp`、`replay.bin`、`focus.bin`|
|规则示意|本期独立小型计算实验|`sim/demos.py` / `.json`|
|鸟体、羽翼、轨迹、相机、封面|本期代码绘制，无外部图片、鸟群视频或3D模型素材|`scenes.js`|
|Three.js|本地离线r160，MIT许可|`vendor/three.module.min.js`、`vendor/LICENSE`|
|中文字体|沿用前期Noto Sans/Serif CJK集合|`fonts/sans.ttc`、`sans-bold.ttc`、`serif.ttc`|
|英文斜体|沿用DejaVu Serif Italic|`fonts/latin-italic.ttf`|
|字体许可|沿用并随源包交付|`fonts/licenses/`|
|原理参照|原作者OpenSteer开源实现与Three.js参考，保留其原始版权头|`research/`，详见NOTES.md|

BGM原件SHA-256：`dbd4f093fc157373aba99649111e21083c8e8ce94e5073bfebdff160a59a82ca`；7,311,321字节，44.1kHz单声道MP3，时长约182.72秒。成片混音48kHz双声道。不公开分发原始MP3或独立原曲分轨；私人工作区为用户保留原件和分轨。成片已经按要求合入固定曲目。
