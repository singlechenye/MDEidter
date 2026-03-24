# 贡献指南

感谢你对 Markdown Editor 项目的关注！本文档将帮助你了解如何为项目做出贡献。

## 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境设置](#开发环境设置)
- [项目结构](#项目结构)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [报告问题](#报告问题)
- [功能建议](#功能建议)

## 行为准则

- 尊重所有贡献者
- 保持友好和建设性的讨论
- 接受建设性批评
- 关注对社区最有利的事情

## 如何贡献

### 贡献方式

1. **报告 Bug** - 提交 Issue 描述问题
2. **建议功能** - 提交 Issue 描述新功能想法
3. **改进文档** - 修复拼写错误或改进说明
4. **提交代码** - 修复 Bug 或实现新功能

### 开始之前

在开始贡献之前，请：

1. 检查是否已有相关的 Issue 或 Pull Request
2. 如果是新功能，先创建 Issue 讨论
3. Fork 仓库并创建功能分支

## 开发环境设置

### 环境要求

- Node.js 18+
- npm 9+
- Git

### 安装步骤

```bash
# Fork 后克隆你的仓库
git clone https://github.com/YOUR_USERNAME/md-editor.git
cd md-editor

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Electron 开发模式 |
| `npm run dev:react` | 仅启动 Web 开发服务器 |
| `npm run build` | 构建前端资源 |
| `npm run build:electron` | 构建 Electron 安装包 |
| `npm test` | 运行测试（监听模式） |
| `npm run test:run` | 运行测试（单次执行） |
| `npm run test:coverage` | 运行测试并生成覆盖率报告 |

## 项目结构

```
md-editor/
├── electron/           # Electron 主进程
│   ├── main.js        # 主窗口和 IPC 处理
│   └── preload.js     # 预加载脚本
├── src/               # React 前端代码
│   ├── components/    # React 组件
│   ├── types/         # TypeScript 类型定义
│   ├── test/          # 测试配置
│   ├── App.tsx        # 主应用组件
│   └── App.css        # 应用样式
├── docs/              # 文档
├── public/            # 静态资源
└── ...配置文件
```

详细结构请参考 [README.md](../README.md#项目结构)。

## 代码规范

### TypeScript

- 使用 TypeScript 编写所有代码
- 为所有函数和组件添加类型注解
- 避免使用 `any` 类型，除非必要

```typescript
// 好的做法
interface Props {
  title: string;
  onClick: () => void;
}

function Button({ title, onClick }: Props) {
  return <button onClick={onClick}>{title}</button>;
}

// 避免的做法
function Button(props: any) {
  return <button>{props.title}</button>;
}
```

### React

- 使用函数式组件和 Hooks
- 组件文件使用 PascalCase 命名
- 一个文件一个组件

```typescript
// 好的做法
function MyComponent({ value }: Props) {
  const [state, setState] = useState(initialState);
  
  useEffect(() => {
    // 副作用
  }, [dependencies]);
  
  return <div>{value}</div>;
}

export default MyComponent;
```

### CSS

- 使用类选择器，避免内联样式
- 遵循 BEM 或类似的命名约定
- 支持暗色和亮色主题

```css
/* 好的做法 */
.tab-bar { }
.tab-bar__item { }
.tab-bar__item--active { }

/* 主题支持 */
body { /* 暗色主题 */ }
body.light { /* 亮色主题 */ }
```

### 文件命名

| 类型 | 命名规范 | 示例 |
|------|----------|------|
| 组件 | PascalCase | `TabBar.tsx` |
| 工具函数 | camelCase | `utils.ts` |
| 类型定义 | camelCase | `types/index.ts` |
| 样式文件 | 与组件同名 | `App.css` |
| 测试文件 | 组件名.test.tsx | `App.test.tsx` |

### ESLint

项目使用 ESLint 进行代码检查：

```bash
# 检查代码规范
npx eslint src/
```

## 提交规范

### Commit Message 格式

使用约定式提交格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构（不添加功能或修复 Bug） |
| `test` | 添加或修改测试 |
| `chore` | 构建过程或辅助工具变动 |

### 示例

```
feat(editor): 添加代码块语法高亮

- 支持 JavaScript、Python、TypeScript 等语言
- 使用 Monaco Editor 内置高亮功能

Closes #123
```

```
fix(tabs): 修复关闭标签页后焦点丢失问题

当关闭当前活动标签页时，自动切换到相邻标签页
```

## Pull Request 流程

### 创建 Pull Request

1. **Fork 仓库** 并克隆到本地

```bash
git clone https://github.com/YOUR_USERNAME/md-editor.git
```

2. **创建分支**

```bash
git checkout -b feature/your-feature-name
```

3. **进行修改** 并提交

```bash
git add .
git commit -m "feat: 添加新功能"
```

4. **推送到你的仓库**

```bash
git push origin feature/your-feature-name
```

5. **创建 Pull Request**
   - 访问原仓库的 Pull Request 页面
   - 点击 "New Pull Request"
   - 选择你的分支并提交

### Pull Request 检查清单

- [ ] 代码通过所有测试
- [ ] 代码符合项目的代码规范
- [ ] 提交信息遵循约定式提交格式
- [ ] 更新了相关文档（如需要）
- [ ] 添加了测试用例（如适用）

### 代码审查

所有 Pull Request 都需要经过审查：

1. 维护者会审查你的代码
2. 可能会提出修改建议
3. 根据反馈进行修改
4. 审查通过后合并

## 报告问题

### Bug 报告

创建 Issue 时请包含：

1. **问题描述** - 清晰描述问题
2. **复现步骤** - 如何复现问题
3. **预期行为** - 期望发生什么
4. **实际行为** - 实际发生了什么
5. **环境信息** - 操作系统、Node.js 版本等
6. **截图** - 如适用

### Issue 模板

```markdown
## 问题描述
[清晰描述问题]

## 复现步骤
1. 打开应用
2. 点击 '...'
3. 滚动到 '...'
4. 看到错误

## 预期行为
[描述预期行为]

## 实际行为
[描述实际行为]

## 环境信息
- 操作系统: [如 Windows 11]
- Node.js 版本: [如 18.17.0]
- 应用版本: [如 1.0.0]

## 截图
[如有截图请添加]
```

## 功能建议

### 提交功能建议

创建 Issue 时请包含：

1. **功能描述** - 详细描述建议的功能
2. **使用场景** - 为什么需要这个功能
3. **实现建议** - 如有想法，描述可能的实现方式
4. **替代方案** - 考虑过的其他方案

### 功能建议模板

```markdown
## 功能描述
[详细描述建议的功能]

## 使用场景
[描述为什么需要这个功能]

## 实现建议
[描述可能的实现方式]

## 替代方案
[描述考虑过的其他方案]

## 附加信息
[其他相关信息]
```

## 开发提示

### 调试技巧

**React DevTools**
- 安装浏览器扩展进行组件调试

**Electron DevTools**
- 开发模式下自动打开 DevTools
- 使用 `console.log` 调试渲染进程
- 使用 `--inspect` 标志调试主进程

**VS Code 调试**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Main Process",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "program": "${workspaceFolder}/electron/main.js"
    }
  ]
}
```

### 常见问题

**Electron 依赖下载失败**
- 使用浏览器模式开发：`npm run dev:react`
- 或配置镜像源

**Monaco Editor 加载慢**
- 首次加载需要下载 worker 文件
- 后续会使用缓存

**测试失败**
- 检查 Node.js 版本
- 清除 node_modules 重新安装

## 获取帮助

- 查看 [README.md](../README.md)
- 查看 [ARCHITECTURE.md](./ARCHITECTURE.md)
- 查看 [API.md](./API.md)
- 创建 Issue 提问

---

再次感谢你的贡献！