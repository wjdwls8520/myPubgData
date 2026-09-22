import { z } from 'zod';

export const categories = ['AR', 'LMG', 'SMG', 'DMR', 'SR', 'SHOTGUN', 'HANDGUN'] as const;
export const bodyIds = ['head', 'neck', 'clavicle', 'chest', 'upper-stomach', 'lower-stomach', 'pelvis', 'upper-arm', 'forearm', 'hand', 'thigh', 'calf', 'foot'] as const;
export const scopes = ['none', '2x', '4x', '6x', '8x'] as const;
export const categorySchema = z.enum(categories);
export const bodyIdSchema = z.enum(bodyIds);
const positive = z.number().finite().positive();
const nonnegative = z.number().finite().nonnegative();
export const sourceSchema = z.object({ source: z.string(), sourceUrl: z.url(), gameVersion: z.string(), retrievedAt: z.iso.date(), confidence: z.enum(['verified', 'derived', 'estimated']), precision: z.string() });
const commonFiring = { rpm: positive.nullable(), normalInterval: positive.nullable(), cycleLimit: z.number().int().positive().nullable() };
export const firingSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('auto'), ...commonFiring, rpmOptions: z.array(positive).min(1) }),
  z.object({ kind: z.literal('single'), ...commonFiring }),
  z.object({ kind: z.literal('pump'), ...commonFiring }),
  z.object({ kind: z.literal('bolt'), ...commonFiring, timingId: z.string() }),
  z.object({ kind: z.literal('burst'), ...commonFiring, burstSize: z.number().int().min(2), intraBurstInterval: positive.nullable(), perfectBoundaryInterval: positive.nullable(), normalBoundaryInterval: positive.nullable() }),
]);
export const weaponSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/), slug: z.string().regex(/^[a-z0-9-]+$/), name: z.string().min(1), category: categorySchema,
  ammoType: z.string().nullable(), baseDamage: positive.nullable(), carePackage: z.boolean(), status: z.enum(['active', 'archived']), muzzleVelocity: positive.nullable(),
  measuredRange: z.object({ min: nonnegative, max: nonnegative }),
  falloff: z.array(z.object({ distance: nonnegative, damage: positive })).min(1),
  multiplierOverrides: z.partialRecord(bodyIdSchema, positive),
  projectile: z.discriminatedUnion('kind', [z.object({ kind: z.literal('pellets'), pelletCount: z.number().int().min(2) }), z.object({ kind: z.enum(['bullet', 'slug']), pelletCount: z.literal(1) })]),
  firing: firingSchema, source: sourceSchema, timingSource: sourceSchema,
}).superRefine((weapon, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  if (weapon.id !== weapon.slug) fail('ID and slug must match');
  if (weapon.falloff[0]?.distance !== weapon.measuredRange.min || weapon.falloff.at(-1)?.distance !== weapon.measuredRange.max) fail('Measured range must match sample endpoints');
  if (weapon.falloff.some((p, i, list) => i > 0 && p.distance <= (list[i - 1]?.distance ?? Infinity))) fail('Distances must be strictly increasing');
  if (weapon.measuredRange.min > 0 && weapon.baseDamage !== null) fail('Muzzle damage outside measured range must be unknown');
  if (weapon.measuredRange.min === 0 && weapon.baseDamage !== weapon.falloff[0]?.damage) fail('Muzzle sample mismatch');
});
export const bodyPartSchema = z.object({ id: bodyIdSchema, name: z.string(), hitMultiplier: positive, armor: z.enum(['helmet', 'vest', 'none']) });
export const multiplierSchema = z.record(categorySchema, z.record(bodyIdSchema, positive));
export const boltSchema = z.record(z.string(), z.object({ intervals: z.record(z.enum(scopes), positive.nullable()), source: sourceSchema }));
export const patchSchema = z.object({ weaponId: z.string(), patch: z.string(), date: z.string(), sourceUrl: z.url(), source: sourceSchema, changes: z.array(z.object({ type: z.string(), direction: z.enum(['buff', 'nerf', 'changed']), figures: z.array(z.string()) })) });
export const metadataSchema = z.object({ version: z.string(), retrievedAt: z.iso.date(), referenceUpdatedAt: z.iso.date(), source: sourceSchema, rounding: z.string(), interpolation: z.string(), health: positive });
export type Weapon = z.infer<typeof weaponSchema>;
export type Category = z.infer<typeof categorySchema>;
export type BodyId = z.infer<typeof bodyIdSchema>;
export type BodyPart = z.infer<typeof bodyPartSchema>;
export type DataSource = z.infer<typeof sourceSchema>;
export type WeaponPatch = z.infer<typeof patchSchema>;
export type Metadata = z.infer<typeof metadataSchema>;
export type Scope = typeof scopes[number];
export interface DamageRules {
  bodyParts: BodyPart[];
  classes: z.infer<typeof multiplierSchema>;
  armor: [number, number, number, number];
  bolts: z.infer<typeof boltSchema>;
  health: number;
}
