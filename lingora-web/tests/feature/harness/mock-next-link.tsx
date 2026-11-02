import React from 'react';

export default function Link({ href, children, ...props }: any) {
  return (
    <a href={typeof href === 'object' ? href?.pathname : href} {...props}>
      {children}
    </a>
  );
}
