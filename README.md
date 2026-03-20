# ServiceHub

> 现代科技感、轻量级的自托管服务导航仪 (Self-hosted Services Dashboard)

ServiceHub 是一个基于配置文件驱动的高颜值服务导航仪表盘，旨在为极客和开发者提供一个纯粹、美观、响应式的本地和内外网服务访问入口。

## ✨ 特性 (Features)

*   **极简视觉美学**：采用暗黑模式（Dark Mode）与毛玻璃材质（Glassmorphism），参考 Vercel / Linear 的极简科技感风格。
*   **YAML 配置驱动**：脱离繁杂的数据库，所有的服务卡片和分组均由简单的 `config.yaml` 定义。
*   **全平台响应式**：
    *   **Desktop**：提供美观的可选折叠侧边栏与宽大卡片。
    *   **Mobile**：完全为单手操作设计的移动端 UI，横向滚动的快捷分组。
*   **高度可定制**：内置常见服务 Logo 支持，并可直接引入外链图标或纯 Emoji 作为卡片标识。
*   **快速查找**：自带纯前端的轻量级模糊搜索功能。

## 🚀 快速开始

本项目极为轻量，无需复杂的编译步骤或大型依赖。

### 方式一：Node.js 本地启动
1. 确保安装了 [Node.js](https://nodejs.org/)。
2. 克隆本仓库到本地。
3. 执行如下命令：
   ```bash
   node server.js
   ```
4. 默认监听在 `http://0.0.0.0:8090`，在浏览器中打开此地址即可访问。

### 方式二：Docker 部署 (推荐)
本项目包含标准的 Docker 和 Docker Compose 文件，推荐通过 Docker 进行常驻部署：

```bash
docker-compose up -d
```

## ⚙️ 配置指南

可以通过修改项目根目录的 `config.yaml` 来增删你的服务。部分配置示例：

```yaml
site:
  title: "ServiceHub"
  subtitle: "My Personal Homelab Services"

groups:
  - name: "基础设施"
    icon: "🖧"
    services:
      - name: "Proxmox VE"
        description: "本地虚拟机底层集群管理控制面"
        icon: "server"
        internalUrl: "https://192.168.1.100:8006"
        tags: ["System", "PVE"]
```
*每一次保存后，只需要刷新浏览器即可看到最新的页面变更。*

## 🎨 定制图标
`icon` 字段支持三种格式：
1. **预设内建 ID**：如 `grafana`、`docker`、`github`（自动识别品牌色及 SVG）。
2. **纯文本/Emoji**：比如 `🚀` 或是文字。
3. **外链图片**：直接填入以 `http://` 或 `https://` 开头的图片外链地址。

## 📜 许可证 (License)

MIT License.
