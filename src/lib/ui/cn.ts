// Join conditional class name fragments into a single string, discarding falsy
// values. A dependency-free alternative to heavier class utilities.
// 将条件性类名片段合并为单个字符串并剔除假值；无需引入更重的类名工具库。
export type ClassValue = string | number | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
