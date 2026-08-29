declare module "react-day-picker" {
  import type * as React from "react";

  export interface DayPickerProps {
    className?: string;
    classNames?: Record<string, string | undefined>;
    showOutsideDays?: boolean;
    mode?: "default" | "single" | "multiple" | "range";
    components?: Record<string, React.ComponentType<{ className?: string }>>;
    [key: string]: unknown;
  }

  export const DayPicker: React.ComponentType<DayPickerProps>;
}

declare module "react-resizable-panels" {
  import type * as React from "react";

  export const PanelGroup: React.ComponentType<
    React.HTMLAttributes<HTMLDivElement> & {
      direction?: "horizontal" | "vertical";
      autoSaveId?: string;
    }
  >;

  export const Panel: React.ComponentType<
    React.HTMLAttributes<HTMLDivElement> & {
      defaultSize?: number;
      minSize?: number;
      maxSize?: number;
      collapsible?: boolean;
      collapsedSize?: number;
      order?: number;
    }
  >;

  export const PanelResizeHandle: React.ComponentType<
    React.HTMLAttributes<HTMLDivElement> & {
      disabled?: boolean;
    }
  >;
}
