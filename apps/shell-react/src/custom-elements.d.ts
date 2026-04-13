import type * as React from 'react';

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'mfe-kyc-app': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        token?: string;
        'api-base'?: string;
      };
    }
  }
}
