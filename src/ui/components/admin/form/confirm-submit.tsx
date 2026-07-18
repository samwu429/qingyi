"use client";

import { useFormStatus } from "react-dom";

// Submit button that requests confirmation before triggering its enclosing form
// action. Used for destructive operations such as delete.
// 在触发所在表单 action 前请求二次确认的提交按钮，用于删除等破坏性操作。
export function ConfirmSubmit({
  children,
  confirmMessage,
  className,
}: {
  children: React.ReactNode;
  confirmMessage: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
