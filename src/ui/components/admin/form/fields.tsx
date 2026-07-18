import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/ui/cn";

// Shared presentational form primitives for the admin panel. Kept free of state
// so they compose within both server and client form components.
// 后台面板共用的表单展示型基础组件。不含内部状态，可在服务端与客户端表单中复用。

const controlClass =
  "w-full border border-mist-100/15 bg-white px-4 py-2.5 text-sm text-mist-100 outline-none transition-colors placeholder:text-mist-400 focus:border-jade-500";

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block text-sm font-medium text-mist-200">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-mist-400">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlClass, props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={cn(controlClass, "min-h-28", props.className)} />
  );
}

export function Select({
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(controlClass, props.className)}>
      {children}
    </select>
  );
}
