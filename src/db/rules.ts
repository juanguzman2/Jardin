import { asc, eq } from 'drizzle-orm';

import { db } from './client';
import { newId } from './ids';
import { notifyDbChange } from './live';
import { type VerbalRule, ruleAreas, verbalRules } from './schema';

export type RuleWithAreas = VerbalRule & { areaIds: string[] };
export type RuleInput = Omit<VerbalRule, 'id' | 'createdAt' | 'updatedAt' | 'archived'>;

function areasByRule(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const ra of db.select().from(ruleAreas).all()) {
    const list = map.get(ra.ruleId) ?? [];
    list.push(ra.areaId);
    map.set(ra.ruleId, list);
  }
  return map;
}

export function listRules(options: { includeArchived?: boolean } = {}): RuleWithAreas[] {
  const map = areasByRule();
  return db
    .select()
    .from(verbalRules)
    .orderBy(asc(verbalRules.createdAt))
    .all()
    .filter((r) => options.includeArchived || !r.archived)
    .map((r) => ({ ...r, areaIds: map.get(r.id) ?? [] }));
}

export function getRule(id: string): RuleWithAreas | undefined {
  const rule = db.select().from(verbalRules).where(eq(verbalRules.id, id)).get();
  if (!rule) return undefined;
  const areaIds = db
    .select()
    .from(ruleAreas)
    .where(eq(ruleAreas.ruleId, id))
    .all()
    .map((r) => r.areaId);
  return { ...rule, areaIds };
}

function replaceAreas(ruleId: string, areaIds: readonly string[]): void {
  db.delete(ruleAreas).where(eq(ruleAreas.ruleId, ruleId)).run();
  for (const areaId of new Set(areaIds)) {
    db.insert(ruleAreas).values({ ruleId, areaId }).run();
  }
}

export function createRule(input: RuleInput, areaIds: readonly string[] = []): string {
  const id = newId();
  db.transaction(() => {
    db.insert(verbalRules).values({ ...input, id }).run();
    replaceAreas(id, areaIds);
  });
  notifyDbChange();
  return id;
}

export function updateRule(id: string, input: Partial<RuleInput>, areaIds?: readonly string[]): void {
  db.transaction(() => {
    if (Object.keys(input).length > 0) db.update(verbalRules).set(input).where(eq(verbalRules.id, id)).run();
    if (areaIds) replaceAreas(id, areaIds);
  });
  notifyDbChange();
}

export function setRuleArchived(id: string, archived: boolean): void {
  db.update(verbalRules).set({ archived }).where(eq(verbalRules.id, id)).run();
  notifyDbChange();
}

export function deleteRule(id: string): void {
  db.delete(verbalRules).where(eq(verbalRules.id, id)).run();
  notifyDbChange();
}
