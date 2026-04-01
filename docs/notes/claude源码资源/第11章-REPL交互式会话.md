# 第 11 章：REPL 交互式会话
源地址：https://github.com/zhu1090093659/claude-code
## 本章导读

读完本章，你应该能够：

1. 描述 `src/screens/REPL.tsx` 的顶层组件树结构，以及它如何将第10章的 Ink 框架组织成一个完整的交互式会话界面
2. 追踪一条消息从 QueryEngine 发出的 StreamEvent 到最终显示在终端上的完整管线，包括批处理和虚拟列表渲染两道关键环节
3. 理解 PromptInput 的多线程职责：文本编辑、历史导航、`@` 文件引用展开、括号粘贴保护
4. 解释权限对话框系统如何在工具请求权限时"中断"REPL 的正常输入流，以及三种权限决策的差异
5. 理解 TaskPanel 的实时更新机制，以及它与主消息流的渲染关系
6. 描述多 Agent 协作视图的界面协调策略，特别是子 Agent 权限请求如何代理到主 REPL
7. 解释会话记录搜索（Ctrl+R）的实现逻辑，以及虚拟滚动如何支撑大规模历史导航

---

上一章我们把 Ink 框架从里到外拆开来看，了解了 React Reconciler 的宿主环境模型、Yoga WASM 布局引擎、差量渲染机制。这一章我们要用这套机制构建的东西：`src/screens/REPL.tsx`。

REPL 是 Claude Code 交互模式的全部 UI。从你看到命令行提示符那一刻起，到会话结束，所有的消息显示、用户输入、权限确认、任务监控，都在这个组件里发生。它是 Ink 框架的最重要消费者，也是整个 Claude Code 用户体验的"大脑"。

理解它，就是理解 Claude Code 是如何把 Agent 循环（第5章）、工具系统（第6章）、权限模型（第7章）、QueryEngine（第9章）这些后端能力呈现给用户的。

---

## 11.1 REPL 的顶层结构：五个核心区域

`REPL.tsx` 大约 3000 行，这个体量并不意外。一个同时承担消息显示、输入处理、权限交互、任务监控、多 Agent 协调的组件，不可能"短小精悍"。理解它的第一步是识别它的组件树骨架，而不是陷入细节。

顶层结构可以这样描述：

```tsx
// Conceptual structure of the REPL top-level component
function REPL() {
  return (
    <Box flexDirection="column" height="100%">
      <TaskPanel />         {/* background task monitor (top area) */}
      <MessageList />       {/* conversation history with virtual scroll */}
      <PermissionDialog />  {/* tool permission request dialog (modal overlay) */}
      <PromptInput />       {/* user text input area */}
      <StatusBar />         {/* bottom status bar: model, token count, mode */}
    </Box>
  )
}
```

这个结构反映了终端界面的一个基本约束：布局是线性的，从上到下依次排列。TaskPanel 在最顶部，因为后台任务属于"全局状态"，应该始终可见而不应遮盖内容。MessageList 占据中间最大的区域，它是用户最关心的内容。PermissionDialog 是一个条件渲染的"模态覆盖层"——当工具请求权限时才出现，此时输入框会被禁用。PromptInput 固定在底部，这是 CLI 工具的标准惯例。StatusBar 作为最后一行，提供上下文信息：当前模型名、已用 token 数、是否处于 vim 模式。

这五个区域之间的通信方式很重要。REPL 本身维护了一套共享状态，各子组件通过 props 或 context 订阅其中与自己相关的部分。React 的单向数据流在这里是优势而非限制——每次状态变更，Ink 的差量渲染会精确计算出"哪些行发生了变化"并只重绘那部分，不需要开发者手工管理界面刷新。

---

## 11.2 消息显示管线：从 StreamEvent 到终端字符

一条 AI 回复从"被生成"到"被看见"要经历一条不短的管线。理解这条管线，是理解 REPL 如何保持流畅的关键。

### 第一站：useLogMessages 订阅流事件

QueryEngine（第9章）工作时会持续发出 `StreamEvent`——每当模型产出一个新 token、一个工具调用启动、一个工具执行完成，都会触发对应的事件。`useLogMessages` 是 REPL 订阅这些事件的入口 hook。

```typescript
// Conceptual shape of useLogMessages
function useLogMessages(queryStream: AsyncGenerator<StreamEvent>) {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    // Drain the async generator and update React state
    async function consume() {
      for await (const event of queryStream) {
        setMessages(prev => applyStreamEvent(prev, event))
      }
    }
    consume()
  }, [queryStream])

  return messages
}
```

这里有一个性能陷阱：模型在流式输出时，每个 token 就是一个 `StreamEvent`。如果每个 token 都触发一次 `setMessages` 和一次重渲染，界面会非常卡。解决方案是批处理（batching）。

### 第二站：批处理减少重渲染

批处理的思路是：在短时间窗口内（比如 16 毫秒，一帧的时间）收集所有到来的 StreamEvent，然后把它们一次性应用到状态上，触发一次渲染，而不是每个事件触发一次。

```typescript
// Event batching: accumulate events and flush at frame boundaries
function useBatchedEvents<T>(
  source: AsyncGenerator<T>,
  flushIntervalMs = 16
): T[][] {
  const buffer = useRef<T[]>([])
  const [batches, setBatches] = useState<T[][]>([])

  useEffect(() => {
    // Collect events into buffer
    const collectLoop = async () => {
      for await (const event of source) {
        buffer.current.push(event)
      }
    }

    // Flush buffer at regular intervals
    const flushInterval = setInterval(() => {
      if (buffer.current.length > 0) {
        const batch = buffer.current.splice(0)
        setBatches(prev => [...prev, batch])
      }
    }, flushIntervalMs)

    collectLoop()
    return () => clearInterval(flushInterval)
  }, [source])

  return batches
}
```

这个机制在"模型高速输出 token"和"界面流畅不卡顿"之间取得平衡。用户感知到的是连续的文字流，底层实现是每帧合并多个 token 更新。

### 第三站：消息规范化

StreamEvent 是协议层的概念，UI 层不应该直接渲染它。`applyStreamEvent` 函数负责把各种 StreamEvent 规范化为可显示的 `Message` 格式：

消息类型体系覆盖了 REPL 需要显示的所有内容：

`AssistantMessage` 是最常见的类型，存储模型的文字回复。它支持 Markdown 渲染，代码块会用语法高亮展示。

`ToolUseMessage` 在模型发起工具调用时出现，展示工具名称和调用参数。对于 BashTool，参数里的命令字符串会被特别高亮，让用户一眼看清"即将执行什么命令"。

`ToolResultMessage` 紧接在 ToolUseMessage 之后出现，展示工具执行结果。长输出会被折叠，只显示前几行，并提供展开操作。

`HumanMessage` 是用户输入的回显——当你按下回车提交输入后，你的原始文字会立即作为 HumanMessage 追加到消息列表，给你视觉上的"已发送"反馈。

`SystemMessage` 是系统级通知，比如执行 `/compact` 时的"已压缩对话历史"提示。它通常以不同颜色或样式区分，避免和正常对话混淆。

`TombstoneMessage` 是一个特殊类型：当对话历史被压缩后，原来的消息被替换为 TombstoneMessage，它只显示"此处已压缩 N 条消息"的占位文字，不展示原始内容。这样用户可以知道"这里曾经有内容"，同时不会因为加载全量历史而浪费资源。

### 第四站：虚拟列表渲染

对话历史可以变得很长。如果 MessageList 把所有消息都同时渲染出来，在消息数量多时会产生巨大的计算开销——即使大多数消息根本不在视口内。

虚拟列表（virtual list）的原理是：只渲染当前视口可见的消息，用上下的空白占位符代替视口外的内容，维持滚动位置的感知正确性。当用户滚动时，动态增减渲染的消息范围。

```typescript
// Simplified virtual list for terminal messages
function MessageList({ messages }: { messages: Message[] }) {
  const { scrollOffset, visibleHeight } = useScrollState()

  // Compute which messages fall within the visible window
  const visibleMessages = useMemo(() => {
    return messages.filter((msg, index) => {
      const msgTop = computeMessageTop(messages, index)
      const msgBottom = msgTop + estimateMessageHeight(msg)
      return msgBottom > scrollOffset && msgTop < scrollOffset + visibleHeight
    })
  }, [messages, scrollOffset, visibleHeight])

  return (
    <Box flexDirection="column">
      {/* Top spacer: represents collapsed messages above viewport */}
      <Box height={topSpacerHeight} />
      {visibleMessages.map(msg => (
        <MessageItem key={msg.id} message={msg} />
      ))}
      {/* Bottom spacer: represents collapsed messages below viewport */}
      <Box height={bottomSpacerHeight} />
    </Box>
  )
}
```

在终端里实现虚拟列表比在浏览器里更复杂，因为终端没有 CSS overflow 和 scrollTop 这样的原生概念，所有的"视口"和"滚动"概念都是 Ink 层模拟出来的。第10章里关于虚拟滚动的实现是 MessageList 工作的基础。

---

## 11.3 PromptInput：不只是一个文本框

`src/components/PromptInput/` 是用户与 REPL 交互的唯一入口。它看起来只是一个输入框，但承担的职责远不止文本编辑。

### 基础编辑行为

PromptInput 支持多行输入。在终端里，回车键（Enter）有两种语义：在 shell 里它意味着"执行命令"，在 Claude Code 里它意味着"提交消息给 AI"。但有时候用户需要在消息里换行，比如给出多段指令。

解决方案是区分"软换行"和"硬提交"：

- `Shift+Enter` 或 `Option+Enter`：插入换行符，继续编辑同一条消息
- `Enter`（单独）：提交消息，开始一轮 Agent 处理

这个区分在终端输入处理层实现：raw mode 下，键盘事件以字节序列到达，`Enter` 是 `\r`，`Shift+Enter` 是 `\e[13;2u` 或 `\n`（取决于终端实现）。PromptInput 的键盘事件处理器识别这些序列，做出不同响应。

### 历史记录导航

PromptInput 维护一个命令历史队列，与 shell 的历史机制相似但有几处不同。

`Up` 键浏览上一条历史输入，`Down` 键浏览下一条（或回到当前编辑内容）。这是标准行为。特别之处在于：Claude Code 允许你在浏览历史时编辑历史条目，而不是只能原样重用。当你修改了一条历史记录并按 `Up`/`Down` 离开时，修改会保存为一个新的"草稿历史条目"，不会覆盖原始历史记录。

```typescript
// Conceptual history navigation state
interface HistoryState {
  entries: string[]           // immutable history: oldest to newest
  currentIndex: number        // -1 means "current input (not browsing history)"
  draftAtCurrentIndex: string // edited version of the current history entry
  pendingInput: string        // the input that was in progress before navigating
}
```

这个设计的好处是安全：用户不会因为误操作"破坏"历史记录，随时可以在修改后的历史和原始历史之间来回切换。

### `@` 文件引用

在输入框里输入 `@path/to/file`，PromptInput 会自动把这个路径展开为文件内容，插入到消息里。

具体流程是：当检测到 `@` 字符后跟随一个有效的文件路径时，PromptInput 调用文件系统 API 读取文件内容，用文件内容替换 `@path/to/file` 这段文字。替换发生在"提交时"而不是"输入时"——即用户按下 Enter 的那一刻，而不是在打字过程中实时替换（避免影响编辑体验）。

`@` 引用还触发了 typeahead 补全（下一节详述）：输入 `@` 之后，输入框上方会弹出文件路径候选列表。

### 括号粘贴（Bracketed Paste）保护

终端里有一个长期存在的坑：当用户粘贴一大段文字时，如果这段文字里恰好包含换行符，终端会把每个换行符都解读为"提交"，导致多条空行或命令被意外提交。

括号粘贴模式（bracketed paste mode）是一个终端协议扩展：当终端支持它时，粘贴的内容会被 `\e[200~` 和 `\e[201~` 两个特殊序列包围。PromptInput 检测这两个序列，把它们之间的全部内容当作"一整块粘贴文字"处理，而不是逐字符地响应键盘事件。这样，粘贴里的换行符就不会意外触发提交。

```typescript
// Paste mode state machine in the input handler
function handleRawInput(chunk: Buffer, state: InputState): InputState {
  const str = chunk.toString()

  if (str === '\x1b[200~') {
    // Start of bracketed paste: switch to paste collection mode
    return { ...state, inBracketedPaste: true, pasteBuffer: '' }
  }

  if (str === '\x1b[201~') {
    // End of bracketed paste: commit the entire paste as a single insertion
    return { ...state, inBracketedPaste: false, text: state.text + state.pasteBuffer }
  }

  if (state.inBracketedPaste) {
    // Accumulate paste content without triggering any key bindings
    return { ...state, pasteBuffer: state.pasteBuffer + str }
  }

  // Normal key handling
  return handleNormalKey(str, state)
}
```

---

## 11.4 Typeahead 补全：命令和文件的模糊搜索

Typeahead 是 PromptInput 最具交互感的特性。它在输入框上方渲染一个浮动列表，根据用户的当前输入实时过滤候选项。

### 两种触发场景

第一种：以 `/` 开头触发命令补全。输入 `/` 时，候选列表显示所有可用的斜杠命令（`/help`、`/clear`、`/compact` 等）。继续输入字符会做模糊匹配过滤，比如输入 `/cl` 会同时匹配 `/clear` 和 `/claude-model`。

第二种：以 `@` 开头触发文件路径补全。输入 `@` 时，候选列表从当前工作目录开始列出文件和目录。继续输入路径段会缩小候选范围，比如 `@src/comp` 会匹配 `src/components/`、`src/compiler/` 等。

这两种场景共享同一套 UI 组件框架（`FuzzyPicker`），区别只在于候选数据来源不同——前者来自命令注册表，后者来自文件系统 API。

### FuzzyPicker 的模糊匹配

`FuzzyPicker` 使用模糊匹配算法而不是前缀匹配，这意味着用户不需要精确记住命令的完整名字。对于命令补全，输入 `cmp` 可以匹配 `/compact`；对于文件补全，输入 `rpl` 可以匹配 `src/screens/REPL.tsx`。

匹配时对大小写不敏感，结果按照匹配质量排序（连续字符匹配优先于分散字符匹配）。

```typescript
// Simplified FuzzyPicker usage in typeahead context
function useTypeahead(inputText: string) {
  const triggerChar = inputText[0]
  const query = inputText.slice(1)  // text after the trigger character

  const candidates = useMemo(() => {
    if (triggerChar === '/') return getAllCommands()
    if (triggerChar === '@') return listFilesMatchingPrefix(query)
    return []
  }, [triggerChar, query])

  const filtered = useMemo(
    () => fuzzyFilter(candidates, query),
    [candidates, query]
  )

  return filtered
}
```

### 候选列表的交互

候选列表在输入框上方（而不是下方）弹出，因为输入框位于屏幕底部，向上弹出才不会被截断。

用户可以用 `Up`/`Down` 在候选列表里移动焦点，`Tab` 选中当前高亮项并将其补全到输入框，`Escape` 关闭候选列表回到普通输入状态。

补全操作是"替换当前词"而不是"在光标处插入"：如果光标在 `/cl` 之后，选中 `/clear` 会把 `/cl` 整体替换为 `/clear`，而不是追加 `ear`。

---

## 11.5 权限对话框：工具请求的中断与确认

Claude Code 的安全模型（第7章）要求某些工具调用必须经过用户确认。权限对话框是这个机制在界面上的体现。

### 中断模型

当 Agent 循环（第5章）执行到一个工具调用、而该工具的权限状态是"需要询问用户"时，它会暂停，等待用户决策。REPL 会检测到这个等待状态，将 `PermissionDialog` 渲染为可见，同时禁用 `PromptInput`（避免用户输入其他内容干扰当前流程）。

从用户角度看，这是一个"模态确认"：屏幕上出现了一个请求框，必须明确回应才能继续。从实现角度看，这是 Agent 循环里 `canUseTool()` 函数返回的 Promise 暂停了 Generator 的推进，REPL 通过响应这个 Promise 的状态变化来更新界面。

```typescript
// Simplified permission dialog state management
function usePermissionDialog() {
  const [pending, setPending] = useState<PendingPermission | null>(null)

  // Called by Agent loop when a tool needs permission
  function requestPermission(tool: Tool, params: unknown): Promise<PermissionDecision> {
    return new Promise(resolve => {
      setPending({ tool, params, resolve })
    })
  }

  // Called when user clicks a decision button
  function decide(decision: PermissionDecision) {
    pending?.resolve(decision)
    setPending(null)
  }

  return { pending, requestPermission, decide }
}
```

### 三种权限决策

对话框提供三个选项，对应 `PermissionDecisionReason` 的三个值：

`interactive_permanent`（永久允许）：用户信任这个工具，后续所有请求都自动允许。决策结果写入 `settings.json`，下次启动 Claude Code 时依然有效。对于用户高度信任的工具（比如只读的文件搜索），可以选这个避免重复确认。

`interactive_temporary`（临时允许）：仅允许这一次请求，本次会话结束后权限记录消失。适合"我不确定这个工具以后会不会做坏事，但这次的请求我认得出来是安全的"场景。

`deny`（拒绝）：不执行这次工具调用。Agent 循环会收到拒绝信号，通常会向模型报告"工具调用被用户拒绝"，让模型决定后续步骤。

```typescript
// Permission decision types
type PermissionDecisionReason =
  | 'interactive_permanent'  // persist to settings.json
  | 'interactive_temporary'  // valid only for this session
  | 'deny'                   // reject this invocation
```

### 对话框的信息展示

对话框不只是"允许/拒绝"两个按钮，它还需要让用户清楚地看到"正在请求什么"。

工具名称总是显示在最顶部。调用参数按工具类型做特殊处理：对于 BashTool，`command` 字段（要执行的 shell 命令）会以高亮颜色显示，因为它是用户最需要审查的部分。对于 FileWriteTool，`file_path` 和操作类型（create/overwrite）会重点展示。

在多 Agent 模式下，对话框还会显示"这个请求来自哪个子 Agent"——因为主 Agent 和子 Agent 可能同时在运行，用户需要上下文才能做出有意义的决策。

---

## 11.6 任务面板：后台任务的实时监控

TaskPanel 显示正在运行的后台任务。"后台任务"在 Claude Code 里主要指两类：一是子 Agent（在多 Agent 模式下并发执行的工作单元），二是长时间运行的 shell 命令（比如 `npm install` 或编译任务）。

### 面板结构

TaskPanel 的默认状态是折叠的，只显示一行摘要：`3 tasks running`。当有任务失败时，摘要会带上醒目的颜色提示，让用户在不打断当前焦点的情况下感知到异常。

按下展开快捷键（通常是 `Tab` 或 `Ctrl+T`，具体取决于配置）后，每个任务展开为一行，显示：

- 任务名称（子 Agent 的任务描述，或 shell 命令的前几十个字符）
- 状态标记：`running`（转圈动画）、`done`（绿色勾）、`failed`（红色叉）
- 运行时长：以秒为单位，实时递增

```tsx
// Simplified TaskPanel rendering
function TaskPanel({ tasks }: { tasks: Task[] }) {
  const [expanded, setExpanded] = useState(false)
  const runningCount = tasks.filter(t => t.status === 'running').length
  const failedCount = tasks.filter(t => t.status === 'failed').length

  if (!expanded) {
    return (
      <Box>
        <Text color={failedCount > 0 ? 'red' : 'gray'}>
          {runningCount} tasks running{failedCount > 0 ? `, ${failedCount} failed` : ''}
        </Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      {tasks.map(task => (
        <TaskRow key={task.id} task={task} />
      ))}
    </Box>
  )
}
```

### 实时更新机制

TaskPanel 的数据来源是 REPL 的任务状态管理器，后者订阅了 Agent 循环发出的任务生命周期事件。当一个子 Agent 启动时，任务管理器添加一条 `running` 记录；当它结束时，更新状态为 `done` 或 `failed`。

运行时长的递增依赖一个定时器，每秒 `setState` 一次，触发 TaskPanel 的重渲染。因为 TaskPanel 是独立的组件，这个每秒一次的渲染不会影响 MessageList 或 PromptInput 的状态。

这里体现了 Ink 差量渲染的实际价值：即使定时器每秒触发重渲染，实际上只有 TaskPanel 那几行字符发生了变化，stdout 输出的 ANSI 序列量极小，不会引起其他区域的视觉闪烁。

---

## 11.7 多 Agent 协作视图

多 Agent 模式（swarm 模式）是 Claude Code 的高级特性：主 Agent 在执行复杂任务时，可以派生出多个子 Agent 并发工作，每个子 Agent 拥有独立的上下文和工具集。第5章里提到了这个调度机制，这里我们关注它的界面呈现。

### 子 Agent 的视图策略

每个子 Agent 在技术上是一个独立的 Agent 循环实例。它们需要自己的"消息流展示区域"，否则所有子 Agent 的输出混入主 REPL 的消息列表会造成严重混乱。

Claude Code 支持两种视图策略，取决于运行环境：

第一种是"分屏模式"，适用于 iTerm2 或 tmux 环境。每个子 Agent 的 REPL 渲染在一个独立的终端分屏里，主 Agent 的 REPL 在主窗格，子 Agent 各占一个小窗格。这种方式视觉上最清晰，但依赖终端模拟器的分屏 API。

第二种是"in-process 模式"，适用于不支持分屏的环境。子 Agent 的 REPL 作为一个独立的 React 子树在同一个进程内渲染，但在物理终端上占据不同的屏幕区域（通过绝对定位 ANSI 序列实现）。主 REPL 的左侧或底部区域显示"活跃子 Agent 数量"和每个子 Agent 的简要状态（当前执行的工具名、进度指示符）。

### 权限请求的代理机制（Leader Permission Bridge）

在多 Agent 模式下，权限确认出现了一个新问题：子 Agent 执行工具时可能需要权限确认，但子 Agent 没有自己的权限对话框（它们不显示完整的 REPL 界面）。

解决方案是"权限代理桥"（leader permission bridge）：子 Agent 的权限请求通过进程间消息传递（或同进程内的 Promise 传递，取决于运行模式）转发给主 Agent 的 REPL。主 REPL 显示权限对话框时，会明确标注这个请求来自哪个子 Agent（显示子 Agent 的任务描述和 ID），用户做出决策后，结果通过同样的通道返回给子 Agent 的 `canUseTool()` Promise。

```typescript
// Conceptual permission bridge for sub-agents
interface LeaderPermissionBridge {
  // Sub-agent calls this to request permission
  requestPermission(
    agentId: string,
    agentDescription: string,
    tool: Tool,
    params: unknown
  ): Promise<PermissionDecision>

  // Leader REPL calls this to deliver a decision back to the waiting sub-agent
  deliverDecision(agentId: string, decision: PermissionDecision): void
}
```

这个设计保持了权限确认的集中化：无论有多少个子 Agent 在运行，用户始终只在一个地方（主 REPL）做权限决策，不需要关注哪个终端窗格处于焦点状态。

### 协作状态的视觉表达

当多个子 Agent 并发工作时，主 REPL 的消息列表不会显示子 Agent 内部的消息流（那些消息只在子 Agent 自己的视图里显示）。主 REPL 显示的是"任务级别"的事件：子 Agent 被派生时追加一条 `SystemMessage`（"已派生子任务：修复 test/utils.ts 里的类型错误"），子 Agent 完成时追加一条结果摘要（"子任务完成：已修复 3 个类型错误"）。

这让主 REPL 的消息流保持在"用户需要看到的层次"，而不是被子 Agent 的内部执行细节淹没。

---

## 11.8 会话记录搜索与导航

在一个长会话里，用户可能需要回溯之前的某条消息——比如找到某次工具调用的输出，或者定位模型之前给出的某段代码。

### Ctrl+R 触发搜索模式

按下 `Ctrl+R`，REPL 进入搜索模式。这个模式与普通输入模式的区别是：

PromptInput 切换为"搜索输入框"，占位符文字从 `What can Claude help with?` 变为 `Search messages...`。用户的键入会触发实时过滤，而不是积累到按 Enter 时提交。

MessageList 进入"搜索结果模式"，所有不匹配当前搜索词的消息会降低对比度（gray out），匹配的消息高亮显示并把匹配的文字标记出来。

```typescript
// Simplified search mode state
interface SearchState {
  active: boolean
  query: string
  matches: Array<{ messageId: string; matchStart: number; matchEnd: number }>
  currentMatchIndex: number  // which match is currently "focused"
}
```

### 模糊搜索的实现

搜索使用与 typeahead 相同的模糊匹配逻辑，但作用对象是消息文本内容而不是命令名称。对于 `AssistantMessage`，搜索其文字内容；对于 `ToolUseMessage`，搜索工具名和参数；对于 `HumanMessage`，搜索用户输入的原始文字。

`TombstoneMessage`（压缩后的占位符）不参与搜索，因为它的原始内容已经不可用。

### 导航与滚动联动

找到匹配结果后，`Up`/`Down` 键在多个匹配之间跳转，MessageList 同步滚动到当前聚焦的匹配消息位置。

这里的滚动是精确定位而不是简单的"滚到底部"：即使目标消息在很久以前，虚拟列表也会准确计算出该消息的垂直偏移量，直接跳转过去，不需要逐行扫描。这就是为什么虚拟列表要维护精确的消息高度估算——不只是为了渲染效率，也是为了支持随机访问定位。

```typescript
// Scroll to a specific message by ID
function scrollToMessage(messageId: string, messages: Message[]) {
  const targetIndex = messages.findIndex(m => m.id === messageId)
  if (targetIndex === -1) return

  // Compute exact vertical offset from the start of the list
  const offset = messages
    .slice(0, targetIndex)
    .reduce((sum, msg) => sum + estimateMessageHeight(msg), 0)

  setScrollOffset(offset)
}
```

### 搜索结束后的状态恢复

按 `Escape` 退出搜索模式，REPL 恢复到普通状态：消息列表的 gray-out 效果消失，滚动位置回到搜索进入时的位置（不会因为搜索中途的跳转而改变"之前正在看的地方"）。

这个"状态恢复"依赖进入搜索模式时保存的快照：`searchEntryScrollOffset` 记录了进入搜索之前的滚动位置，退出时直接 restore。

---

## 11.9 关键 Hook 依赖

REPL.tsx 大量使用自定义 hook 来管理各个关注点，避免把所有逻辑堆在一个巨大的函数里。这些 hook 是第13章（自定义 Hooks 深度解析）的主要研究对象，这里先做一个概览，建立整体印象。

`useLogMessages` 负责把 QueryEngine 的 AsyncGenerator 流转化为 React 状态，内部包含批处理逻辑和消息规范化，本章 11.2 节已详细讨论。

`useCommandQueue` 处理斜杠命令的执行队列。斜杠命令（如 `/clear`、`/compact`）不走正常的 Agent 循环，而是直接修改 REPL 状态或触发特定操作。这个 hook 维护一个"待执行命令"队列，按序执行，避免命令之间的竞态条件。

`useTextInput` 封装了 PromptInput 的完整状态：当前文本、光标位置、是否在粘贴模式、历史记录指针。它暴露一组操作函数（`insertChar`、`deleteChar`、`moveCursor`、`submitInput`），PromptInput 组件只负责把键盘事件翻译成对这些函数的调用。

`useTypeahead` 实现了补全候选列表的状态管理，包括触发条件检测、候选数据获取（异步）、模糊过滤、选中项追踪。

`useCanUseTool` 是权限决策的核心 hook。它持有一个挂起的权限请求队列，暴露 `requestPermission` 函数给 Agent 循环调用，暴露 `pendingPermission` 状态给 `PermissionDialog` 渲染，暴露 `decide` 函数给对话框的按钮事件处理。三者通过 Promise 链串联，形成异步握手。

`useReplBridge` 处理 REPL 的远程同步，主要用于多 Agent 模式下主 Agent 和子 Agent 之间的状态同步，以及权限请求代理。

这些 hook 的分工体现了一个重要的设计原则：REPL.tsx 本身应该是一个"组装者"，把各个 hook 暴露的状态和操作函数传递给对应的子组件，而不是自己包含业务逻辑。这让大约 3000 行的文件里，逻辑真正分布在各个 hook 里，REPL.tsx 主要负责数据流的"接线"工作。

---

## 关键要点

本章覆盖了 REPL.tsx 这个 3000 行核心组件的六个主要方面。

消息显示管线是整个 REPL 性能的关键。StreamEvent 经过批处理合并、规范化为 Message 类型、再通过虚拟列表按需渲染，三道处理确保了即使在高速流式输出时界面也不卡顿。理解这条管线，也就理解了为什么 Claude Code 的输出感觉"流畅但不闪烁"。

PromptInput 的复杂性超出表面。历史导航的"可编辑历史"设计、`@` 文件引用的提交时展开、括号粘贴保护，每一个都是针对真实使用场景的精心权衡。

权限对话框采用"中断-等待"模型，通过 Promise 将异步的用户决策嫁接到同步的 Agent 循环控制流中。三种权限决策（永久、临时、拒绝）对应了不同的信任层级和用户意图。

TaskPanel 的轻量化设计体现了"存在感控制"的用户体验思路：始终存在但默认收起，失败时主动突出，正常运行时退居背景。

多 Agent 协作视图的核心挑战是权限确认的集中化。无论子 Agent 在哪里运行，权限请求都汇聚到主 REPL，通过 leader permission bridge 实现。

会话搜索（Ctrl+R）和虚拟列表的结合让长会话中的历史导航成为可能，精确的垂直偏移计算让"跳转到任意历史消息"做到了 O(1) 的界面响应。

从第10章的 Ink 框架原理，到本章的 REPL 组件实践，你现在完整看到了"React 组件树如何变成终端界面"的全貌。下一章我们将深入研究负责 UI 之外的另一个核心子系统：上下文压缩与记忆管理。
