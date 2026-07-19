"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ToolAction {
  tool: string;
  summary: string;
  ok: boolean;
}

interface AssistantMessage extends ChatMessage {
  actions?: ToolAction[];
}

// Admin-home AI console: multi-file upload + tool-backed chat that can write
// streamer metrics / roster / posts from screenshots and tables.
// 后台首页 AI 控制台：多文件上传 + 可写库的工具对话，支持从截图/表格写入运营数据等。
export function AdminAssistantPanel({ configured }: { configured: boolean }) {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content:
        "我是后台运营助手。可上传抖音数据截图、Excel/CSV、Word 等，让我直接写入本站数据库（主播运营数据、主播档案、资讯、留言、页面文案）。删除操作需你再说「确认删除」。",
    },
  ]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const addFiles = (incoming: FileList | File[]) => {
    const next = Array.from(incoming);
    setFiles((prev) => {
      const merged = [...prev];
      for (const file of next) {
        if (!merged.some((f) => f.name === file.name && f.size === file.size)) {
          merged.push(file);
        }
      }
      return merged.slice(0, 12);
    });
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files?.length) {
      addFiles(event.dataTransfer.files);
    }
  };

  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    if (pending || (!input.trim() && files.length === 0)) {
      return;
    }

    const userText = input.trim();
    const attachedNames = files.map((f) => f.name);
    const display =
      userText +
      (attachedNames.length
        ? `\n\n（附件：${attachedNames.join("、")}）`
        : "");

    const historyForApi: ChatMessage[] = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }))
      .slice(-8);

    setMessages((prev) => [...prev, { role: "user", content: display }]);
    setInput("");
    setError(null);
    setPending(true);

    const body = new FormData();
    body.append("message", userText || "请根据附件处理后台数据。");
    body.append("history", JSON.stringify(historyForApi));
    for (const file of files) {
      body.append("files", file);
    }
    setFiles([]);

    try {
      const response = await fetch("/api/admin/assistant", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as {
        reply?: string;
        actions?: ToolAction[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "请求失败");
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply ?? "（无回复）",
          actions: data.actions,
        },
      ]);
      window.setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } catch (err) {
      const message = err instanceof Error ? err.message : "请求失败";
      setError(message);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `出错了：${message}` },
      ]);
    } finally {
      setPending(false);
    }
  };

  if (!configured) {
    return (
      <section className="mb-10 border border-amber-500/30 bg-amber-500/5 p-5">
        <h2 className="font-display text-lg font-bold text-mist-100">
          后台 AI 助手
        </h2>
        <p className="mt-2 text-sm text-mist-300">
          未配置 <code className="text-jade-500">GROQ_API_KEY</code>
          ，助手不可用。在环境变量中配置后即可用截图/表格自动写入运营数据等。
        </p>
      </section>
    );
  }

  return (
    <section className="mb-10 border border-mist-100/10 bg-white">
      <div className="border-b border-mist-100/10 bg-ink-850 px-5 py-4">
        <h2 className="font-display text-lg font-bold text-mist-100">
          后台 AI 助手
        </h2>
        <p className="mt-1 text-xs text-mist-400">
          上传截图、Excel/CSV、Word 等，说明意图（如「写入运营数据」）。创建/更新会直接入库；删除需回复「确认删除」。
        </p>
      </div>

      <div className="max-h-80 space-y-3 overflow-y-auto px-5 py-4">
        {messages.map((msg, index) => (
          <div
            key={`${msg.role}-${index}`}
            className={`text-sm ${
              msg.role === "user" ? "text-mist-100" : "text-mist-300"
            }`}
          >
            <p className="text-xs font-medium text-mist-400">
              {msg.role === "user" ? "你" : "助手"}
            </p>
            <p className="mt-1 whitespace-pre-wrap">{msg.content}</p>
            {msg.actions && msg.actions.length > 0 ? (
              <ul className="mt-2 space-y-1 border border-mist-100/10 bg-ink-950/40 px-3 py-2 text-xs">
                {msg.actions.map((action, i) => (
                  <li
                    key={`${action.tool}-${i}`}
                    className={action.ok ? "text-jade-600" : "text-red-600"}
                  >
                    {action.ok ? "✓" : "×"} {action.summary}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={onDrop}
        className={`mx-5 mb-3 border border-dashed px-4 py-4 text-center text-xs transition-colors ${
          dragging
            ? "border-jade-500 bg-jade-500/5 text-mist-200"
            : "border-mist-100/20 bg-ink-950 text-mist-400"
        }`}
      >
        <p>
          {dragging
            ? "松开以添加文件"
            : "拖拽文件到此处，或选择本地文件（最多 12 个，单文件 25MB）"}
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className="mt-2 border border-mist-100/15 bg-white px-3 py-1.5 text-xs font-medium text-mist-200 hover:border-jade-500 disabled:opacity-60"
        >
          选择文件
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,.csv,.txt,.md,.xlsx,.xls,.docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,text/plain"
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) {
              addFiles(event.target.files);
            }
            event.target.value = "";
          }}
        />
        {files.length > 0 ? (
          <ul className="mt-3 space-y-1 text-left text-xs text-mist-300">
            {files.map((file) => (
              <li
                key={`${file.name}-${file.size}`}
                className="flex items-center justify-between gap-2"
              >
                <span className="truncate">
                  {file.name}（{(file.size / 1024).toFixed(0)} KB）
                </span>
                <button
                  type="button"
                  className="shrink-0 text-red-600 hover:underline"
                  onClick={() =>
                    setFiles((prev) => prev.filter((f) => f !== file))
                  }
                >
                  移除
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <form
        onSubmit={send}
        className="flex flex-col gap-2 border-t border-mist-100/10 px-5 py-4 sm:flex-row"
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="例如：把截图里的抖音数据写入对应主播运营数据"
          rows={2}
          disabled={pending}
          className="min-h-[2.75rem] flex-1 resize-y border border-mist-100/15 bg-ink-950 px-3 py-2 text-sm text-mist-100 placeholder:text-mist-400 focus:border-jade-500 focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending || (!input.trim() && files.length === 0)}
          className="shrink-0 bg-jade-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jade-600 disabled:opacity-60"
        >
          {pending ? "处理中…" : "发送"}
        </button>
      </form>

      {error ? (
        <p className="border-t border-red-500/20 px-5 py-2 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </section>
  );
}
