# 课表解析应用

一款用于解析和展示高校课表的跨平台应用，支持 Web、Android 和桌面端。

## ✨ 功能特性

- 📅 自动解析教务系统导出的 Excel 课表
- 🔐 支持自动登录教务系统获取课表
- 📱 支持 Android 桌面小部件
- 🌙 支持浅色/深色主题切换
- 🖼️ 支持自定义背景图片
- 📊 卡片视图和课表视图两种展示方式
- 🔄 一键刷新课表


## 🚀 快速开始

### 直接安装 APK

下载 `课表应用-v1.0.apk` 文件，安装到 Android 设备即可使用。

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/yourusername/schedule-app.git
cd schedule-app

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建前端
npm run build

# 同步到 Android
npx cap sync android

# 构建 APK (需要 Android SDK)
cd android
./gradlew assembleDebug
```

## 📁 项目结构

```
├── src/                    # 前端源代码
│   ├── components/         # React 组件
│   ├── pages/              # 页面组件
│   ├── store/              # 状态管理 (Zustand)
│   ├── utils/              # 工具函数
│   ├── plugins/            # Capacitor 插件
│   └── types/              # TypeScript 类型定义
├── android/                # Android 原生代码
├── electron/               # Electron 桌面端代码
├── public/                 # 静态资源
├── capacitor.config.ts     # Capacitor 配置
├── vite.config.ts          # Vite 配置
└── package.json            # 项目配置
```

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式方案**: Tailwind CSS
- **状态管理**: Zustand
- **跨平台方案**: Capacitor
- **桌面端**: Electron
- **Excel 解析**: SheetJS (xlsx)

## 📋 使用说明

1. **上传文件**: 从教务系统下载课表 Excel 文件，上传到应用
2. **自动登录**: 输入教务系统账号密码，自动获取课表
3. **切换周数**: 点击顶部周数选择器切换查看不同周的课表
4. **切换视图**: 点击右上角按钮切换卡片/课表视图
5. **自定义背景**: 在设置中上传图片作为应用背景
6. **桌面小部件**: Android 设备可添加桌面小部件快速查看课表

## 📄 许可证

MIT License

## 🙏 致谢

- [Capacitor](https://capacitorjs.com/) - 跨平台应用框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [Zustand](https://github.com/pmndrszustand) - 轻量级状态管理
- [SheetJS](https://sheetjs.com/) - Excel 文件解析库

## 📧 联系方式

如有问题或建议，欢迎提交 Issue。
