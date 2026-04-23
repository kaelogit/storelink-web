export type RankingSurface =
  | 'home'
  | 'explore_discovery'
  | 'explore_for_you'
  | 'spotlight';

export type RankingRpcPlan = {
  surface: RankingSurface;
  primaryRpc: string;
  fallbackRpcs: string[];
  provider: 'sql';
  version: 'v1' | 'v2' | 'v3';
};

export function getRankingRpcPlan(surface: RankingSurface, enableV2: boolean): RankingRpcPlan {
  if (surface === 'home') {
    if (enableV2) {
      return {
        surface,
        primaryRpc: 'get_simple_home_shuffle_v3',
        fallbackRpcs: ['get_simple_home_shuffle_v2', 'get_simple_home_shuffle'],
        provider: 'sql',
        version: 'v3',
      };
    }
    return {
      surface,
      primaryRpc: 'get_simple_home_shuffle',
      fallbackRpcs: [],
      provider: 'sql',
      version: 'v1',
    };
  }
  if (surface === 'explore_discovery') {
    return enableV2
      ? {
          surface,
          primaryRpc: 'get_simple_explore_shuffle_v3',
          fallbackRpcs: ['get_simple_explore_shuffle_v2', 'get_simple_explore_shuffle'],
          provider: 'sql',
          version: 'v3',
        }
      : {
          surface,
          primaryRpc: 'get_simple_explore_shuffle',
          fallbackRpcs: [],
          provider: 'sql',
          version: 'v1',
        };
  }
  if (surface === 'explore_for_you') {
    return enableV2
      ? {
          surface,
          primaryRpc: 'get_explore_for_you_v3',
          fallbackRpcs: ['get_explore_for_you_v2', 'get_explore_for_you'],
          provider: 'sql',
          version: 'v3',
        }
      : {
          surface,
          primaryRpc: 'get_explore_for_you',
          fallbackRpcs: [],
          provider: 'sql',
          version: 'v1',
        };
  }
  if (surface === 'spotlight') {
    return enableV2
      ? {
          surface,
          primaryRpc: 'get_spotlight_feed_smart_v3',
          fallbackRpcs: ['get_spotlight_feed_smart_v2', 'get_spotlight_feed_smart'],
          provider: 'sql',
          version: 'v3',
        }
      : {
          surface,
          primaryRpc: 'get_spotlight_feed_smart',
          fallbackRpcs: [],
          provider: 'sql',
          version: 'v1',
        };
  }
  return {
    surface,
    primaryRpc: 'get_simple_home_shuffle',
    fallbackRpcs: [],
    provider: 'sql',
    version: 'v1',
  };
}

