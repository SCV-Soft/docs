import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export function Wrapper(props: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      {...props}
      className={cn(
        "rounded-xl bg-card p-4 prose-no-margin",
        props.className
      )}
    >
      {props.children}
    </div>
  );
}
