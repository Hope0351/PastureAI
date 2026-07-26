import type { TranslationDict } from './en';

/** Map backend risk / priority / trend enums to localized labels */
export function riskLabel(
  t: TranslationDict,
  level: string | null | undefined
): string {
  if (!level) return t.common.na;
  const key = level as keyof TranslationDict['risk'];
  return t.risk[key] ?? level;
}

export function priorityLabel(t: TranslationDict, level: string): string {
  return t.brief.priorityLabel.replace('{level}', riskLabel(t, level));
}
