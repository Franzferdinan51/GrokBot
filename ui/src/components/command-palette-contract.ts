export const COMMAND_PALETTE_TARGET_EVENT = "grokbot-command-palette-target";
export const COMMAND_PALETTE_OPEN_EVENT = "grokbot:command-palette-open";
export const SHELL_NAV_DRAWER_TOGGLE_EVENT = "grokbot:shell-nav-drawer-toggle";

export type ShellNavDrawerToggleDetail = {
  trigger: HTMLElement;
};

export function isCommandPaletteShortcut(event: KeyboardEvent): boolean {
  return (event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === "k";
}

export type CommandPaletteTargetDetail = {
  owner: Element;
  onSlashCommand: ((command: string) => void) | null;
};

export type CommandPaletteElement = HTMLElement & {
  isOpen: boolean;
  openPalette: () => void;
  togglePalette: () => void;
};
