# 第 13 章：Hooks 层：业务逻辑桥梁
源地址：https://github.com/zhu1090093659/claude-code
## 本章导读

读完本章，你应该能够：

1. 说清楚 `src/hooks/` 目录的整体职责模型，以及为什么 REPL.tsx 需要把业务逻辑下沉到这一层
2. 追踪 `useCanUseTool.tsx` 的三路权限决策路径，理解投机分类器和用户对话框如何通过 `Promise.race` 竞争
3. 解释 `useLogMessages.ts` 的批处理机制，明白为什么流式 token 不能每个都触发一次 `setState`
4. 理解 `useCommandQueue.ts` 如何保证斜杠命令的串行执行，以及 `LocalJSXCommand` 是如何把 React 元素注入消息流的
5. 读懂 `useTextInput.ts` 的光标与选区状态机，以及它是如何处理 IME 中文输入的
6. 解释 `useTypeahead.tsx` 的命令模式和文件模式两套补全路径的差异
7. 理解 `useReplBridge.tsx` 的双向同步模型，知道本地 REPL 和远程客户端之间的数据流向
8. 区分 `toolPermission/` 三个权限处理器各自的使用场景

---

第 11 章在介绍 REPL.tsx 时多次提到"这里通过某个 hook 实现"，然后略过了细节。这种处理方式是有意为之的——如果在讲 REPL 结构的同时把每个 hook 都展开，篇幅会失控，而且会把两件不同的事混在一起：REPL 的结构（用什么数据、触发什么操作）和 hook 的实现（数据如何到达、操作如何发出）。

这一章就是补齐那些"略过的细节"。

`src/hooks/` 目录约有 100 个文件，是 REPL.tsx 的"基础设施层"。这一层的核心价值在于分离关注点：REPL.tsx 只关心用什么，hook 只关心怎么做。后端系统（QueryEngine、命令注册表、权限系统）完全不知道 React 的存在，hook 层是让它们和 React 世界互相理解的翻译器。

一个很直观的类比是 TCP/IP 的分层模型：REPL.tsx 是应用层，hooks 是传输层，底层系统是网络层。每一层只和相邻层打交道，不需要了解其他层的内部实现。这种分层带来的好处是双向的——你可以在不改动 REPL.tsx 的情况下优化 hook 的实现，也可以在不改动底层系统的情况下调整 React 侧的状态管理策略。

---

## 13.1 Hooks 层的整体角色

在开始逐个介绍 hook 之前，先建立一个统一的理解框架。

`src/hooks/` 里的文件承担的不是同一种职责。有些 hook 是"数据桥"，把非 React 世界的数据流搬运到 React 状态（`useLogMessages`）；有些是"操作桥"，把用户交互转化为对底层系统的调用（`useCommandQueue`）；有些是"状态机"，封装复杂的本地 UI 状态（`useTextInput`）；还有些是"策略路由器"，根据当前运行模式选择不同的处理路径（`useCanUseTool`）。

无论哪种类型，它们都遵循同一个设计原则：hook 内部可以有任何复杂性，但对外暴露的接口必须简单。REPL.tsx 调用这些 hook 时，不应该需要理解任何底层细节。

这也解释了为什么 Claude Code 的 hooks 层这么厚重——3000 行的 REPL.tsx 对应的是大约 100 个 hook 文件，这个比例反映了开发者有意地把复杂性"藏"进 hook 层，保持顶层组件的可读性。

---

## 13.2 useCanUseTool.tsx：权限决策中枢

在阅读这个文件之前，需要一个警告：`useCanUseTool.tsx` 是 React Compiler 的输出文件，而不是手写代码。React Compiler 会把普通的 React 代码转换为高度优化的版本，其中包括大量的 `_c()` 缓存调用、临时变量和展开的条件分支。如果你直接打开这个文件，会看到类似这样的代码：

```typescript
// React Compiler generated output — do not try to read this as idiomatic React
const _c = useMemo();
const $ = _c(24);
let t0;
if ($[0] !== permissionGranted) {
  t0 = (t1 = computeCanUseToolResult(...))
  $[0] = permissionGranted;
  $[1] = t1;
} else {
  t1 = $[1];
}
```

这不是人写的，也不需要一行一行地读懂。理解它的正确方式是看它"在做什么"，而不是"怎么写的"。

### 三路策略路由

`useCanUseTool` 实现的核心是 `CanUseToolFn` 类型的函数，这个函数会被注入到 `ToolUseContext`，供整个 REPL 树消费。它的职责是：当任意工具请求执行权限时，决定该批准、拒绝还是让用户决定。

决策逻辑的第一步是确定"谁来决定"。Claude Code 有三种运行模式，对应三条完全不同的权限处理路径：

```typescript
// Strategy routing based on current execution mode
function useCanUseTool(): CanUseToolFn {
  const mode = useExecutionMode()

  if (mode === 'coordinator') {
    // Forward permission requests to the leader agent
    return useCoordinatorPermissions()
  }

  if (mode === 'swarm-worker') {
    // Proxy permission requests via IPC to the leader
    return useSwarmPermissions()
  }

  // Default: interactive REPL mode, show dialog to user
  return useInteractivePermissions()
}
```

协调者模式（coordinator）下，当前实例是多 Agent 任务的协调者。它收到的权限请求不由自己决定，而是转发给"领导者" Agent，等待对方的批准信号回来。

群组工作者模式（swarm-worker）下，当前实例是群组任务的一个工作单元。它通过 IPC（进程间通信）把权限请求代理给领导者，整个过程对上层代码透明——工具调用方不需要知道权限决策是本地发生的还是跨进程发生的。

默认的交互模式（interactive）就是普通用户在 REPL 里看到的那个流程：弹出对话框，等待用户点击允许或拒绝。

### 交互模式的完整决策流程

交互模式下的权限决策是最复杂的一条路径，值得完整追踪一遍。

第一步，工具调用自己的 `checkPermissions()` 方法。每个工具都实现了这个方法，可以在这里执行自定义的前置检查（比如检查文件路径是否在允许的目录范围内）。如果工具的 `checkPermissions()` 直接返回"允许"，整个流程就此结束，无需进一步询问。

第二步，检查 `settings.json` 里的 `allow` / `deny` 规则。用户可以通过 `/config` 命令预设规则，比如"总是允许对 `src/` 目录下的文件读操作"或"总是拒绝对 `~/.ssh/` 的任何访问"。这一步如果命中规则，同样直接返回结果。

第三步，如果前两步都没有定论，进入"竞速"阶段。这是整个决策流程里最有意思的设计：

```typescript
// Race between speculative auto-approval and user dialog
const decision = await Promise.race([
  speculativeClassifier(tool, args, { timeoutMs: 2000 }),
  waitForUserDialog(tool, args)
])
```

`speculativeClassifier` 是一个投机分类器。它的逻辑是：对于某些明显低风险的操作（比如只读取一个普通代码文件），没有必要打断用户，可以自动批准。分类器会在 2000 毫秒内给出判断，如果它先于用户点击给出了"自动批准"的结论，用户可能根本没看到弹窗就结束了（或者看到弹窗一闪而过）。

如果 2000 毫秒内分类器无法自动处理（比如命令风险较高），用户的手动确认就成了最终决定。用户点击"允许一次"、"总是允许"或"拒绝"，决策返回。

### PermissionDecisionReason 的九种状态

每次权限决策都会附带一个 `PermissionDecisionReason`，记录"是什么原因导致了这个决策"。这个枚举有 9 种值：

`settings-allow` 和 `settings-deny` 对应配置文件规则命中。`coordinator-allow` 和 `coordinator-deny` 对应协调者模式下领导者的决策。`speculative-allow` 对应投机分类器的自动批准。`interactive-allow-once`、`interactive-allow-always`、`interactive-deny` 对应用户在对话框里的三个操作选项。`worker-proxy` 对应群组工作者通过 IPC 代理的情况。

这九种状态不仅用于日志和审计，也直接影响后续行为——比如 `interactive-allow-always` 会触发把该规则写入 `settings.json` 的操作，下次遇到相同工具调用时直接命中 `settings-allow`，不再询问。

---

## 13.3 useLogMessages.ts：消息流桥梁

`src/hooks/useLogMessages.ts` 解决的是一个经典的"异步世界和同步世界的阻抗匹配"问题：QueryEngine 工作时持续发出 `StreamEvent`，这是一个异步事件流；React 的状态更新是同步触发的，渲染是批量执行的。如何在两者之间搭一座桥，让 REPL 能流畅显示流式内容，是这个 hook 的核心设计问题。

### 订阅与生命周期

hook 初始化时，通过 `AbortController` 信号订阅 QueryEngine 的事件流。AbortController 的作用是生命周期管理——当组件卸载或当前 query 被中断时，AbortController 发出取消信号，消费循环干净地退出，不会在已卸载的组件上调用 `setState` 触发 React 警告。

```typescript
// Lifecycle-bound subscription to the QueryEngine event stream
function useLogMessages(sessionId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    abortRef.current = controller

    subscribeToQueryEvents(sessionId, controller.signal, (events) => {
      // Batch update: apply multiple events in a single setState call
      setMessages(prev => events.reduce(applyStreamEvent, prev))
    })

    return () => controller.abort()
  }, [sessionId])

  return messages
}
```

### 批处理机制

这里有一个性能问题值得深究。模型在流式输出时，每产出一个 token 就触发一次 `StreamEvent`。一个中等速度的模型每秒可以产出 30 到 60 个 token。如果每个 token 都触发一次 `setMessages`，就会每秒产生 30 到 60 次 React 重渲染。在终端环境里，Ink 的渲染代价比 DOM 渲染更重，这个频率会让界面明显卡顿。

解决方案是在 16 毫秒（一帧的时间）内收集所有到达的事件，然后把它们合并为一次 `setState`。实现上用的是 `requestAnimationFrame` 或者 `setInterval(fn, 16)` 作为"帧边界"的信号：

```typescript
// Accumulate events between frame boundaries, then flush as a single update
const pendingEvents = useRef<StreamEvent[]>([])

useEffect(() => {
  const flush = () => {
    if (pendingEvents.current.length === 0) return
    const events = pendingEvents.current.splice(0)
    setMessages(prev => events.reduce(applyStreamEvent, prev))
  }

  const frameId = setInterval(flush, 16)
  return () => clearInterval(frameId)
}, [])
```

用户感知到的是连续的文字流，底层实现是每帧最多触发一次渲染。这是一个用"轻微的延迟"换取"界面流畅性"的典型权衡，16 毫秒的延迟对人眼完全不可感知。

### 消息规范化

`applyStreamEvent` 函数负责把协议层的 `StreamEvent` 翻译成 UI 层的 `Message` 格式。这个函数是一个纯函数，接受当前消息列表和一个新事件，返回更新后的消息列表。

不同类型的 StreamEvent 对应不同的处理逻辑：文本 token 事件会找到当前正在生成的 `AssistantMessage` 并追加内容；工具调用开始事件会创建新的 `ToolUseMessage`；工具执行完成事件会把对应的 `ToolResultMessage` 追加进来；会话压缩事件则会把一段消息范围替换为 `TombstoneMessage`。

这个设计把"如何响应事件"的知识集中在 `applyStreamEvent` 里，hook 本身不需要理解业务语义，只负责调度。

---

## 13.4 useCommandQueue.ts：斜杠命令调度

斜杠命令（`/help`、`/compact`、`/config` 等）看起来只是普通文本输入，但它们需要一套独立的执行机制：命令可能需要做异步操作，命令执行期间不应该再执行另一条命令，命令的输出（有时是 React 元素）需要被注入消息流显示。`useCommandQueue.ts` 封装了这整套机制。

### 入队与调度

REPL.tsx 通过这个 hook 获得一个 `enqueueCommand(input: string)` 函数。当用户提交输入时，REPL 先检查输入是否以 `/` 开头，如果是，就调用 `enqueueCommand` 而不是直接提交给 QueryEngine。

"队列"这个设计选择是为了防止并发执行。考虑这样一个场景：`/config` 命令打开了配置界面，用户还没退出，又触发了另一个命令。如果允许并发，两条命令会同时改动 REPL 状态，产生难以预料的结果。队列保证了前一条命令完全执行完毕之后，下一条才开始。

```typescript
// Command queue: ensure sequential execution
function useCommandQueue() {
  const queue = useRef<PendingCommand[]>([])
  const isRunning = useRef(false)

  const processNext = useCallback(async () => {
    if (isRunning.current || queue.current.length === 0) return
    isRunning.current = true

    const { input, resolve } = queue.current.shift()!
    try {
      await executeCommand(input)
    } finally {
      isRunning.current = false
      resolve()
      processNext() // Kick off the next command if any
    }
  }, [])

  const enqueueCommand = useCallback((input: string) => {
    return new Promise<void>(resolve => {
      queue.current.push({ input, resolve })
      processNext()
    })
  }, [processNext])

  return { enqueueCommand }
}
```

### 命令查找与执行

`executeCommand` 内部调用 `findCommand(input)` 从命令注册表里查找匹配的命令定义。命令注册表在第 8 章有完整介绍，这里只需要知道它是一个以命令名为 key 的 Map，每个值是包含 `name`、`description`、`run` 方法的命令对象。

`findCommand` 支持前缀匹配，所以 `/comp` 会匹配到 `/compact`（如果没有歧义的话）。找到命令后，调用 `command.run(args, context)` 执行，其中 `context` 是 `ToolUseContext`，让命令可以访问当前会话的完整上下文。

### LocalJSXCommand 的特殊处理

命令的执行结果有两种形态。大多数命令只产生副作用（比如 `/clear` 清空历史），或者通过修改全局状态来改变界面。但有一类命令的结果是 React 元素——这类命令实现了 `LocalJSXCommand` 接口：

```typescript
// Commands that return React elements for inline display
interface LocalJSXCommand extends Command {
  run(args: string[], ctx: ToolUseContext): JSX.Element | Promise<JSX.Element>
}
```

`/help` 命令是典型的例子：它不修改任何状态，只是返回一个格式化好的帮助文本 React 元素。`useCommandQueue` 检测到返回值是 React 元素时，会把它包装成一条 `SystemMessage` 注入消息列表，让它像普通消息一样显示在对话流里。

命令执行完成后，hook 调用 `notifyCommandLifecycle(uuid, 'completed')` 通知生命周期系统。这个通知机制让其他部分（比如 StatusBar 的"正在执行命令..."指示器）可以响应命令的开始和结束事件，而不需要直接耦合到命令执行逻辑。

---

## 13.5 useTextInput.ts：输入框状态机

`PromptInput` 组件（第 11 章简要介绍过）是用户和 Claude Code 交互的主要入口。它的所有本地状态都由 `useTextInput.ts` 管理。这个 hook 比看起来复杂——因为它在一个没有浏览器 DOM 的环境里，用纯 JavaScript 实现了一套完整的文本编辑器状态机。

### 状态模型

hook 维护的状态包含以下字段：

```typescript
interface TextInputState {
  value: string           // Current input text content
  cursorPosition: number  // Cursor index in Unicode code points
  selectionStart: number  // Selection range start (or -1 if no selection)
  selectionEnd: number    // Selection range end
  history: string[]       // Command history list
  historyIndex: number    // Current history navigation position
  isComposing: boolean    // IME composition in progress flag
  yankBuffer: string      // Yank (cut) buffer for Ctrl+K / Ctrl+Y
}
```

`cursorPosition` 用的是 Unicode 码点索引而不是字节索引。这个区别对中文用户很重要——一个汉字在 UTF-8 里是 3 个字节，但只占 1 个"字符位置"。光标的视觉位置和实际的字符移动都应该以码点为单位，否则在中英文混排时光标会"跳"。

### 键盘事件处理

对键盘事件的处理是这个 hook 代码量最大的部分。主要的按键逻辑：

方向键负责光标移动。`←` 和 `→` 按码点移动一个字符，`Home` / `End` 跳到行首行尾。对于多行输入，`↑` 和 `↓` 需要计算换行符的位置，找到上下行的对应列位置。这个计算不复杂，但需要小心处理"当前行比目标行短"的边界情况——此时光标应该停在目标行的末尾而不是越界。

`Ctrl+A` 和 `Ctrl+E` 是 Emacs 风格的快捷键，分别跳到行首和行尾。这是终端编辑器的传统约定，熟悉命令行的用户会自然使用它们。

`Ctrl+K` 删除从光标位置到行尾的所有内容，并把删除的文字存入 `yankBuffer`（"剪切"操作）。`Ctrl+Y` 把 `yankBuffer` 的内容粘贴到当前光标位置。这对 Emacs 用户来说很熟悉，对其他用户来说是一个不常用但有时很有价值的快捷键。

`↑` 和 `↓` 在没有选区时触发历史导航。`historyIndex` 从 `-1`（表示"当前新输入"）往历史方向递增。当用户按 `↑` 时，如果 `historyIndex` 是 `-1`，先把当前输入文本保存起来（以便按 `↓` 回来时恢复），然后显示最近一条历史记录。再按 `↑` 继续往前翻。按 `↓` 向前翻回来，回到 `-1` 时恢复刚才保存的输入。

`Enter` 提交输入，`Shift+Enter` 插入软换行。这个区分让多行输入成为可能——用户可以用 `Shift+Enter` 撰写多段提问，用 `Enter` 最终提交。

### IME 中文输入处理

IME（输入法编辑器）是终端里处理中文输入的一个挑战。在 Web 环境里，浏览器提供了 `compositionstart` / `compositionend` 事件来标识 IME 组合过程。在 Ink 的终端环境里，没有这些原生事件，只有原始的按键序列。

`isComposing` 标志的作用是在 IME 组合过程中暂停某些快捷键的响应。比如，当用户正在输入拼音时（如 `zhong`），这段拼音字母在"组合完成"之前不应该触发"移动光标"操作。`useTextInput` 通过检测特定的控制序列来判断 IME 状态，设置 `isComposing` 为 `true`，然后在收到组合确认序列后把结果字符插入 `value` 并清除 `isComposing` 标志。

---

## 13.6 useTypeahead.tsx：命令与文件补全

当用户在输入框里打 `/` 或 `@` 时，REPL 会弹出一个补全面板，显示匹配的候选项。这个功能的实现分成两层：`useTypeahead.tsx` 负责数据逻辑（计算候选列表），`FuzzyPicker` 组件（第 12 章介绍过）负责渲染。

### 触发模式识别

hook 首先需要判断当前处于哪种补全模式：

```typescript
// Detect completion mode from current input prefix
function detectCompletionMode(value: string, cursorPosition: number) {
  const textUpToCursor = value.slice(0, cursorPosition)

  if (textUpToCursor.startsWith('/')) {
    return { mode: 'command', prefix: textUpToCursor.slice(1) }
  }

  const atIndex = textUpToCursor.lastIndexOf('@')
  if (atIndex !== -1) {
    return { mode: 'file', prefix: textUpToCursor.slice(atIndex + 1) }
  }

  return { mode: 'none', prefix: '' }
}
```

`@` 的检测用 `lastIndexOf` 而不是 `indexOf`，因为输入里可能有多个 `@`（引用多个文件），补全应该针对光标最近的那个 `@` 之后的内容。

### 命令模式补全

命令模式下，候选列表来自命令注册表。hook 拿到注册表里所有可用命令的列表，然后用 FuzzyPicker 的匹配算法过滤和排序：

用户输入的前缀不需要精确匹配命令名，而是模糊匹配。比如输入 `cmp` 可以匹配 `compact`，因为这三个字母按顺序出现在 `compact` 里。FuzzyPicker 的匹配算法会给每个候选项计算一个匹配分数，分数越高排名越靠前。

命令的描述文字也参与匹配。如果用户输入 `history`，即使没有叫 `history` 的命令，也可能匹配到描述里包含"history"的 `/search-history` 命令。这让不记得精确命令名的用户也能通过语义搜索找到想要的功能。

### 文件模式补全

文件模式下，补全逻辑更复杂，因为需要和文件系统交互：

```typescript
// File completion: read directory and filter results
async function getFileCompletions(prefix: string) {
  const dirPath = path.dirname(prefix) || '.'
  const filePrefix = path.basename(prefix)

  const entries = await fs.readdir(dirPath, { withFileTypes: true })

  return entries
    .filter(entry => !entry.name.startsWith('.'))          // Hide dotfiles
    .filter(entry => !isGitIgnored(path.join(dirPath, entry.name)))  // Respect .gitignore
    .filter(entry => entry.name.startsWith(filePrefix))    // Match current prefix
    .map(entry => ({
      label: entry.name,
      value: path.join(dirPath, entry.name),
      isDirectory: entry.isDirectory()
    }))
}
```

路径的解析是递进式的——用户输入 `@src/` 时，补全切换到 `src/` 目录列出其子项；输入 `@src/hooks/use` 时，只列出 `src/hooks/` 里以 `use` 开头的文件。目录项在选择后会自动追加 `/` 而不是直接完成，让用户可以继续往下层导航。

`.gitignore` 中排除的文件不出现在补全列表里。这是一个实用的设计决策——用户通常不想引用 `node_modules/`、`dist/` 这类目录里的文件。

### Hook 的返回接口

```typescript
// The interface returned by useTypeahead
interface TypeaheadResult {
  items: CompletionItem[]   // Current candidate list
  selectedIndex: number     // Highlighted item index
  isVisible: boolean        // Whether the completion panel should show
  accept: () => void        // Confirm and insert the selected item
  dismiss: () => void       // Close the completion panel
}
```

REPL.tsx 把 `items` 和 `isVisible` 传给 FuzzyPicker 组件渲染，把 `accept` 和 `dismiss` 绑定到对应的键盘事件（Tab / Esc）。数据逻辑和渲染的分离让替换补全 UI 实现变得容易——只要新 UI 接受相同的 props，就可以无缝替换 FuzzyPicker，而不需要改动 `useTypeahead` 里的任何逻辑。

---

## 13.7 useReplBridge.tsx：远程客户端同步

Claude Code 有一个相对鲜为人知的功能：支持远程客户端（比如移动端 App 或 Web 界面）连接到正在运行的 REPL 会话，查看对话内容，甚至发送输入。`useReplBridge.tsx` 是本地 REPL 侧的同步逻辑。

### 双向数据流

桥接的工作方向是双向的：

本地变化推送到远程。消息列表更新、输入框内容变化、权限对话框出现/消失——这些本地状态变化都需要增量同步给远程客户端。hook 通过 `useEffect` 监听相关状态，在检测到变化时调用 `src/bridge/` 模块发送差量更新。

远程操作注入本地。远程客户端可以发送文字输入或触发操作，这些来自远程的"命令"需要被注入本地 REPL 的执行流。hook 订阅桥接层的入站消息，把收到的远程输入转化为本地 `enqueueCommand` 调用，就像用户在本地键盘上打了同样的内容。

```typescript
// Bidirectional bridge: local -> remote and remote -> local
function useReplBridge() {
  const { messages, inputValue } = useReplState()
  const { enqueueCommand } = useCommandQueue()

  // Outbound: push local state changes to remote clients
  useEffect(() => {
    bridge.sendUpdate({ type: 'messages', data: messages })
  }, [messages])

  useEffect(() => {
    bridge.sendUpdate({ type: 'input', data: inputValue })
  }, [inputValue])

  // Inbound: receive remote commands and inject into local queue
  useEffect(() => {
    const unsubscribe = bridge.onRemoteCommand((cmd) => {
      enqueueCommand(cmd.input)
    })
    return unsubscribe
  }, [enqueueCommand])
}
```

### 增量更新策略

把整个消息列表在每次变化时全量发送给远程客户端代价太高。特别是对话进行了一段时间之后，消息列表可能已经有几百条记录，每次追加一条消息就全量传输是不合理的。

实际实现用的是增量协议：每条消息有一个单调递增的序列号，远程客户端本地也维护一份消息列表，桥接层只传输远程客户端还没有的新消息（基于序列号差）和发生了变化的消息（基于内容哈希）。这让同步开销保持在 O(变化量) 而不是 O(历史总量)。

桥接功能并非 Claude Code 的核心使用场景，大多数用户不会直接感知到它的存在。但它作为扩展点的存在，让 Claude Code 的交互模式可以超越单一终端窗口的限制。

---

## 13.8 toolPermission/ 子目录：三个权限处理器

`src/hooks/toolPermission/` 是 13.2 节里三路策略的具体实现所在地。前面我们从 `useCanUseTool` 的角度描述了路由逻辑，这一节深入每个处理器的内部。

### coordinatorPermissions.ts

协调者模式下，当前实例是多 Agent 任务的协调者。它的权限处理逻辑是：收到工具权限请求时，把请求序列化（工具名、参数、请求 ID）通过特定的消息通道发送给领导者 Agent；然后阻塞等待，直到收到领导者返回的批准或拒绝信号；用收到的决策作为权限检查的结果返回。

这里有一个值得注意的实现细节：等待领导者响应是一个异步操作，而且领导者可能很慢（它可能在等待自己的用户输入，或者在处理其他事情）。超时处理是必要的——如果等待时间超过阈值，处理器会升级为"向用户展示错误提示"，而不是无限等待。

```typescript
// Coordinator: forward request and await leader decision
async function coordinatorCanUseTool(
  tool: Tool,
  args: unknown,
  ctx: ToolUseContext
): Promise<PermissionResult> {
  const requestId = generateRequestId()

  await sendToLeader({ type: 'permission-request', tool: tool.name, args, requestId })

  const result = await waitForLeaderDecision(requestId, { timeoutMs: 30000 })

  if (result === null) {
    // Timeout: fail safe by denying
    return { allow: false, reason: 'coordinator-deny' }
  }

  return {
    allow: result.approved,
    reason: result.approved ? 'coordinator-allow' : 'coordinator-deny'
  }
}
```

### interactivePermissions.tsx

这是大多数用户每天面对的权限处理器，实现了第 13.2 节描述的完整决策流程。它的独特之处在于需要渲染 UI——权限对话框是一个 React 组件，而这个处理器是在 React 外部（hook 的回调里）被调用的。

这里的关键技术是"Promise 化的 React 渲染"。处理器创建一个 `Promise`，把 `resolve` 和 `reject` 函数存入 ref；然后设置一个状态标志，让 REPL.tsx 显示权限对话框，并把 `resolve` / `reject` 作为对话框的回调注入进去；当用户点击对话框上的按钮时，对话框调用对应的回调，`Promise` 解析，处理器拿到决策结果，对话框消失。

```typescript
// Interactive: bridge between async permission check and React dialog rendering
function useInteractivePermissions() {
  const [dialogState, setDialogState] = useState<DialogState | null>(null)

  const canUseTool: CanUseToolFn = useCallback(async (tool, args, ctx) => {
    // ... settings and tool.checkPermissions() checks first ...

    // Enter the speculative + dialog race
    return new Promise((resolve) => {
      // Set dialog state so REPL renders the permission dialog
      setDialogState({
        tool, args,
        onAllow: () => { setDialogState(null); resolve({ allow: true, reason: 'interactive-allow-once' }) },
        onAllowAlways: () => { setDialogState(null); /* write to settings.json */ resolve({ allow: true, reason: 'interactive-allow-always' }) },
        onDeny: () => { setDialogState(null); resolve({ allow: false, reason: 'interactive-deny' }) }
      })

      // Also start the speculative classifier in parallel
      speculativeClassifier(tool, args, { timeoutMs: 2000 }).then(result => {
        if (result?.autoApprove) {
          setDialogState(null)
          resolve({ allow: true, reason: 'speculative-allow' })
        }
      })
    })
  }, [])

  return { canUseTool, dialogState }
}
```

`dialogState` 被传给 REPL.tsx，由它决定是否渲染 `<PermissionDialog>`。这保持了数据流向的单向性——hook 不直接操控渲染，只更新状态，渲染是 REPL.tsx 响应状态变化的自然结果。

### swarmPermissions.ts

群组工作者模式下，处理器用 IPC（进程间通信）把权限请求代理给领导者。和协调者模式不同的是，这里的通信是跨进程的，不是在同一 JavaScript 进程内通过消息队列传递。

IPC 通信用的是标准输入输出流上的 JSON 消息协议。工作者进程写入一条 JSON 消息到 stdout，领导者进程（父进程）从子进程的 stdout 读取并处理，然后把决策写回子进程的 stdin，工作者进程读取结果。

```typescript
// Swarm worker: proxy permission request to parent process via IPC
async function swarmCanUseTool(tool: Tool, args: unknown): Promise<PermissionResult> {
  const requestId = generateRequestId()

  // Write permission request to stdout as IPC message
  process.stdout.write(JSON.stringify({
    type: 'ipc:permission-request',
    requestId,
    tool: tool.name,
    args
  }) + '\n')

  // Wait for leader's response on stdin
  const response = await readIpcResponse(requestId)

  return {
    allow: response.approved,
    reason: 'worker-proxy'
  }
}
```

这个设计的好处是简单——IPC 不需要任何额外的网络或共享内存基础设施，只用进程的标准流。代价是工作者进程在等待权限决策期间是阻塞的，无法处理其他任务。但对权限决策这种需要串行等待的场景，这个代价是可接受的。

---

## 关键要点

这一章覆盖了 `src/hooks/` 里最核心的六个 hook 和一个子目录。把它们放在一起，可以提炼出几条贯穿始终的设计原则。

**桥接而非嵌入。** 每个 hook 都是一座桥，连接 React 世界和非 React 世界。底层系统（QueryEngine、命令注册表、权限系统、进程间通信）不知道也不应该知道 React 的存在；hook 层负责翻译，把异步事件流转为 React 状态，把 React 的回调绑定映射为底层操作。

**批处理换流畅性。** `useLogMessages` 的 16ms 批处理是一个典型的性能工程决策：用轻微的、人眼无法感知的延迟，换取界面渲染频率从"每 token 一次"降到"每帧一次"。这种权衡在流式场景里几乎总是值得的。

**策略模式处理多路分支。** `useCanUseTool` 的三路路由、`useTypeahead` 的命令/文件双模式，都是策略模式的实际应用。核心逻辑（路由判断）和具体实现（各路策略）分离，让添加新的运行模式或新的补全类型只需要新增处理器，不需要修改路由代码。

**Promise 化异步等待。** `interactivePermissions.tsx` 里用 `Promise` + `resolve/reject` 的 ref 把"等待用户点击"这个异步操作变成一个返回 Promise 的函数。这个模式在需要"等待某个 UI 事件然后继续执行"的场景里非常有用，值得记住。

下一章将把目光转向 Claude Code 的多 Agent 协作系统，看看当多个 Claude 实例并行工作时，协调机制和状态同步是如何运作的。
