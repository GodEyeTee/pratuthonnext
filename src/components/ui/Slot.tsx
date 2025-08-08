'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, className, ...props }, ref) => {
    if (!React.isValidElement(children)) {
      return null;
    }

    const child = children as React.ReactElement<Record<string, unknown>>;
    return React.cloneElement(child, {
      ...props,
      ref,
      className: cn((child.props as { className?: string }).className, className),
    });
  }
);
Slot.displayName = 'Slot';

export { Slot };
