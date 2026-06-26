/** Truncate a blockchain address for display: SP2J6...DPR */
export function shortAddr(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}
