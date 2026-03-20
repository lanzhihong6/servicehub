# ServiceHub — 设计与使用文档

## 项目简介

ServiceHub 是一个轻量级的自托管服务导航面板，解决在多台服务器上部署了大量服务后，记不住 IP 端口和域名的问题。

### 核心特性

- **内网 / 外网双入口**：每个服务卡片提供 Tailscale 内网地址和公网域名两个独立跳转按钮
- **YAML 配置驱动**：添加服务只需编辑 `config.yaml`，刷新页面即生效
- **分组管理**：按服务器 / 用途分组展示，侧边栏快速筛选
- **实时搜索**：按名称、描述、标签即时过滤，支持 `/` 快捷键聚焦
- **响应式设计**：PC 和手机都能用
- **纯前端**：无后端依赖，Docker 一行命令部署

---

## 快速开始

### 本地预览

```bash
# 方式一：npx serve
npx -y serve -l 8090 -s .

# 方式二：Python
python3 -m http.server 8090

# 然后浏览器打开 http://localhost:8090
```

### Docker 部署

```bash
# 构建并启动
docker compose up -d

# 访问 http://your-server-ip:8090
```

---

## 配置说明

编辑 `config.yaml` 即可管理所有服务。格式如下：

```yaml
site:
  title: "ServiceHub"        # 页面标题
  subtitle: "我的服务导航"     # 副标题

groups:
  - name: "分组名称"           # 侧边栏显示的分组名
    icon: "🖥️"               # 分组图标（emoji）
    services:
      - name: "服务名"              # 必填：服务名称
        icon: "grafana"            # 可选：预设图标名 / emoji / URL
        description: "一句话描述"    # 可选：服务说明
        tags: ["监控", "运维"]      # 可选：标签（用于搜索和展示）
        internalUrl: "http://100.64.0.1:3000"        # 可选：内网地址
        externalUrl: "https://grafana.example.com"    # 可选：外网地址
```

### 图标配置

`icon` 字段支持三种格式：

| 格式 | 示例 | 说明 |
|---|---|---|
| 预设名称 | `grafana` | 自动从 SimpleIcons CDN 加载 SVG |
| URL | `https://example.com/icon.png` | 任意图片 URL |
| Emoji | `🎯` | 直接使用 emoji |

**预设支持的图标名**：grafana, jenkins, gitlab, github, docker, portainer, nginx, mysql, redis, postgresql, mongodb, elasticsearch, kibana, prometheus, minio, nextcloud, wordpress, homeassistant, traefik, rabbitmq, sonarqube, vault, confluence, jira, drone, gitea, syncthing, plex, jellyfin, bitwarden

### 添加新服务

在 `config.yaml` 的对应分组下添加即可，刷新页面立即生效：

```yaml
      - name: "新服务"
        icon: "🆕"
        description: "服务描述"
        internalUrl: "http://100.64.0.1:9999"
        externalUrl: "https://new.example.com"
```

---

## 键盘快捷键

| 快捷键 | 功能 |
|---|---|
| `/` | 聚焦搜索框 |
| `Esc` | 清空搜索、关闭侧边栏 |

---

## 项目结构

```
servicehub/
├── index.html          # 入口页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   ├── app.js          # 主逻辑
│   └── js-yaml.min.js  # YAML 解析库
├── config.yaml         # ✏️ 唯一需要编辑的文件
├── docs/
│   └── design.md       # 本文档
├── Dockerfile          # Docker 镜像定义
└── docker-compose.yml  # Docker Compose 配置
```

---

## 设计决策

### 为什么选择纯前端方案？

1. **零依赖**：无需后端服务、数据库，降低部署和维护成本
2. **配置即数据**：YAML 比数据库更直观，Git 可追踪变更历史
3. **极低资源**：仅静态文件，Nginx 容器内存占用 < 10MB

### 为什么不做服务健康检测？

V1 版本优先解决「记住地址 + 快速跳转」的核心痛点。健康检测涉及跨域问题（浏览器端无法直接 ping 内网服务），需要后端代理，增加了复杂度，留给后续版本迭代。

### 后续迭代计划

- [ ] 面板登录认证（JWT）
- [ ] Nginx `auth_request` + Cookie SSO，实现一次登录免重复认证
- [ ] 服务健康检测（后端定时 ping）
- [ ] 网络环境自动检测（Tailscale 内网 / 公网自动切换默认入口）
- [ ] 配置在线编辑（Web UI 编辑 YAML）
