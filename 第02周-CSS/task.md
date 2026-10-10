# 第 2 周任务：CSS 双页面练习

## 任务目标

通过完成两个不同风格的页面，掌握 CSS 外部样式引入、常用选择器、盒模型与 `box-sizing`、文字与卡片样式、伪元素装饰、元素定位、Flexbox、Grid、交互状态和简单响应式适配等知识点。

## 指引

本次要交付两个文件，分别对应两张效果图：

- `index.html`：个人简介卡片页，效果参照 `image1.png`；
- `index_2.html`：响应式主页，效果参照 `image2.png`。

两张图都只提供**目标效果**，请自己编写 HTML 结构和 CSS，不要直接复制别人的代码。

重点关注以下内容：

- 使用 `<link>` 引入外部 CSS 文件；
- 标签、类、ID、后代、子代、属性和伪类选择器；
- CSS 的层叠、继承和选择器优先级；
- `margin`、`padding`、`border`、宽高与 `box-sizing`；
- 字体、颜色、背景、圆角、阴影和文字排版；
- `display`、`visibility`、`opacity` 的区别；
- `:hover`、`:focus-visible` 等交互状态；
- CSS 变量、Flexbox、Grid、定位和基础媒体查询。

## 本轮要求

1. 新建 `index.html` 和 `index_2.html` 两个文件，样式都通过 `<link>` 引入外部 CSS 文件，**不允许**把规则写在行内 `style` 属性里。
2. `index.html`（个人简介卡片）：
   - 卡片在页面中水平垂直居中；
   - 头像使用本地图片 + 相对路径（本周目录已提供 `assets/avatar.svg`，也可以换成你自己的图片），裁剪成圆形且**不变形**。
   - 卡片包含标题、简介和至少一个按钮；
   - 卡片上至少有一个绝对定位的元素，并用 `z-index` 控制层级；
   - 按钮在 `:hover` 和 `:focus-visible` 时都要有反馈。
3. `index_2.html`（响应式主页）：
   - 包含顶部导航栏（`header` + `nav`）、主体内容区和底部栏（`footer`）；
   - 主体区至少 3 张卡片，使用 Grid 的 `repeat(auto-fit, minmax(...))` 排布；
   - 卡片图片使用本地资源 + 相对路径，并写清 `alt`；图片或图标自备即可（`assets/avatar.svg` 也可以复用）
   - 屏幕变窄时导航和卡片仍可正常阅读，不出现明显内容遮挡或横向滚动。
4. 至少使用一次伪元素（`::before` 或 `::after`）做装饰，至少使用一次子代选择器（`>`）和一次属性选择器（例如 `a[target="_blank"]`）。
5. 使用 CSS 自定义属性统一颜色、圆角、阴影等重复值，并至少使用 `rem` 或 `clamp()` 这类相对单位。
6. 至少写一处过渡或动画（`transition`、`@keyframes` 均可），并在 `prefers-reduced-motion: reduce` 时关闭动效。
7. 明白 `display: none`、`visibility: hidden`、`opacity: 0` 的区别，并在页面中实际使用其中至少两种。

## 完成标准

- `index.html` 能还原 `image1.png` 的卡片效果，`index_2.html` 能还原 `image2.png` 的基本布局；
- 两个页面都通过 `<link>` 引入外部样式，页面中没有行内 `style` 属性；
- 卡片、图片和文字之间没有明显挤压或溢出，宽度缩小到 320px 时不出现横向滚动；
- 鼠标悬停和键盘 Tab 聚焦时都能看出可交互元素；
- 页面中至少有一处伪元素装饰、一处绝对定位元素、一处 Flexbox 布局和一处 Grid 布局；
- 图片全部使用本地相对路径，控制台没有资源加载错误；
- 能现场说明盒模型与 `box-sizing`、选择器优先级、CSS 变量、Flexbox 和 Grid 的基本作用。
