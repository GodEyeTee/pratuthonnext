'use client';
import { cn } from '@/lib/utils';
import React from 'react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth,
      disabled,
      ...props
    },
    ref
  ) => {
    const id = props.id || props.name;
    const hasLeft = !!leftIcon;
    const hasRight = !!rightIcon;

    return (
      <div className={cn('space-y-1', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-foreground dark:text-gray-200"
          >
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            type={type}
            className={cn(
              'flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background',
              'bg-background dark:bg-gray-800',
              'border-input dark:border-gray-600',
              'text-foreground dark:text-gray-100',
              'placeholder:text-muted-foreground dark:placeholder:text-gray-400',
              'file:border-0 file:bg-transparent file:text-sm file:font-medium',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:focus-visible:ring-orange-400 focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              hasLeft && 'pl-10',
              hasRight && 'pr-10',
              error &&
                'border-destructive dark:border-red-500 focus-visible:ring-destructive',
              className
            )}
            ref={ref}
            id={id}
            disabled={disabled}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <p
            className={cn(
              'text-sm',
              error
                ? 'text-destructive dark:text-red-400'
                : 'text-muted-foreground dark:text-gray-400'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
export { Input };
