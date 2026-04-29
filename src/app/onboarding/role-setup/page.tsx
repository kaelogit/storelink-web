'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ShoppingBag, Store, Check } from 'lucide-react';

const ROLES = [
  {
    id: 'shopper',
    title: 'SHOPPER',
    description: 'I want to browse unique items, follow shops, and curate my wishlist.',
    icon: ShoppingBag,
    color: 'emerald',
    isSeller: false,
    prestige: 1,
  },
  {
    id: 'seller',
    title: 'SELLER',
    description: 'I want to sell products and offer services with bookings, all from my StoreLink page.',
    icon: Store,
    color: 'emerald', // Kept emerald for brand consistency, or use 'blue' to match your previous web logic
    isSeller: true,
    prestige: 2,
  },
];

export default function RoleSetupPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/auth/signup');
        return;
      }

      const role = ROLES.find((r) => r.id === selectedRole);
      if (!role) throw new Error('Invalid role selected');

      // 🔄 DATABASE SYNC: Perfectly matching the Mobile Payload
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_seller: role.isSeller,
          prestige_weight: role.prestige,
          subscription_plan: role.isSeller ? 'standard' : null,
          subscription_status: role.isSeller ? 'active' : null,
          onboarding_step: 'location-permission', // Handing off to the next screen
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // 🚀 Route to the location permission explainer
      router.push('/onboarding/location-permission');
    } catch (err: any) {
      console.error('❌ Role Setup Error:', err);
      setError(err?.message || 'Unable to save choice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        {/* Progress Bar (Matching Mobile's 50% step) */}
        <div className="w-12 h-1.5 rounded-full bg-[var(--surface)] mb-6">
          <div className="w-1/2 h-full rounded-full bg-emerald-500" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">CHOOSE YOUR ROLE</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-[1.1]">
          WHAT BRINGS YOU TO <br />
          <span className="italic text-emerald-600">STORELINK?</span>
        </h1>
        <p className="text-base sm:text-lg text-[var(--muted)] font-medium">
          This customizes your experience.
        </p>
      </div>

      {/* Role Cards */}
      <div className="space-y-4">
        {ROLES.map((role) => {
          const Icon = role.icon;
          const isActive = selectedRole === role.id;
          
          return (
            <Card
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`p-6 cursor-pointer transition-all duration-300 border-2 relative overflow-hidden ${
                isActive
                  ? 'border-emerald-500 bg-emerald-500/[0.03] shadow-lg shadow-emerald-500/5'
                  : 'border-transparent hover:border-[var(--border)] bg-[var(--background)]'
              }`}
            >
              <div className="flex items-center gap-4 relative z-10">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
                    isActive ? 'bg-emerald-500 text-white' : 'bg-[var(--surface)] text-emerald-600'
                  }`}
                >
                  <Icon size={28} strokeWidth={2.5} />
                </div>
                
                <div className="flex-1 space-y-1">
                  <h3 className="font-black text-xl tracking-tight">{role.title}</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed max-w-[240px]">
                    {role.description}
                  </p>
                </div>

                {isActive && (
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-md animate-in zoom-in duration-300">
                    <Check size={16} className="text-white" strokeWidth={4} />
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="pt-4 space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] text-center">
          SECURE • GLOBAL • FAST
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <Button
          onClick={handleContinue}
          disabled={loading || !selectedRole}
          className="w-full h-16 text-lg font-black tracking-widest uppercase transition-all active:scale-[0.98]"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>SAVING...</span>
            </div>
          ) : (
            'CONTINUE'
          )}
        </Button>
      </div>
    </div>
  );
}