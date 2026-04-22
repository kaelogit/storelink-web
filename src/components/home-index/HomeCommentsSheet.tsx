'use client';

import { useEffect, useMemo, useState } from 'react';
import { Heart, MessageCircleReply, Send, Trash2, X } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';

export default function HomeCommentsSheet({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: any;
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [expandedReplyRoots, setExpandedReplyRoots] = useState<Record<string, number>>({});
  const [pendingLikeIds, setPendingLikeIds] = useState<Set<string>>(new Set());
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());
  const isService = useMemo(() => item?.type === 'service' || !!item?.service_listing_id, [item]);

  const fetchComments = async (uid: string | null) => {
    if (!item?.id) return [];
    if (isService) {
      const res = await supabase.rpc('get_service_comments_with_merit', {
        p_service_listing_id: item.id,
        p_user_id: uid,
      });
      return res.data || [];
    }
    const res = await supabase.rpc('get_comments_with_merit', {
      p_product_id: item.id,
      p_user_id: uid,
    });
    return res.data || [];
  };

  useEffect(() => {
    if (!open || !item?.id) return;
    let active = true;
    (async () => {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      if (!active) return;
      setViewerId(uid);
      const data = await fetchComments(uid);
      if (!active) return;
      setRows(data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [open, item?.id, isService, supabase]);

  const refresh = async () => {
    const data = await fetchComments(viewerId);
    setRows(data);
  };

  const submitComment = async () => {
    const content = text.trim();
    if (!content || !item?.id || submitting) return;
    setSubmitting(true);
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) {
      setSubmitting(false);
      return;
    }
    const table = isService ? 'service_comments' : 'product_comments';
    const fk = isService ? 'service_listing_id' : 'product_id';
    const payload: Record<string, any> = { user_id: userId, content, parent_id: replyTo?.id || null };
    payload[fk] = item.id;
    const { error } = await supabase.from(table).insert(payload);
    if (!error) {
      setText('');
      setReplyTo(null);
      await refresh();
    }
    setSubmitting(false);
  };

  const toggleCommentLike = async (commentId: string) => {
    if (!viewerId) return;
    if (pendingLikeIds.has(commentId)) return;
    setPendingLikeIds((prev) => new Set(prev).add(commentId));
    const snapshot = rows;
    setRows((prev) =>
      prev.map((row) =>
        row.id === commentId
          ? {
              ...row,
              is_liked: !row.is_liked,
              likes_count: row.is_liked ? Math.max(0, Number(row.likes_count || 0) - 1) : Number(row.likes_count || 0) + 1,
            }
          : row,
      ),
    );
    if (isService) {
      const res = await supabase.rpc('toggle_service_comment_like', { p_comment_id: commentId, p_user_id: viewerId });
      if (res.error) setRows(snapshot);
    } else {
      const res = await supabase.rpc('toggle_comment_like', { p_comment_id: commentId, p_user_id: viewerId });
      if (res.error) setRows(snapshot);
    }
    setPendingLikeIds((prev) => {
      const next = new Set(prev);
      next.delete(commentId);
      return next;
    });
  };

  const deleteComment = async (commentId: string) => {
    if (pendingDeleteIds.has(commentId)) return;
    setPendingDeleteIds((prev) => new Set(prev).add(commentId));
    const snapshot = rows;
    setRows((prev) => prev.filter((r: any) => r.id !== commentId && r.parent_id !== commentId));
    const table = isService ? 'service_comments' : 'product_comments';
    const res = await supabase.from(table).delete().eq('id', commentId);
    if (res.error) setRows(snapshot);
    else await refresh();
    setPendingDeleteIds((prev) => {
      const next = new Set(prev);
      next.delete(commentId);
      return next;
    });
  };

  const structuredRows = useMemo(() => {
    const roots = rows.filter((r: any) => !r.parent_id);
    const children = rows.filter((r: any) => !!r.parent_id);
    const output: any[] = [];
    roots.forEach((root: any) => {
      output.push({ kind: 'root', row: root });
      const rootChildren = children
        .filter((child: any) => child.parent_id === root.id)
        .sort((a: any, b: any) => +new Date(a.created_at) - +new Date(b.created_at));
      const totalReplies = rootChildren.length;
      const visible = Math.min(totalReplies, expandedReplyRoots[root.id] || 0);
      if (totalReplies > 0 && visible === 0) {
        output.push({ kind: 'toggle', rootId: root.id, total: totalReplies, remaining: totalReplies, isLoadMore: false });
      }
      rootChildren.slice(0, visible).forEach((child: any) => output.push({ kind: 'child', row: child }));
      const remaining = totalReplies - visible;
      if (remaining > 0 && visible > 0) {
        output.push({ kind: 'toggle', rootId: root.id, total: totalReplies, remaining, isLoadMore: true });
      }
    });
    return output;
  }, [rows, expandedReplyRoots]);

  const timeAgo = (value: string) => {
    const ts = +new Date(value);
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'now';
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    const d = Math.floor(hr / 24);
    return `${d}d`;
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-90 bg-black/45 flex items-end sm:items-center sm:justify-center">
      <button type="button" aria-label="Close comments" className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-(--card) border border-(--border) max-h-[81vh] overflow-hidden flex flex-col">
        <div className="py-3">
          <div className="w-10 h-1 rounded-full bg-(--border) mx-auto" />
        </div>
        <div className="relative border-b border-(--border) pb-3 px-4">
          <h3 className="text-base font-black text-(--foreground) text-center">
            {rows.length} {rows.length === 1 ? 'Comment' : 'Comments'}
          </h3>
          <button type="button" onClick={onClose} className="absolute right-4 top-0 text-(--foreground)">
            <X size={20} />
          </button>
        </div>

        <div className="mt-3 flex-1 overflow-y-auto px-4 pr-3 space-y-3">
          {loading ? <p className="text-sm text-(--muted)">Loading comments...</p> : null}
          {!loading && structuredRows.length === 0 ? <p className="text-sm text-(--muted)">No comments yet.</p> : null}
          {structuredRows.map((entry: any, index: number) => {
            if (entry.kind === 'toggle') {
              return (
                <button
                  key={`toggle-${entry.rootId}-${index}`}
                  type="button"
                  onClick={() =>
                    setExpandedReplyRoots((prev) => ({
                      ...prev,
                      [entry.rootId]: entry.isLoadMore ? Math.min(entry.total, (prev[entry.rootId] || 0) + 15) : 15,
                    }))
                  }
                  className="ml-12 text-xs font-bold text-(--muted)"
                >
                  {entry.isLoadMore ? `View ${entry.remaining} more replies` : `View ${entry.total} replies`}
                </button>
              );
            }
            const row = entry.row;
            const isChild = entry.kind === 'child';
            const mine = viewerId && row.user_id === viewerId;
            return (
              <div key={`${row.id}-${entry.kind}-${index}`} className={`flex items-start gap-2 relative ${isChild ? 'ml-9 -mt-1' : ''}`}>
                {isChild ? <span className="absolute -left-5 top-[-10px] bottom-4 w-[2px] rounded-full bg-(--border)" /> : null}
                <div className={`overflow-hidden border ${isChild ? 'h-7 w-7 rounded-[10px]' : 'h-[34px] w-[34px] rounded-xl'} ${row.user_plan === 'diamond' ? 'border-violet-500' : 'border-(--border)'}`}>
                  <img
                    src={row.user_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.user_slug || 'U')}`}
                    alt={row.user_slug || 'user'}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="font-black text-(--muted)">@{row.user_slug || 'user'}</span>
                    <span className="ml-auto text-(--muted)">{timeAgo(row.created_at)}</span>
                  </div>
                  <p className="text-sm text-(--foreground) mt-0.5 whitespace-pre-wrap">{row.content}</p>
                  <div className="mt-1 flex items-center gap-4">
                    <button type="button" className="text-xs font-bold text-(--muted) inline-flex items-center gap-1" onClick={() => setReplyTo({ id: row.parent_id || row.id, user_slug: row.user_slug })}>
                      <MessageCircleReply size={12} /> Reply
                    </button>
                    {mine ? (
                      <button type="button" className="text-xs font-bold text-red-500 inline-flex items-center gap-1" onClick={() => deleteComment(row.id)}>
                        <Trash2 size={12} /> Delete
                      </button>
                    ) : null}
                  </div>
                </div>
                <button type="button" className="pt-0.5 flex flex-col items-center" onClick={() => toggleCommentLike(row.id)}>
                  <Heart size={14} className={row.is_liked ? 'text-emerald-500 fill-emerald-500' : 'text-(--muted)'} />
                  <span className="text-[10px] text-(--muted)">{row.likes_count || ''}</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-3 rounded-xl border border-(--border) bg-(--surface) p-2 mx-4 mb-4 flex items-center gap-2 relative">
          {replyTo ? (
            <div className="absolute -top-8 left-0 text-xs text-(--muted) bg-(--surface) border border-(--border) px-2 py-1 rounded-lg inline-flex items-center gap-1">
              Replying to @{replyTo.user_slug}
              <button type="button" onClick={() => setReplyTo(null)}>
                <X size={12} />
              </button>
            </div>
          ) : null}
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={replyTo ? `Reply to @${replyTo.user_slug}...` : 'Add a comment...'}
            className="h-9 flex-1 bg-transparent outline-none text-sm text-(--foreground) placeholder:text-(--muted)"
          />
          <button type="button" onClick={submitComment} disabled={submitting || !text.trim()} className="h-9 w-9 rounded-lg bg-emerald-600 disabled:bg-emerald-300 text-white flex items-center justify-center">
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

