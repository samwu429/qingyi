"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site.config";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const GREETING: Message = {
  role: "assistant",
  content: `你好，我是青意小助手 👋\n关于${siteConfig.brandName}的签约加入、主播阵容、商务合作或联系方式，都可以问我。`,
};

const SUGGESTIONS = [
  "怎么申请加入签约？",
  "你们有哪些签约主播？",
  "签约有什么权益？",
  "怎么联系你们？",
];

// Floating, streaming chat assistant available on every public page. Conversation
// state lives here and persists across client-side navigation because the widget
// is mounted in the shared public layout.
// 浮动的流式聊天助手，在所有公开页面可用。对话状态保存在组件内，并因挂载于共享的公开布局中
// 而在前端路由切换时保持不丢。
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) {
      return;
    }
    setError(null);
    setInput("");

    const history = messages
      .filter((message) => message !== GREETING)
      .map((message) => ({ role: message.role, content: message.content }));
    const outgoing: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages([...outgoing, { role: "assistant", content: "" }]);
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, { role: "user", content: trimmed }],
        }),
      });

      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "回复失败，请稍后重试。");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: acc };
          return next;
        });
      }

      if (!acc.trim()) {
        throw new Error("助手没有返回内容，请重试。");
      }
    } catch (err) {
      setMessages((prev) => prev.slice(0, -1));
      setError(err instanceof Error ? err.message : "回复失败，请稍后重试。");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "关闭在线咨询" : "打开在线咨询"}
        className={`chat-orb fixed bottom-5 right-5 z-50${open ? " chat-orb--open" : ""}`}
      >
        <span className="chat-orb__glyph">{open ? "×" : "青"}</span>
      </button>

      {open ? (
        <div className="fixed bottom-24 right-5 z-50 flex h-[32rem] max-h-[calc(100vh-8rem)] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden border border-mist-100/15 bg-white shadow-2xl">
          <header className="flex items-center gap-3 border-b border-mist-100/10 bg-ink-950 px-4 py-3">
            <span className="chat-orb-mini" aria-hidden>
              青
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-mist-100">青意小助手</p>
              <p className="text-[11px] text-mist-400">
                在线为你解答加入与合作问题
              </p>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "user" ? "flex justify-end" : "flex justify-start"
                }
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap px-3 py-2 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-jade-500 text-white"
                      : "bg-ink-850 text-mist-200"
                  }`}
                >
                  {message.content ||
                    (sending && index === messages.length - 1 ? "思考中…" : "")}
                </div>
              </div>
            ))}

            {messages.length <= 1 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void send(suggestion)}
                    className="border border-mist-100/15 px-2.5 py-1.5 text-xs text-mist-300 transition-colors hover:border-jade-500 hover:text-jade-500"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}

            {error ? (
              <p className="border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600">
                {error}
              </p>
            ) : null}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="flex items-end gap-2 border-t border-mist-100/10 p-3"
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send(input);
                }
              }}
              rows={1}
              placeholder="输入你的问题…"
              className="max-h-28 min-h-[2.5rem] flex-1 resize-none border border-mist-100/15 bg-white px-3 py-2 text-sm text-mist-100 outline-none placeholder:text-mist-400 focus:border-jade-500"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="bg-jade-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-jade-600 disabled:opacity-50"
            >
              发送
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
