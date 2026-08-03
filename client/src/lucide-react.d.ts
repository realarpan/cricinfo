declare module 'lucide-react' {
  import type { ComponentType, SVGProps } from 'react';
  type Icon = ComponentType<SVGProps<SVGSVGElement> & { size?: string | number }>;
  export const Moon: Icon;
  export const Search: Icon;
  export const Sun: Icon;
  export const Menu: Icon;
  export const X: Icon;
}
