'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Tag } from 'lucide-react';

const INTEREST_CATEGORIES = [
  'Fashion & Clothing',
  'Electronics & Gadgets',
  'Home & Garden',
  'Food & Beverage',
  'Health & Beauty',
  'Sports & Fitness',
  'Books & Media',
  'Art & Crafts',
  'Automotive',
  'Travel & Tourism',
  'Technology',
  'Music & Entertainment',
  'Pets & Animals',
  'Education',
  'Business & Finance',
  'Gaming',
  'Photography',
  'Cooking & Baking',
  'Fitness & Wellness',
  'Parenting',
];

export default function PickCategoriesPage() {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else if (prev.length < 5) {
        return [...prev, category];
      }
      return prev;
    });
  };

  const handleContinue = async () => {
    if (selectedCategories.length < 3) {
      setError('Please select at least 3 categories');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        router.push('/auth/signup');
        return;
      }

      // First, get the current user profile to check if they're a seller
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, is_seller')
        .eq('id', session.session.user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Insert selected categories
      const categoryInserts = selectedCategories.map(category => ({
        user_id: profile.id,
        category_name: category,
      }));

      const { error: insertError } = await supabase
        .from('buyer_interested_categories')
        .insert(categoryInserts);

      if (insertError) throw insertError;

      // Update onboarding step
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          onboarding_step: profile.is_seller ? 'follow-stores' : 'collector-setup',
        })
        .eq('id', session.session.user.id);

      if (updateError) throw updateError;

      router.push(profile.is_seller ? '/onboarding/follow-stores' : '/onboarding/collector-setup');
    } catch (err: any) {
      setError(err?.message || 'Failed to save categories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <Tag size={16} className="text-emerald-600" />
          <span className="text-xs font-black uppercase tracking-wider text-emerald-600">INTERESTS</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          What are you <span className="italic text-emerald-600">interested in?</span>
        </h1>
        <p className="text-base sm:text-lg text-(--muted)">
          Select 3-5 categories to personalize your experience. You can change this anytime.
        </p>
      </div>

      {/* Selection Info */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-(--muted)">
            Selected: {selectedCategories.length} / 5
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-(--muted)">
            MINIMUM 3 REQUIRED
          </span>
        </div>
      </Card>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {INTEREST_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category);
          const isDisabled = !isSelected && selectedCategories.length >= 5;

          return (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              disabled={isDisabled}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/5 text-emerald-700'
                  : isDisabled
                  ? 'border-(--border) bg-(--muted)/20 text-(--muted) cursor-not-allowed'
                  : 'border-(--border) hover:border-emerald-500 hover:bg-emerald-500/5'
              }`}
            >
              <span className="text-sm font-black leading-tight">{category}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Categories */}
      {selectedCategories.length > 0 && (
        <Card className="p-4">
          <h3 className="font-black text-sm mb-3">SELECTED CATEGORIES:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((category) => (
              <div
                key={category}
                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full"
              >
                <span className="text-xs font-black text-emerald-700">{category}</span>
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors"
                >
                  <span className="text-xs text-white leading-none">×</span>
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Error */}
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {/* Button */}
      <Button
        onClick={handleContinue}
        disabled={loading || selectedCategories.length < 3}
        className="w-full"
      >
        {loading ? 'Saving...' : `Continue with ${selectedCategories.length} categories`}
      </Button>
    </div>
  );
}