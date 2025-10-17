export const isActivePath = (path: string, href: string) =>
  path === href || path.startsWith(href + '/');

export const basePath = (path: string, re = /^(.*?\/(?:urban|rural))(?:\/|$)/) =>
  path.match(re)?.[1] ?? null;
