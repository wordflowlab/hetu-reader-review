# 河图试读工作台

> 把固定试读版本、不同读者意见和修改决定组织成可复核的多轮过程。

## 使用

从[GitHub v0.1.0发行](https://github.com/wordflowlab/hetu-reader-review/releases/tag/v0.1.0)获取固定运行包。安装到河图后，在当前Codex等Agent会话发现插件并读取同包Skill，说明目标即可。所有正常业务经河图CLI/MCP完成，桌面用于阅读、比较、反馈和可选编辑。

## 开发

Node25，使用npm ci、npm run build、npm run check和npm run test:unit。专业数据和动作以[功能清单](CAPABILITIES.md)及manifest为准；完整设计、用户用例与发布验收见[docs](docs/README.md)。

## 边界

离线包不自动发送或上传。真实读者和Agent模拟分开，模拟意见不计真实人数或满意度。反馈固定包摘要与选区序号，原始意见保持，处理决定另存；新版不静默套旧坐标。包内JavaScript只维护本机表单及下载JSON，嵌入内容转义，不执行反馈中的代码。

正文采纳和定稿由宿主及作者决定。
