import { pulseRingGenerator } from './pulseRing';
import { sdfCircleGenerator, sdfRoundedBoxGenerator, sdfStarGenerator } from './sdfShapes';
import { stripesCheckerGenerator } from './patterns';
import { noiseWarpGenerator } from './noiseWarp';
import { raysGenerator } from './rays';

export const generators = [
  pulseRingGenerator,
  sdfCircleGenerator,
  sdfRoundedBoxGenerator,
  sdfStarGenerator,
  stripesCheckerGenerator,
  noiseWarpGenerator,
  raysGenerator
];

export const generatorMap = Object.fromEntries(generators.map((g) => [g.id, g]));
