"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "rgb(12 10 9)" /* stone-950 */,
          "--normal-border": "rgb(41 37 36)" /* stone-800 */,
          "--normal-text": "rgb(214 211 209)" /* stone-300 */,
          "--success-bg": "rgb(12 10 9)",
          "--success-border": "rgb(41 37 36)",
          "--success-text": "rgb(74 222 128)" /* green-400 */,
          "--error-bg": "rgb(12 10 9)",
          "--error-border": "rgb(41 37 36)",
          "--error-text": "rgb(248 113 113)" /* red-400 */,
          "--border-radius": "0",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.875rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
