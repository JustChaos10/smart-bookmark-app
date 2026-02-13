"use client";

import { createClient } from "@/lib/supabase/client";
import type { Bookmark } from "@/types/bookmark";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type BookmarkDashboardProps = {
  userId: string;
  userEmail: string;
};

const NETWORK_ERROR_PATTERN = /networkerror|failed to fetch|fetch resource|load failed/i;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isNetworkLike(cause: unknown) {
  if (typeof cause === "object" && cause !== null && "message" in cause) {
    const maybeMessage = cause.message;
    return typeof maybeMessage === "string" && NETWORK_ERROR_PATTERN.test(maybeMessage);
  }

  return cause instanceof Error && NETWORK_ERROR_PATTERN.test(cause.message);
}

function extractErrorMessage(cause: unknown, fallback: string) {
  if (typeof cause === "object" && cause !== null && "message" in cause) {
    const maybeMessage = cause.message;
    if (typeof maybeMessage === "string" && maybeMessage.trim().length > 0) {
      if (NETWORK_ERROR_PATTERN.test(maybeMessage)) {
        return "Network hiccup. Please retry once.";
      }
      return maybeMessage;
    }
  }

  if (cause instanceof Error && cause.message.trim().length > 0) {
    if (NETWORK_ERROR_PATTERN.test(cause.message)) {
      return "Network hiccup. Please retry once.";
    }
    return cause.message;
  }

  return fallback;
}

export function BookmarkDashboard({ userId, userEmail }: BookmarkDashboardProps) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBookmarks = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("bookmarks")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setBookmarks(data ?? []);
      setError(null);
    } catch (cause) {
      setError(extractErrorMessage(cause, "Unable to load bookmarks right now."));
    }
  }, [supabase]);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await loadBookmarks();
      } finally {
        setIsLoading(false);
      }
    };

    void initialize();
  }, [loadBookmarks]);

  useEffect(() => {
    const channel = supabase
      .channel(`bookmarks-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void loadBookmarks();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadBookmarks, supabase, userId]);

  const addBookmark = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setError("Title is required.");
      return;
    }

    let normalizedUrl = "";
    try {
      normalizedUrl = new URL(url.trim()).toString();
    } catch {
      setError("Please enter a valid URL.");
      return;
    }

    setIsSaving(true);

    try {
      const { data: insertedBookmark, error: insertError } = await supabase
        .from("bookmarks")
        .insert({
          user_id: userId,
          title: normalizedTitle,
          url: normalizedUrl,
        })
        .select("*")
        .single();

      if (insertError) {
        throw insertError;
      }

      if (insertedBookmark) {
        setBookmarks((prev) => [
          insertedBookmark,
          ...prev.filter((bookmark) => bookmark.id !== insertedBookmark.id),
        ]);
      }

      setTitle("");
      setUrl("");
    } catch (cause) {
      setError(extractErrorMessage(cause, "Could not add bookmark."));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBookmark = async (bookmarkId: string) => {
    setError(null);
    setDeletingId(bookmarkId);

    const executeDelete = async () => {
      const { error: deleteError } = await supabase.from("bookmarks").delete().eq("id", bookmarkId);
      if (deleteError) {
        throw deleteError;
      }
    };

    try {
      await executeDelete();
      setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== bookmarkId));
    } catch (cause) {
      const initialError = extractErrorMessage(cause, "Could not delete bookmark.");
      if (!isNetworkLike(cause)) {
        setError(initialError);
        return;
      }

      await wait(280);
      try {
        await executeDelete();
        setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== bookmarkId));
      } catch (retryCause) {
        setError(extractErrorMessage(retryCause, "Could not delete bookmark."));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const signOut = async () => {
    setError(null);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      return;
    }

    router.replace("/login");
    router.refresh();
  };

  return (
    <section className="neo-panel space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="section-label">Personal Link Atlas</p>
          <h1 className="panel-title mt-1">Your Bookmarks</h1>
          <p className="mt-3 inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-slate-200">
            {userEmail}
          </p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="ghost-btn px-4 py-2 text-sm"
        >
          Logout
        </button>
      </header>

      <form onSubmit={addBookmark} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="field text-sm"
        />
        <input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          className="field text-sm"
        />
        <button
          type="submit"
          disabled={isSaving}
          className="primary-btn px-4 py-2 text-sm disabled:cursor-not-allowed"
        >
          {isSaving ? "Adding..." : "Add"}
        </button>
      </form>

      {error ? <p className="error-chip">{error}</p> : null}

      {isLoading ? (
        <p className="status-line">Loading bookmarks...</p>
      ) : bookmarks.length === 0 ? (
        <p className="status-line">No bookmarks yet.</p>
      ) : (
        <ul className="bookmark-list">
          {bookmarks.map((bookmark) => (
            <li key={bookmark.id} className="bookmark-row">
              <a
                href={bookmark.url}
                target="_blank"
                rel="noreferrer"
                className="bookmark-link min-w-0 text-sm"
              >
                <p className="bookmark-title truncate">{bookmark.title}</p>
                <p className="bookmark-url truncate">{bookmark.url}</p>
              </a>
              <button
                type="button"
                disabled={deletingId === bookmark.id}
                onClick={() => deleteBookmark(bookmark.id)}
                className="danger-btn shrink-0 px-3 py-1.5 text-xs"
              >
                {deletingId === bookmark.id ? "Deleting..." : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
