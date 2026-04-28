import Link from 'next/link';
import { Bookmark, Heart, MessageCircle, MessageSquare, ShoppingBag, UserPlus, WandSparkles } from 'lucide-react';
type ActionRequiredPageProps = {
  searchParams: Promise<{
    action?: string;
    next?: string;
  }>;
};

export default async function AuthActionRequiredPage({ searchParams }: ActionRequiredPageProps) {
  const query = await searchParams;
  const action = String(query?.action || 'This action').trim();
  const next = String(query?.next || '/').trim() || '/';
  const loginHref = `/auth/login?next=${encodeURIComponent(next)}`;
  const signupHref = `/auth/signup?next=${encodeURIComponent(next)}`;
  const downloadHref = `/download?intent=${encodeURIComponent(next)}`;
  const actionLower = action.toLowerCase();

  const actionMeta = (() => {
    if (actionLower.includes('comment')) {
      return {
        icon: MessageCircle,
        title: 'Comment as a member',
        subtitle: 'Join the conversation with your StoreLink account.',
        pill: 'COMMENT',
      };
    }
    if (actionLower.includes('like')) {
      return {
        icon: Heart,
        title: 'Like this item',
        subtitle: 'Save your likes and personalize your discovery feed.',
        pill: 'LIKE',
      };
    }
    if (actionLower.includes('save') || actionLower.includes('wishlist') || actionLower.includes('bookmark')) {
      return {
        icon: Bookmark,
        title: 'Save to wishlist',
        subtitle: 'Keep favorites in one place across app and web.',
        pill: 'SAVE',
      };
    }
    if (actionLower.includes('follow')) {
      return {
        icon: UserPlus,
        title: 'Follow this profile',
        subtitle: 'Get updates from stores and creators you trust.',
        pill: 'FOLLOW',
      };
    }
    if (actionLower.includes('message') || actionLower.includes('chat')) {
      return {
        icon: MessageSquare,
        title: 'Send a message',
        subtitle: 'Start secure chat with your StoreLink account.',
        pill: 'MESSAGE',
      };
    }
    if (actionLower.includes('cart') || actionLower.includes('buy') || actionLower.includes('checkout')) {
      return {
        icon: ShoppingBag,
        title: 'Continue to checkout',
        subtitle: 'Sign in to cart, checkout, and order tracking.',
        pill: 'CHECKOUT',
      };
    }
    return {
      icon: WandSparkles,
      title: 'Continue this action',
      subtitle: `${action} requires an account. Sign in, create a new account, or download the app.`,
      pill: 'ACTION',
    };
  })();

  const ActionIcon = actionMeta.icon;

  return (
    <div className="min-h-screen bg-(--background) px-4 py-10 text-(--foreground)">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-(--border) bg-(--card) p-6 shadow-xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
          <ActionIcon size={12} className="text-emerald-600" />
          <p className="text-[10px] font-black tracking-widest text-emerald-600">
            {actionMeta.pill}
          </p>
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight">{actionMeta.title}</h1>
        <p className="mt-2 text-sm text-(--muted)">
          {actionMeta.subtitle}
        </p>

        <div className="mt-6 space-y-3">
          <Link
            href={loginHref}
            className="block w-full rounded-2xl bg-(--foreground) px-4 py-3 text-center text-sm font-black text-(--background)"
          >
            Sign in
          </Link>
          <Link
            href={signupHref}
            className="block w-full rounded-2xl border border-(--border) bg-(--surface) px-4 py-3 text-center text-sm font-black text-(--foreground)"
          >
            Create account
          </Link>
          <Link
            href={downloadHref}
            className="block w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-black text-emerald-600"
          >
            Download app
          </Link>
        </div>
      </div>
    </div>
  );
}
