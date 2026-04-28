export function getProductCurationStatement(category: string | null | undefined, productName: string | null | undefined): string {
  const cat = String(category || '').toLowerCase();
  const name = String(productName || 'this item').trim() || 'this item';
  const pools: Record<string, string[]> = {
    fashion: [
      `${name} balances comfort and structure in a way that feels effortless.`,
      `${name} feels premium in-hand and fits like a reliable everyday staple.`,
      `${name} is one of those pieces that instantly upgrades the whole look.`,
    ],
    tech: [
      `${name} is practical, fast, and removes friction from daily routines.`,
      `${name} delivers where it matters most: reliability and clean performance.`,
      `${name} is a solid upgrade if you want utility without unnecessary complexity.`,
    ],
    beauty: [
      `${name} feels like a small luxury and is easy to keep in a daily routine.`,
      `${name} gives noticeably better results than most alternatives in its range.`,
      `${name} has the texture, finish, and consistency people keep coming back for.`,
    ],
    home: [
      `${name} adds practical value while still elevating the space visually.`,
      `${name} is one of those home pieces that looks intentional and refined.`,
      `${name} brings warmth and function together without taking over the room.`,
    ],
    default: [
      `${name} stands out for quality, usefulness, and overall finish.`,
      `${name} is a smart pick if you want value without compromising experience.`,
      `${name} is dependable, well-built, and worth recommending.`,
    ],
  };
  let key: keyof typeof pools = 'default';
  if (/fashion|cloth|wear|shoe/.test(cat)) key = 'fashion';
  else if (/electr|phone|tech/.test(cat)) key = 'tech';
  else if (/beauty|skin|body/.test(cat)) key = 'beauty';
  else if (/home|decor|kitchen/.test(cat)) key = 'home';
  const options = pools[key];
  return options[name.length % options.length];
}

export function getServiceCurationStatement(args: {
  serviceCategory?: string | null;
  serviceTitle?: string | null;
  providerDisplayName?: string | null;
  listingId?: string;
  curatorId?: string;
}): string {
  const title = String(args.serviceTitle || 'this service').trim() || 'this service';
  const provider = String(args.providerDisplayName || 'the provider').trim() || 'the provider';
  const cat = String(args.serviceCategory || '').toLowerCase();
  const seed = `${args.listingId || ''}:${args.curatorId || ''}:${title}`.length;
  const pools: Record<string, string[]> = {
    beauty: [
      `${title} is one of the cleanest beauty experiences I have booked recently — ${provider} is consistent and detail-focused.`,
      `${provider} delivers ${title} with a calm, premium workflow from start to finish.`,
      `If you want reliable results, ${title} with ${provider} is a strong pick.`,
    ],
    media: [
      `${title} is curated for people who care about both process and output quality.`,
      `${provider} executes ${title} with clear communication and impressive turnaround.`,
      `${title} is a practical, high-signal booking for creative outcomes that actually ship.`,
    ],
    lifestyle: [
      `${title} feels thoughtfully structured and easy to book with confidence.`,
      `${provider} makes ${title} approachable while keeping service quality high.`,
      `${title} is ideal if you value clarity, care, and professional delivery.`,
    ],
    default: [
      `${title} is a verified service pick worth booking with ${provider}.`,
      `${provider} offers ${title} with strong execution and buyer confidence.`,
      `${title} stands out for professionalism, consistency, and delivery quality.`,
    ],
  };
  let key: keyof typeof pools = 'default';
  if (/beauty|skin|hair|spa|nail|makeup/.test(cat)) key = 'beauty';
  else if (/photo|video|media|design|content/.test(cat)) key = 'media';
  else if (/well|fitness|lifestyle|event/.test(cat)) key = 'lifestyle';
  const options = pools[key];
  return options[seed % options.length];
}
