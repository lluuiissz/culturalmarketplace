import React from 'react';

export interface WeaveDividerProps {
  pattern?: 'kalinga' | 'diamond' | 'chevron';
  className?: string;
  subtle?: boolean;
}

export default function WeaveDivider({
  pattern = 'kalinga',
  className = '',
  subtle = false,
}: WeaveDividerProps) {
  if (pattern === 'diamond') {
    return (
      <div
        role="presentation"
        aria-hidden="true"
        className={`weave-divider-diamond ${subtle ? 'opacity-40' : 'opacity-85'} ${className}`}
      />
    );
  }

  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={`weave-divider ${subtle ? 'opacity-40' : 'opacity-85'} ${className}`}
    />
  );
}
