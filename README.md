# Christmas 3D Scene - WebGPU

高质量圣诞主题3D交互场景，使用 Three.js 结合 WebGPU 渲染技术开发。

## 🛠 技术栈

- **Frontend**: Three.js + Vanilla JavaScript
- **Build Tool**: Vite 5.x
- **Renderer**: WebGPU (with WebGL fallback)
- **Container**: Docker + Nginx

## ✨ 核心特性

### 3D 场景元素

- **圣诞树**: 4层锥形结构，带有材质纹理和顶点动画效果（树叶摇摆）
- **雪花粒子系统**: 5000+ 粒子，具备重力、风力和湍流物理模拟
- **圣诞礼物盒**: 5种不同样式，支持碰撞检测和点击交互
- **动态光照**: 环境光 + 月光 + 5个装饰点光源 + 聚光灯

### 渲染与性能

- WebGPU 优先，自动降级到 WebGL
- 60fps 稳定帧率保证
- 自适应画质调节（高/中/低）
- 高效内存管理和资源缓存

### 交互功能

- 鼠标拖拽旋转视角
- 滚轮缩放
- 触摸屏支持
- 点击礼物盒触发动画和音效
- 自动旋转观察

### 音频系统

- 程序化生成的圣诞主题背景音乐
- 交互音效（点击、铃声等）
- 音量控制

## 🚀 启动指南 (How to Run)

### Docker 方式（推荐）

1. 确保 Docker Desktop 已启动
2. 在根目录执行：

```bash
docker compose up -d --build
```

3. 等待容器启动完成，访问 http://localhost:3000

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 🔗 服务地址 (Services)

- **Frontend**: http://localhost:3000

## 🎮 操作说明

| 操作     | PC           | 移动端   |
| -------- | ------------ | -------- |
| 旋转视角 | 鼠标左键拖拽 | 单指滑动 |
| 缩放     | 滚轮         | 双指捏合 |
| 点击礼物 | 左键点击     | 单击     |

### 控制按钮

- 🎵 切换背景音乐
- ❄️ 切换雪花效果
- 💡 切换装饰灯光
- ⛶ 全屏模式

## 📁 项目结构

```
378/
├── src/
│   ├── core/           # 核心模块
│   │   ├── Renderer.js     # WebGPU/WebGL 渲染器
│   │   ├── Scene.js        # 场景管理
│   │   ├── Camera.js       # 相机控制
│   │   └── Controls.js     # 交互控制
│   ├── objects/        # 3D 对象
│   │   ├── ChristmasTree.js    # 圣诞树
│   │   ├── GiftBoxes.js        # 礼物盒
│   │   └── Ground.js           # 地面
│   ├── systems/        # 系统模块
│   │   ├── SnowSystem.js       # 雪花粒子系统
│   │   ├── LightingSystem.js   # 光照系统
│   │   └── AudioManager.js     # 音频管理
│   ├── utils/          # 工具模块
│   │   ├── PerformanceMonitor.js   # 性能监控
│   │   └── ResourceManager.js      # 资源管理
│   └── main.js         # 应用入口
├── public/             # 静态资源
├── index.html          # HTML 入口
├── vite.config.js      # Vite 配置
├── Dockerfile          # Docker 镜像配置
├── docker-compose.yml  # Docker Compose 配置
└── nginx.conf          # Nginx 配置
```

## 🌐 浏览器兼容性

| 浏览器       | WebGPU | WebGL |
| ------------ | ------ | ----- |
| Chrome 113+  | ✅     | ✅    |
| Edge 113+    | ✅     | ✅    |
| Firefox 117+ | 🔶     | ✅    |
| Safari 17+   | 🔶     | ✅    |

🔶 = 需要手动启用 WebGPU flag

## 📊 性能指标

- 目标帧率: 60 FPS
- 粒子数量: 5000 (自适应调节)
- 首屏加载: < 3s
- 内存占用: < 100MB

## License

MIT
