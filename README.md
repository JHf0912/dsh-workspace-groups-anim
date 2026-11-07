<div align="center">

# dsh-workspace-groups-anim

**会话标签栏 · 可拖拽排序 + 4 种动效**

给 the agent harness 网页版侧边栏用的会话标签栏增强插件。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Platform](https://img.shields.io/badge/platform-the agent harness%20Web-4a90d9.svg)](#)
[![Node](https://img.shields.io/badge/node-%E2%89%A520-2f9e44.svg)](https://nodejs.org)
[![Version](https://img.shields.io/badge/version-0.1.0-orange.svg)](./CHANGELOG.md)
[![Status](https://img.shields.io/badge/status-beta-f0ad4e.svg)](#)
[![Repo](https://img.shields.io/badge/github-JHf0912%2Fdsh--workspace--groups--anim-181717?logo=github)](https://github.com/JHf0912/dsh-workspace-groups-anim)

</div>

---

> **衍生项目声明**：本项目基于 [z-col/dsh-workspace-groups](https://github.com/z-col/dsh-workspace-groups)（MIT 许可证）修改而来。
> 请同时阅读 [LICENSE](./LICENSE)、[NOTICE](./NOTICE) 与 [UPSTREAM.md](./UPSTREAM.md)。

## ✨ 功能特性

| | 特性 | 说明 |
|:--:|:--|:--|
| 🖱️ | **拖动排序** | 顶部会话标签栏可直接拖动调整顺序，松手即生效并持久化。 |
| 🎞️ | **四种拖拽动效** | 插入线让位 / 平滑跟手 / 幽灵浮层 / 弹性磁吸，一键切换。 |
| ⚙️ | **插件页设置** | 在「插件 → 已安装插件 → 本插件」详情页里，4 种效果**同屏 1:1 预览**，可直接拖动对比，「选用」即设为真实标签栏动效。 |
| 🚫 | **可关闭** | 设置页底部「关闭」后，标签将不可拖动（回到纯展示）。 |
| 💾 | **记忆选择** | 所选动效会保存，刷新 / 重启不丢失。 |
| 🧩 | **无缝替换** | 沿用上游路由与 sidecar 文件名，安装后旧分组 / 标签数据自动继承。 |

## 🎞️ 四种拖拽动效

| 模式 | 名称 | 手感 |
|:--:|:--|:--|
| 1 | 插入线让位 | 蓝色竖线标示落点，其余标签平滑让位；落点最清晰、最稳。 |
| 2 | 平滑跟手 | 标签略微滞后跟随指针，经过邻居即交换；干净顺滑。 |
| 3 | 幽灵浮层（默认） | 拖起的标签变成漂浮「幽灵」，原位留虚框，松手飞回；质感最好。 |
| 4 | 弹性磁吸 | 带惯性与回弹（overshoot），最活泼、最 Q 弹。 |

> 预览条完全复用插件自身的 `.wgTabs / .wgTab` 样式，因此标签间距（`gap: 6px`）、尺寸、圆角、两行「文件夹」造型与真实标签栏**像素级一致**。

## 🖼️ 效果预览

> 下列动图来自插件设置页里的 1:1 预览条（均为「拖拽进行中」状态，示例数据为中性的 project-1…4）。

| 模式 1 · 插入线让位 | 模式 2 · 平滑跟手 |
|:--:|:--:|
| ![模式 1：插入线让位](./docs/preview-1.gif) | ![模式 2：平滑跟手](./docs/preview-2.gif) |

| 模式 3 · 幽灵浮层（默认） | 模式 4 · 弹性磁吸 |
|:--:|:--:|
| ![模式 3：幽灵浮层](./docs/preview-3.gif) | ![模式 4：弹性磁吸](./docs/preview-4.gif) |

## 📦 安装

```bash
# ① 从 Git 仓库安装（推荐，固定版本）
dsh plugin --profile web add github:JHf0912/dsh-workspace-groups-anim#v0.1.0

# ② 从本地目录安装（改代码即时生效，适合开发）
dsh plugin --profile web add link:/绝对路径/dsh-workspace-groups-anim
```

> ⚠️ 本插件是上游的**替换版**。请**不要**与原版 `@dsh-xhl/workspace-groups` 同时启用——两者会争用同一个侧边栏槽位与 `/workspace-groups/*` 路由。

## ⚙️ 使用与设置

1. 打开侧边栏「插件」→「已安装插件」→ 点开本插件进入详情页；
2. 在「会话标签拖拽动效」里，直接拖动上面的 4 条预览对比手感；
3. 点某个模式的「选用」→ 顶部真实标签栏立即按该动效拖动；
4. 需要关闭时选底部「关闭」。

## 🛠 开发 · 构建 · 测试

```bash
pnpm install
pnpm build      # 产出 lib/index.js（host，ESM）与 lib/client.js（浏览器端，CJS）
pnpm test       # vitest 单测
```

## 🗂 项目结构

```
dsh-workspace-groups-anim/
├─ src/
│  ├─ index.ts                 # host 半（复用原 /workspace-groups/* 路由与 sidecar）
│  └─ client/                  # 浏览器端源码
│     ├─ index.ts              # 注册侧栏浏览区 + 插件页设置
│     ├─ SessionTabs.tsx       # 会话标签栏（拖拽 + FLIP）
│     ├─ TabAnimSettings.tsx   # 插件页设置 + 4 条 1:1 预览
│     ├─ tab-anim.ts           # 动效模式状态 / 持久化
│     ├─ tabs.ts               # 纯状态（含 moveTab 重排）
│     └─ ...
├─ lib/                        # 构建产物（已随仓库提交，git 安装免构建）
├─ tests/                      # vitest 单测
├─ tsdown.config.ts            # 构建配置
├─ tsconfig*.json / vitest.config.ts
├─ LICENSE / NOTICE / UPSTREAM.md
└─ README.md
```

## 🔄 与上游的关系

- 上游基线：`z-col/dsh-workspace-groups@0.4.2`（MIT）。
- 本仓库：从该版本的源码还原并新增「标签拖拽 + 4 种动效 + 插件页设置/预览」。
- 原则：保持补丁最小，方便日后 rebase 上游新版本。

## 📄 许可证与署名

本项目以 **MIT** 许可发布。上游版权归原作者所有（详见 [LICENSE](./LICENSE)），本衍生项目的修改部分见 [NOTICE](./NOTICE)。

## 🙏 致谢

感谢 [z-col/dsh-workspace-groups](https://github.com/z-col/dsh-workspace-groups) 提供的优秀基座。
