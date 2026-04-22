export type RankingSurface = 'home';

export type RankingRpcPlan = {
  primaryRpc: string;
  fallbackRpcs: string[];
};

export function getRankingRpcPlan(surface: RankingSurface, enableV2: boolean): RankingRpcPlan {
  if (surface === 'home') {
    if (enableV2) {
      return {
        primaryRpc: 'get_simple_home_shuffle_v3',
        fallbackRpcs: ['get_simple_home_shuffle_v2', 'get_simple_home_shuffle'],
      };
    }
    return {
      primaryRpc: 'get_simple_home_shuffle',
      fallbackRpcs: [],
    };
  }
  return {
    primaryRpc: 'get_simple_home_shuffle',
    fallbackRpcs: [],
  };
}

