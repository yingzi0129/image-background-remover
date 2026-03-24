# Image Background Remover（去背景抠图）— MVP 需求文档

## 1. 背景与目标
为用户提供一个**在线图片去背景**网站：上传图片 → 自动抠图 → 下载透明背景 PNG。  
MVP 目标：**最快上线可用**，无需用户系统、无需存储图片。

## 2. MVP 范围（做什么 / 不做什么）

### 2.1 必做功能（MVP）
1) **图片上传**
- 支持 JPG / PNG
- 支持点击选择 + 拖拽上传
- 单张处理
- 文件大小限制：≤ 10MB（可配置）

2) **去背景处理**
- 通过 Cloudflare Worker 调用 **Remove.bg API**
- 图片仅在内存中流转，不落盘、不保存

3) **结果展示与下载**
- 展示原图与处理后的透明 PNG（预览）
- 提供“下载 PNG”按钮

4) **基础错误提示**
- 文件格式不支持
- 文件过大
- Remove.bg 返回错误（额度不足、鉴权失败、图片无法处理等）
- 网络/超时

### 2.2 明确不做（非 MVP）
- 注册/登录
- 历史记录、图库
- 批量处理
- 背景替换（纯色/模板）
- 付费系统/会员（可作为下一期）

## 3. 技术方案（MVP）
- 前端：**Cloudflare Pages**（静态站点，HTML/CSS/JS）
- 后端：**Cloudflare Worker**（HTTP API 转发）
- 去背景服务：**Remove.bg API**
- 存储：**无**（不存储用户图片）
- 密钥：Remove.bg API Key 存放在 Worker 环境变量 `REMOVEBG_API_KEY`

## 4. 用户流程（User Flow）
1. 用户打开网页
2. 上传图片（拖拽/选择）
3. 页面显示“处理中…”
4. 返回结果图（透明背景 PNG）
5. 点击“下载 PNG”保存

## 5. 页面与交互（单页 MVP）

### 5.1 页面结构
- Header：产品名 + 简短说明
- 上传区：拖拽框 + “选择图片”按钮
- 处理状态：loading（进度条或旋转图标）
- 结果区：
  - 原图预览
  - 结果图预览（透明底可用棋盘格背景）
  - 下载按钮
- Footer：隐私说明（不存储图片）+ API 来源标注（Remove.bg）

### 5.2 关键交互
- 上传后禁用重复点击（避免多次提交）
- 支持重新上传（清空状态）
- 失败时展示可读错误 + “重试”按钮

## 6. API 设计（Worker）

### 6.1 接口定义
**POST** `/api/remove-bg`  
- Content-Type：`multipart/form-data`
- 参数：
  - `image`：文件（JPG/PNG）
  - 可选：`size`（auto/preview/full 等，根据 remove.bg 支持）

### 6.2 返回
- 成功：`200`，Body 为 PNG 二进制（`Content-Type: image/png`）
- 失败：`4xx/5xx`，返回 JSON：
```json
{ "error": "message" }
```

## 7. 非功能要求
- 性能：单张图片正常网络下 **3~10 秒**内返回（取决于 remove.bg）
- 兼容：移动端可用（响应式）
- 安全：
  - API Key 不可暴露在前端
  - Worker 进行文件大小限制
  - 可选：简单限速（防刷、防盗用额度）

## 8. 风险与应对
1) **Remove.bg 成本/额度消耗**  
- MVP 可先不做付费，但必须做：
  - 单 IP 限速（后续）
  - 限制文件大小

2) **滥用/攻击**  
- Worker 加基本 rate limit（下一期）

3) **隐私**  
- 明确声明“不存储图片”，并确保 Worker 不落盘

## 9. 交付物（MVP）
- 前端代码（Pages）
- Worker API 代码（含环境变量读取）
- 部署说明（README）：
  - Pages 如何部署
  - Worker 如何部署与绑定路由
  - 如何配置 `REMOVEBG_API_KEY`
- 简单测试说明（上传几张示例图验证）
