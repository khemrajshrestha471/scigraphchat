// `lucide` ships plain .mjs icon-node files with no bundled type declarations.
// Each default-exports an array describing the SVG's child elements, which
// icons.ts passes straight into lucide's own createElement() helper.
declare module 'lucide/dist/esm/icons/*.mjs' {
  const iconNode: unknown;
  export default iconNode;
}

declare module 'lucide/dist/esm/createElement.mjs' {
  const createElement: (iconNode: unknown, attrs?: Record<string, unknown>) => SVGSVGElement;
  export default createElement;
}
