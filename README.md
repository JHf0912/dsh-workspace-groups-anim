# dsh-workspace-groups-anim

> 给 the agent harness 网页版侧边栏用的**可拖拽会话标签栏**插件：拖动标签即可调整顺序，内置 4 种可切换的拖拽动效，并在插件页里带一个“可实时对比预览”的设置面板。

**这是一个衍生项目。** 基于 [z-col/dsh-workspace-groups](https://github.com/z-col/dsh-workspace-groups)（MIT 许可证）修改而来。请同时阅读 [LICENSE](./LICENSE)、[NOTICE](./NOTICE) 与 [UPSTREAM.md](./UPSTREAM.md)。

## 功能（在上游基础上新增）
- **拖动排序**：顶部会话标签栏可以拖来拖去调整顺序，松手即生效并持久化。
- **四种拖拽动效**：模式 1 插入线让位 / 模式 2 平滑跟手 / 模式 3 幽灵浮层 / 模式 4 弹性磁吸。
- **插件页设置**：在「插件 → 已安装插件 → 本插件」的详情页里，4 种效果**同屏 1:1 预览**、可直接拖动对比，点「选用」即可设为真实标签栏的动效；底部还能「关闭」（关闭后标签不可拖动）。
- **记忆选择**：所选动效会保存，刷新/重启不丢。

## 安装
```bash
# 从 Git 仓库安装
dsh plugin --profile web add github:YOURNAME/dsh-workspace-groups-anim
# 或从本地目录安装（改代码即时生效）
dsh plugin --profile web add link:/绝对路径/dsh-workspace-groups-anim
```

> 本插件是上游的**替换版**（沿用原路由与 sidecar 文件名，安装后旧数据无缝继承）。**不要同时启用原版与衍生版**——两者会争用同一个侧边栏槽位与路由。

## 构建与测试（开发）
```bash
pnpm install
pnpm build     # 产出 lib/index.js（host，ESM）与 lib/client.js（浏览器端，CJS）
pnpm test      # 运行 vitest 单测
```

## 目录结构（简）
- `src/index.ts` —— host 半（复用原 `/workspace-groups/*` 路由与 sidecar 文件）
- `src/client/` —— 浏览器端源码（含新增的 `tab-anim.ts`、`TabAnimSettings.tsx`）
- `tsdown.config.ts` / `tsconfig*.json` / `vitest.config.ts` —— 构建与测试配置
- `LICENSE` / `NOTICE` / `UPSTREAM.md` —— 许可证与上游归属说明

## 许可证
MIT。上游版权归原作者（见 `LICENSE`），本衍生项目的修改部分见 `NOTICE`。
