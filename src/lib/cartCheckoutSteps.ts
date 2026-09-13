/**
 * Universal cart checkout step spine (Option B).
 * Delivery → When → Review — skip empty steps.
 */

export type CartCheckoutStepId = 'delivery' | 'when' | 'review';

export type ResolveCartCheckoutStepsInput = {
  /** Physical / zone / address step */
  needsDelivery: boolean;
  /** Scheduling / slot step */
  needsWhen: boolean;
};

export function resolveCartCheckoutSteps(
  input: ResolveCartCheckoutStepsInput,
): CartCheckoutStepId[] {
  const steps: CartCheckoutStepId[] = [];
  if (input.needsDelivery) steps.push('delivery');
  if (input.needsWhen) steps.push('when');
  steps.push('review');
  return steps;
}

export function cartCheckoutStepLabel(id: CartCheckoutStepId): string {
  switch (id) {
    case 'delivery':
      return 'Delivery';
    case 'when':
      return 'When';
    case 'review':
      return 'Review';
    default:
      return id;
  }
}

export function cartCheckoutStepIndex(
  steps: CartCheckoutStepId[],
  id: CartCheckoutStepId,
): number {
  return steps.indexOf(id);
}
