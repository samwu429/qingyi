"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { siteConfig } from "@/config/site.config";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface OrbPos {
  x: number;
  y: number;
}

const ORB_SIZE = 60;
const EDGE_MARGIN = 16;
const PANEL_GAP = 12;
const PANEL_WIDTH = 352;
const PANEL_HEIGHT = 512;
const STORAGE_KEY = "qingyi-chat-orb-pos";
const DRAG_THRESHOLD = 6;

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

function defaultPos(): OrbPos {
  if (typeof window === "undefined") {
    return { x: 20, y: 20 };
  }
  return {
    x: Math.max(EDGE_MARGIN, window.innerWidth - ORB_SIZE - EDGE_MARGIN),
    y: Math.max(EDGE_MARGIN, window.innerHeight - ORB_SIZE - EDGE_MARGIN),
  };
}

function clampPos(pos: OrbPos): OrbPos {
  const maxX = Math.max(EDGE_MARGIN, window.innerWidth - ORB_SIZE - EDGE_MARGIN);
  const maxY = Math.max(
    EDGE_MARGIN,
    window.innerHeight - ORB_SIZE - EDGE_MARGIN,
  );
  return {
    x: Math.min(maxX, Math.max(EDGE_MARGIN, pos.x)),
    y: Math.min(maxY, Math.max(EDGE_MARGIN, pos.y)),
  };
}

// Snap horizontally to the nearer left/right edge; keep Y within the viewport.
// 水平吸附到更近的左/右边缘，纵向仍限制在可视区内。
function snapToEdge(pos: OrbPos): OrbPos {
  const clamped = clampPos(pos);
  const mid = window.innerWidth / 2;
  const centerX = clamped.x + ORB_SIZE / 2;
  return {
    x:
      centerX < mid
        ? EDGE_MARGIN
        : Math.max(EDGE_MARGIN, window.innerWidth - ORB_SIZE - EDGE_MARGIN),
    y: clamped.y,
  };
}

function readStoredPos(): OrbPos | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OrbPos>;
    if (typeof parsed.x === "number" && typeof parsed.y === "number") {
      return clampPos({ x: parsed.x, y: parsed.y });
    }
  } catch {
    // Ignore corrupted storage.
  }
  return null;
}

function panelStyle(pos: OrbPos, open: boolean): CSSProperties {
  if (!open || typeof window === "undefined") {
    return { display: "none" };
  }

  const preferLeft = pos.x + ORB_SIZE / 2 > window.innerWidth / 2;
  const panelW = Math.min(PANEL_WIDTH, window.innerWidth - EDGE_MARGIN * 2);
  const panelH = Math.min(PANEL_HEIGHT, window.innerHeight - EDGE_MARGIN * 2);

  let left = preferLeft
    ? pos.x + ORB_SIZE - panelW
    : pos.x;
  left = Math.min(
    Math.max(EDGE_MARGIN, left),
    window.innerWidth - panelW - EDGE_MARGIN,
  );

  // Prefer opening above the orb; if not enough room, open below.
  // 优先在球上方展开；上方空间不足则改到下方。
  let top = pos.y - panelH - PANEL_GAP;
  if (top < EDGE_MARGIN) {
    top = pos.y + ORB_SIZE + PANEL_GAP;
  }
  if (top + panelH > window.innerHeight - EDGE_MARGIN) {
    top = Math.max(EDGE_MARGIN, window.innerHeight - panelH - EDGE_MARGIN);
  }

  return {
    left,
    top,
    width: panelW,
    height: panelH,
  };
}

// Floating, streaming chat assistant available on every public page. The orb is
// fixed-positioned and can be dragged; on release it snaps to the nearer side
// edge and the position is remembered in localStorage.
// 浮动流式聊天助手。球体为 fixed 定位，可按住拖拽；松手吸附到较近侧边，位置写入 localStorage。
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pos, setPos] = useState<OrbPos>(defaultPos);
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    const stored = readStoredPos();
    setPos(stored ?? defaultPos());
    setReady(true);
  }, []);

  useEffect(() => {
    const onResize = () => setPos((current) => clampPos(current));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
      drag.moved = true;
    }
    if (!drag.moved) return;

    setPos(
      clampPos({
        x: event.clientX - drag.offsetX,
        y: event.clientY - drag.offsetY,
      }),
    );
  };

  const finishDrag = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Already released.
      }

      dragRef.current = null;
      setDragging(false);

      if (!drag.moved) {
        setOpen((value) => !value);
        return;
      }

      setPos((current) => {
        const snapped = snapToEdge(current);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(snapped));
        } catch {
          // Ignore quota / private mode errors.
        }
        return snapped;
      });
    },
    [],
  );

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
    const outgoing: Message[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
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

  if (!ready) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        aria-label={open ? "关闭在线咨询" : "打开在线咨询"}
        className={`chat-orb z-50${open ? " chat-orb--open" : ""}${
          dragging ? " chat-orb--dragging" : ""
        }`}
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          zIndex: 50,
        }}
      >
        <span className="chat-orb__glyph">{open ? "×" : "青"}</span>
      </button>

      {open ? (
        <div className="chat-panel" style={panelStyle(pos, open)}>
          <header className="flex items-center gap-3 border-b border-mist-100/10 bg-ink-950 px-4 py-3">
            <span className="chat-orb-mini" aria-hidden>
              青
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-mist-100">青意小助手</p>
              <p className="text-[11px] text-mist-400">
                按住球体可拖到任意位置，松手靠左/右吸附
              </p>
            </div>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "user"
                    ? "flex justify-end"
                    : "flex justify-start"
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
