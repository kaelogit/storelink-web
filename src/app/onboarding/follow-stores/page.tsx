'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Heart, Store } from 'lucide-react';

interface SuggestedStore {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  logo_url: string | null;
  is_following?: boolean;
}

export default function FollowStoresPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stores, setStores] = useState<SuggestedStore[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);

  useEffect(() => {
    loadSuggestedStores();
  }, []);

  const loadSuggestedStores = async () => {
    try {
      const supabase = createBrowserClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        router.push('/auth/signup');
        return;
      }

      // Call the RPC function to get suggested stores
      const { data: suggestedStores, error: rpcError } = await supabase
        .rpc('get_suggested_stores_to_follow', {
          user_id: session.session.user.id,
          limit_count: 10,
        });

      if (rpcError) throw rpcError;

      setStores(suggestedStores || []);
    } catch (err: any) {
      setError('Failed to load suggested stores');
    } finally {
      setLoadingStores(false);
    }
  };

  const toggleFollow = async (storeId: string, currentlyFollowing: boolean) => {
    try {
      const supabase = createBrowserClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) return;

      if (currentlyFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', session.session.user.id)
          .eq('following_id', storeId);

        if (error) throw error;
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: session.session.user.id,
            following_id: storeId,
            follow_type: 'store',
          });

        if (error) throw error;
      }

      // Update local state
      setStores(prev => prev.map(store =>
        store.id === storeId
          ? { ...store, is_following: !currentlyFollowing }
          : store
      ));
    } catch (err: any) {
      setError('Failed to update follow status');
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        router.push('/auth/signup');
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          onboarding_step: 'completed',
        })
        .eq('id', session.session.user.id);

      if (updateError) throw updateError;

      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    await handleComplete();
  };

  if (loadingStores) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Store size={16} className="text-emerald-600" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600">FOLLOW STORES</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Finding stores you'll <span className="italic text-emerald-600">love</span>
          </h1>
        </div>
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <Store size={16} className="text-emerald-600" />
          <span className="text-xs font-black uppercase tracking-wider text-emerald-600">FOLLOW STORES</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Follow stores you'll <span className="italic text-emerald-600">love</span>
        </h1>
        <p className="text-base sm:text-lg text-(--muted)">
          Follow some stores to personalize your feed. You can always follow more later.
        </p>
      </div>

      {/* Stores List */}
      {stores.length > 0 ? (
        <div className="space-y-4">
          {stores.map((store) => (
            <Card key={store.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-(--muted) rounded-lg flex items-center justify-center">
                  {store.logo_url ? (
                    <img
                      src={store.logo_url}
                      alt={store.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Store size={24} className="text-(--muted)" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-base truncate">{store.name}</h3>
                  <p className="text-sm text-(--muted) truncate">{store.description}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-(--muted)/50 rounded text-xs font-black">
                    {store.category}
                  </span>
                </div>

                <Button
                  onClick={() => toggleFollow(store.id, store.is_following || false)}
                  variant={store.is_following ? "outline" : "primary"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Heart
                    size={16}
                    className={store.is_following ? "fill-current" : ""}
                  />
                  {store.is_following ? 'Following' : 'Follow'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Store size={48} className="text-(--muted) mx-auto mb-4" />
          <h3 className="font-black text-lg mb-2">No stores found</h3>
          <p className="text-(--muted)">
            We couldn't find any stores to suggest right now. Don't worry, you can discover stores after completing onboarding!
          </p>
        </Card>
      )}

      {/* Error */}
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {/* Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleComplete}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Completing...' : 'Complete Onboarding'}
        </Button>

        <Button
          onClick={handleSkip}
          variant="outline"
          disabled={loading}
          className="w-full"
        >
          Skip for Now
        </Button>
      </div>
    </div>
  );
}