# AGENTS.md — vibe-knowledge-video 通用 Agent 指令

> 本文件是给 AI 编程助手（OpenAI Codex / Gemini CLI / Jules / Cursor / Trae 等）看的入口指令。
> 这些工具会自动读取仓库根目录的 `AGENTS.md` 并遵守其中约定。

## 你现在拿到了什么

这是一个**视频制作技能仓库**：把数学/概率/哲学等硬知识拍成「Vibe知识大赏」风格的电影感知识短视频（1920×1080、2:00–2:45、无配音、双语字幕、纯代码生成）。

## 收到视频制作请求时，你必须这样做

0. **先读根目录 `VIDEO_STYLE.md`，再完整阅读 `SKILL.md`**。这两份文件必须随 Git 仓库持久保存，Codex 本地与 Codex Cloud 均使用同一套规范；每个未来视频项目默认遵循，不依赖聊天记忆或临时环境配置。用户只提供科普主题时，自动套用既定风格和音乐，不要求用户重复选择。
1. `SKILL.md` 是七步工作流的总纲（选题核实→剧本→分镜→用户确认→代码实现→渲染合成→自检交付），逐步执行，不可跳步。当前用户明确指令优先；本仓库长期风格以本文件和 `VIDEO_STYLE.md` 为准，其他参考文档中的旧合成音乐或固定 BPM 示例不得覆盖此规范。
2. 需要风格细节时读 `references/`：
   - `references/visualization-design.md` — **（先读）讲解设计**：配图与讲解的分界、概念→形象的提问法、六种呈现动作、约 1/5 句子不配画面
   - `references/copywriting-rules.md` — 字幕稿文体：句量句长、句式工具箱、禁用清单、强调的克制规则
   - `references/structure-bible.md` — 选题打分、三种骨架、十条叙事定律、悬念/反转/读数/回扣的设计
   - `references/visual-grammar.md` — 常见句型→演法对照表、十种转场手法、动效手感（写分镜时随手查）
   - `references/beat-scaffold.md` — 逐拍写法骨架：标准片 ~44 个功能位置与写法公式（严格模式照表填）
   - `references/image-prompts.md` — 出图提示词规范（可选环节：风格后缀、六条规则、典型清单）
   - `references/quality-gate.md` — 人工看图改图毛病表、两轮修复流程、终检门槛、数字纪律
   - `references/render-craft.md` — render(t) 工程纪律：固定种子、模拟查表、辉光管线、对数推拉、常见装置写法
   - `references/rework-scripts.md` — 分步推进的八轮提示词 + 按毛病直说的返工话术
   - `references/alternate-worlds.md` — 建立第二套视觉世界的方法与节奏经验值
   - `references/style-guide.md` — 布局坐标、配色、动效规格、视觉母题库
   - `references/narrative-templates.md` — 六段式叙事弧模板 + 8 条原片逐段拆解
   - `references/prompt-brief.md` — 创作简报（Brief）填空模板
   - `docs/common-mistakes.md` — 常见错误对照表（报错/翻车先查这里）
   - `docs/publish-guide.md` — 发布前检查清单与数据复盘
   - `docs/topic-seeds.md` — 选题方向、种子题与四关检验
   - `docs/strict-mode.md` — 中等及以下模型用：逐关完成的严格模式与降级方案
3. 写代码前**必须让用户确认剧本和分镜**（第 4 步），不要自作主张直接开做。
4. 页面模板从 `assets/template.html` 起改，不要从零造轮子。
5. **（v2.0）数字纪律**：屏上每个数字先由代码算出或查证记入 NOTES.md，禁止先写数再倒推；模拟用固定种子，同一帧渲染两遍结果必须一致；模拟/示意内容在画面上标注。
6. **（v2.0）交付前的人工质检**：用 `render_frames.py` 的 `--sheet` / `--stills` / `--motion` 看图，按 `quality-gate.md` 毛病表逐条查，至少修两轮；`qa_check.py` 通过 ≠ 可以交片。
7. **（v2.4）预览先行**：页面能跑的第一时间起预览给用户看，边写边纠偏，不要闷头做完再给。
8. **（v2.4）保留用户手工改动**：发现代码在会话之外被用户改过时，不要覆盖——视为有意修改，或先询问。
9. **（v2.4）Remotion 路线**：用户要求用 Remotion 实现时，读 `references/remotion-track.md`（方法论不变，工程对照与流程在那里）；渲染命令换成 `npx remotion render / still / --frames`。

## 长期视频与音乐规范（本地 / Cloud 共用）

- 16:9，1920×1080，30fps；深色背景、米白文字、低饱和暖金；无旁白，以动画和中英字幕叙事；交付真实可播放的 MP4。
- 后续制作以手机观看的可读性为准：字幕和关键标注比第二期更大、更清楚，主要画面充分放大，减少过多空白。先缩小到手机实际显示尺寸检查，不只在1080p原尺寸看图；具体排版基准见 `VIDEO_STYLE.md`。此反馈不触发已有视频的修改或重渲。
- 后续每期默认单独设计抖音封面，以独立PNG/JPG文件与MP4一起交付；保持横屏成片规格，封面适配手机竖向展示与主页缩略图裁切，采用大标题和突出的主体。细则见 `VIDEO_STYLE.md`。
- 左上角不默认添加固定的“VIBE知识大赏”字样（含空格、大小写等变体），不要把风格名称当作全片常驻水印。此偏好仅用于后续制作，不据此修改、覆盖或重渲已有视频。
- 默认唯一主 BGM：**秋成《若如初见》（We Never Remix）**，社区昵称 **开智小曲**；优先 **0.9× Slow / Slowed** 版本。不得擅自替换为 AI 生成音乐、其他相似音乐或其他曲目。
- 已接收用户指定原件 `assets/audio/default_bgm/We_Never_Remix_0.9x_开智小曲.mp3`，默认使用该文件，不再自动减速；SHA-256、格式与跨环境恢复说明见该目录 `README.md`。音乐原文件不随 Git 自动同步，进入本地/Cloud 时先检查存在并核对哈希。缺文件时等待用户提供合法取得的音频，不从不明来源下载，不生成替代音乐，不把无声样片称为最终交付。可继续不依赖音频的事实核实与剧本工作。
- BPM、拍号、第一拍和使用片段必须分析实际音频并记录，不能沿用旧模板的 76–78/77 BPM；Slowed 文件不得再自动减速一次。关键动作按实测拍点与乐句同步，保留克制、精致的拟声音效，细则见 `VIDEO_STYLE.md`。
- 规范维护不触发渲染、重合成或已有成果覆盖，不停止正在进行的制作进程；已有项目的追溯调整须有用户明确指令。后续创作使用独立输出目录并保留手工改动。

## 环境准备（渲染合成前执行一次）

```bash
# Python 依赖
pip install playwright pillow numpy

# 无头浏览器
playwright install chromium

# ffmpeg（视频合成必需，需含 H.264 编码器）
# Ubuntu/Debian: apt install -y ffmpeg
# macOS: brew install ffmpeg
# Windows: winget install ffmpeg

# 可选：QA 字幕 OCR 校验
# apt install -y tesseract-ocr tesseract-ocr-chi-sim
ffmpeg -version  # 验证可用
```

## 不可违反的技术契约

- `index.html` 必须暴露 **`window.render(t)`**：给定秒数 t 画出该帧；画面只由 t 决定（固定随机种子、无计时器、无帧间状态）。这是逐帧渲染器 `scripts/render_frames.py` 的调用契约。
- 渲染器会设置 `window.__RENDER_MODE__ = true` 接管渲染循环——页面自己的 requestAnimationFrame 预览循环检测到该标志后必须停止，否则预览循环会用墙上时钟覆盖 render(t) 的画面状态。
- 字体加载完成再截图（`document.fonts.ready`）。
- Canvas 文字手动换行，禁止依赖浏览器自动换行。

## 渲染合成命令（第 6 步）

```bash
python3 scripts/render_frames.py index.html out_frames/ --fps 30 --duration 130
# bgm.wav 必须由用户提供的固定曲目按 VIDEO_STYLE.md 裁剪/混音准备；缺失即等待，不合成替代音乐。
test -f bgm.wav || { echo '缺少固定曲目的合法音频，停止合成'; exit 1; }
bash scripts/build_video.sh out_frames/ bgm.wav final.mp4
python3 scripts/qa_check.py final.mp4   # 六维自检，任何一项 < 8 分须修复重渲
```

看图改图命令（v2.0，第 7 步人工质检用，详见 `references/quality-gate.md`）：

```bash
python3 scripts/render_frames.py index.html review/ --duration 130 --sheet 16      # 全片均匀 16 帧总览图
python3 scripts/render_frames.py index.html review/ --duration 130 --sheet 3.5 18 62  # 指定时刻总览图
python3 scripts/render_frames.py index.html review/ --duration 130 --stills 18.3 62.4 # 原尺寸静帧
python3 scripts/render_frames.py index.html review/ --duration 130 --motion 61.5 64   # 转场区间 12 帧拼图
```

## 能力边界（对用户诚实）

- 若当前环境**无法安装依赖或执行 shell**（如纯对话型网页 AI）：只完成第 1–5 步（剧本/分镜/index.html 代码），并把上面两条命令块原样交给用户，请其在本地终端执行第 6–7 步。
- 所有事实（年份/人名/论文名/数字）须联网核实，没把握的不写。

## 语言

与用户交流用中文；代码注释用中文；成片字幕为中文主句 + 英文斜体对照（风格 DNA 要求，见 `references/style-guide.md`）。
