# 高等代数交互式学习平台

一个面向上线产品形态的高等代数学习网站，使用 React、Tailwind、Framer Motion、KaTeX、Three.js 和 SVG 动画，把线性代数概念从公式推导转化为可观察、可交互、可解释的数学场景。

## 核心能力

- 课程路径：向量、向量空间、子空间、线性相关、基与维数、线性变换、矩阵、矩阵乘法、秩、行列式、特征值、特征向量、对角化、二次型、内积、正交化、Jordan 标准型、PCA、线性方程组。
- 教学结构：每个模块都有直觉、几何图像、公式与定义、历史背景、本质总结、常见误区、实际应用。
- 数学动画：WebGL 3D 场景、SVG 参数实验、矩阵连续变形、特征方向高亮、二次曲面、Jordan 链式剪切、PCA 数据云主方向。
- 产品化体验：响应式布局、深色主题、模块导航、学习进度、清晰讲解面板、AI 数学导师接口占位。

## 技术栈

- React 19
- Vite 7
- Tailwind CSS
- Framer Motion
- Three.js
- KaTeX / react-katex
- Vitest

## 本地运行

```bash
npm install
npm run dev
```

默认开发地址为 `http://127.0.0.1:5173`。

## 测试与构建

```bash
npm run test
npm run build
npm run preview
```

## AI 数学导师接口规划

当前前端已预留 AI 导师输入与上下文结构。后续可增加 `/api/tutor`：

```ts
type TutorRequest = {
  moduleId: string;
  stage: string;
  formula: string;
  visualState: Record<string, number | string>;
  question: string;
};
```

服务端可以把当前动画参数、课程阶段和用户问题一起传给大模型，返回新手解释、公式解释或自动例题。

## Vercel 部署

项目已包含 `vercel.json`。部署时选择 Vite 框架，构建命令为 `npm run build`，输出目录为 `dist`。

```bash
npm install -g vercel
vercel login
vercel
vercel --prod
```

## GitHub 上传

```bash
git init
git add .
git commit -m "Build interactive linear algebra learning platform"
git branch -M main
git remote add origin https://github.com/<your-name>/<repo-name>.git
git push -u origin main
```
