import type { DuckProject } from "./project";

export type DuckProjectHistory = {
  entries: DuckProject[];
  index: number;
  limit: number;
};

export function createDuckProjectHistory(project: DuckProject, limit = 60): DuckProjectHistory {
  return { entries: [project], index: 0, limit: Math.max(2, limit) };
}

export function commitDuckProject(history: DuckProjectHistory, project: DuckProject): DuckProjectHistory {
  const retained = history.entries.slice(0, history.index + 1);
  const entries = [...retained, project];
  const overflow = Math.max(0, entries.length - history.limit);
  const bounded = overflow ? entries.slice(overflow) : entries;
  return { ...history, entries: bounded, index: bounded.length - 1 };
}

export function undoDuckProject(history: DuckProjectHistory): DuckProjectHistory {
  return { ...history, index: Math.max(0, history.index - 1) };
}

export function redoDuckProject(history: DuckProjectHistory): DuckProjectHistory {
  return { ...history, index: Math.min(history.entries.length - 1, history.index + 1) };
}

export function canUndoDuckProject(history: DuckProjectHistory) {
  return history.index > 0;
}

export function canRedoDuckProject(history: DuckProjectHistory) {
  return history.index < history.entries.length - 1;
}
