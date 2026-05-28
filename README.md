# CountDown

> 编辑式倒计时 + Todo · 4 套主题 · 完全 Serverless · PWA

▶︎ Live: <https://hspk.github.io/countdown/>

## 特性

- **首页 / 全部 / 设置** 3-tab 编辑式列表
- **4 套主题** Mono Light / Mono Dark / Paper / Cyberpunk · 自定义主题支持 JSON 文件导入
- **9 章使用手册** 内置文档页 + 坐标导航翻页
- **直播大屏（OBS）** `?broadcast=<id>&bg=chroma|transparent|...` 嵌入式 URL
- **数据源订阅** 远端 JSON 订阅（只读）+ 本地导入导出
- **重复任务** 每天 / 每周 / 每月，完成自动推进
- **桌面通知** 截止前 1h / 10m / 当下三级提醒
- **PWA** 可装到桌面 / 主屏，离线可用
- **Serverless** — 全栈纯前端，可丢任意静态主机

## 开发

```bash
npm install
npm run dev          # http://localhost:5173
```

## 构建 & 部署

```bash
npm run build        # 产物在 dist/
npm run preview      # 本地预览 dist/
```

`dist/` 是纯静态文件，可部署到：

- **GitHub Pages**（本仓库默认通过 `.github/workflows/deploy.yml` 自动部署到 `https://hspk.github.io/countdown/`）
- Vercel / Netlify / Cloudflare Pages（设 build = `npm run build`，output = `dist`）
- 任何 nginx / S3 / OSS 静态主机

> 子路径部署需要设置 `VITE_BASE` 环境变量（如 `/countdown/`），workflow 已自动注入。

## 技术栈

- Vite + React 18 + TypeScript
- Zustand（状态 + persist）
- marked + DOMPurify（Markdown）
- vite-plugin-pwa（Workbox SW + manifest）
- 100% 客户端 · 0 后端依赖
