// Extend JSX IntrinsicElements to include the `tw` prop used by Satori
// (the renderer behind next/og ImageResponse).
import "react";

declare module "react" {
  interface HTMLAttributes<T> {
    tw?: string;
  }
}
