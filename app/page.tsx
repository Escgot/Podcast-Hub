"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- SUB-COMPONENT: Ultra-Premium Library Card ---
function SortableBookmarkItem({ bookmark, handleDelete, handleSaveNotes, isAdmin, viewMode }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bookmark.id,
    disabled: !isAdmin
  });
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(bookmark.notes || "");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms cubic-bezier(0.2, 0, 0, 1)',
    zIndex: isDragging ? 50 : 1,
  };

  const isList = viewMode === "list";

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(bookmark.url);
    alert("Link copied to clipboard!");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      ref={setNodeRef}
      style={style}
      className={`group relative flex transition-all duration-500 ${isList
        ? "flex-col md:flex-row gap-8 p-3 rounded-[2rem] items-center"
        : "flex-col rounded-[2rem] overflow-hidden"
        } ${isDragging
          ? "bg-zinc-800/80 border-zinc-500 shadow-2xl scale-[1.02] z-50 backdrop-blur-xl"
          : "bg-zinc-900/20 border border-white/5 hover:bg-zinc-900/50 hover:border-white/10 z-10"
        }`}
    >
      <div className={`relative bg-black flex-shrink-0 overflow-hidden ${isList ? "w-full sm:w-80 md:w-[22rem] aspect-video rounded-[1.5rem]" : "w-full aspect-video rounded-t-[2rem]"
        }`}>
        {bookmark.thumbnail_url ? (
          <img src={bookmark.thumbnail_url} alt="Cover" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90 group-hover:opacity-100" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900 border border-white/5">
            <span className="text-zinc-600 font-medium tracking-[0.2em] uppercase text-[10px]">No Artwork</span>
          </div>
        )}

        <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] rounded-[inherit] pointer-events-none" />

        {isAdmin && (
          <div className="absolute top-4 left-4">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-zinc-400 hover:text-white transition-all">
              <svg className="w-4 h-4" viewBox="0 0 16 24" fill="currentColor">
                <circle cx="6" cy="6" r="1.5" /><circle cx="10" cy="6" r="1.5" />
                <circle cx="6" cy="12" r="1.5" /><circle cx="10" cy="12" r="1.5" />
                <circle cx="6" cy="18" r="1.5" /><circle cx="10" cy="18" r="1.5" />
              </svg>
            </div>
          </div>
        )}

        {isAdmin && !isList && (
          <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out">
            <button onClick={() => setIsEditing(!isEditing)} className="p-3 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button onClick={() => handleDelete(bookmark.id)} className="p-3 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-zinc-300 hover:text-red-400 hover:border-red-500/30 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        )}
      </div>

      <div className={`flex-1 flex flex-col relative w-full ${isList ? "py-4 pr-6" : "p-8 pt-6"}`}>
        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-1.5 max-w-[85%]">
            <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">
              {(bookmark.podcast_name || bookmark.platform) && (
                <span>{bookmark.podcast_name || bookmark.platform}</span>
              )}
              {bookmark.publish_date && (
                <>
                  <span className="w-1 h-1 rounded-full bg-zinc-700 flex-shrink-0" />
                  <span>
                    {new Date(bookmark.publish_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </>
              )}
              {bookmark.view_count && (
                <>
                  <span className="w-1 h-1 rounded-full bg-zinc-700 flex-shrink-0" />
                  <span>
                    {Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(bookmark.view_count))} Views
                  </span>
                </>
              )}
            </div>

            <h3 className="text-xl font-semibold text-zinc-100 tracking-tight leading-snug">
              <a href={bookmark.url} target="_blank" rel="noreferrer" className="hover:text-white transition-colors line-clamp-2">
                {bookmark.episode_title}
              </a>
            </h3>
          </div>

          <div className="flex gap-2 items-center flex-shrink-0">
            <button onClick={handleShare} className="p-2.5 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all" title="Share Link">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>

            {isAdmin && isList && (
              <div className="flex gap-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out">
                <button onClick={() => setIsEditing(!isEditing)} className="p-2.5 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => handleDelete(bookmark.id)} className="p-2.5 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {isEditing && isAdmin ? (
          <div className="mt-6 flex flex-col gap-4 w-full">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add minimalist insights..." className="w-full p-5 text-sm bg-black border border-white/10 rounded-[1.5rem] focus:border-white/30 text-zinc-200 outline-none resize-none transition-all placeholder:text-zinc-600" rows={3} />
            <button onClick={() => { handleSaveNotes(bookmark.id, notes); setIsEditing(false); }} className="bg-white hover:bg-zinc-200 text-black py-3 px-6 rounded-full text-xs font-bold self-end transition-all">Save Insights</button>
          </div>
        ) : (
          bookmark.notes && (
            <div className="mt-6 pl-4 border-l-2 border-white/10">
              <p className="text-sm text-zinc-400 leading-relaxed">
                {bookmark.notes}
              </p>
            </div>
          )
        )}
      </div>
    </motion.div>
  );
}

// --- SUB-COMPONENT: Ultra-Premium Sortable Suggestion Card ---
function SortableSuggestionItem({ suggestion, isAdmin, viewMode, onApprove, onReject, onMoveToLibrary, handleSaveNotes }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: suggestion.id,
    disabled: !isAdmin
  });

  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(suggestion.notes || "");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms cubic-bezier(0.2, 0, 0, 1)',
    zIndex: isDragging ? 50 : 1,
  };

  const isList = viewMode === "list";

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(suggestion.url);
    alert("Link copied to clipboard!");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      ref={setNodeRef}
      style={style}
      className={`group relative flex transition-all duration-500 ${isList
        ? "flex-col md:flex-row gap-8 p-3 rounded-[2rem] items-center"
        : "flex-col rounded-[2rem] overflow-hidden"
        } ${isDragging
          ? "bg-zinc-800/80 border-zinc-500 shadow-2xl scale-[1.02] z-50 backdrop-blur-xl"
          : "bg-zinc-900/20 border border-white/5 hover:bg-zinc-900/50 hover:border-white/10 z-10"
        }`}
    >
      <div className={`relative bg-black flex-shrink-0 overflow-hidden ${isList ? "w-full sm:w-80 md:w-[22rem] aspect-video rounded-[1.5rem]" : "w-full aspect-video rounded-t-[2rem]"
        }`}>
        {suggestion.thumbnail_url ? (
          <img src={suggestion.thumbnail_url} alt="Cover" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90 group-hover:opacity-100" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900 border border-white/5">
            <span className="text-zinc-600 font-medium tracking-[0.2em] uppercase text-[10px]">No Artwork</span>
          </div>
        )}

        <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] rounded-[inherit] pointer-events-none" />

        {/* Drag Handle */}
        {isAdmin && (
          <div className="absolute top-4 left-4">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-zinc-400 hover:text-white transition-all">
              <svg className="w-4 h-4" viewBox="0 0 16 24" fill="currentColor">
                <circle cx="6" cy="6" r="1.5" /><circle cx="10" cy="6" r="1.5" />
                <circle cx="6" cy="12" r="1.5" /><circle cx="10" cy="12" r="1.5" />
                <circle cx="6" cy="18" r="1.5" /><circle cx="10" cy="18" r="1.5" />
              </svg>
            </div>
          </div>
        )}

        {/* Grid Mode Inline Actions */}
        {isAdmin && !isList && (
          <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out">
            {!suggestion.is_approved ? (
              <button onClick={() => onApprove(suggestion.id)} className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold transition-all hover:bg-zinc-200">Approve</button>
            ) : (
              <button onClick={() => onMoveToLibrary(suggestion)} className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold transition-all hover:bg-zinc-200">Deploy</button>
            )}
            <button onClick={() => setIsEditing(!isEditing)} className="p-3 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button onClick={() => onReject(suggestion.id)} className="p-3 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-zinc-300 hover:text-red-400 hover:border-red-500/30 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        )}
      </div>

      <div className={`flex-1 flex flex-col relative w-full ${isList ? "py-4 pr-6" : "p-8 pt-6"}`}>
        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-1.5 max-w-[85%]">
            <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">
              {(suggestion.podcast_name || suggestion.platform) && (
                <span>{suggestion.podcast_name || suggestion.platform}</span>
              )}
              {suggestion.publish_date && (
                <>
                  <span className="w-1 h-1 rounded-full bg-zinc-700 flex-shrink-0" />
                  <span>
                    {new Date(suggestion.publish_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </>
              )}
              {suggestion.view_count && (
                <>
                  <span className="w-1 h-1 rounded-full bg-zinc-700 flex-shrink-0" />
                  <span>
                    {Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(suggestion.view_count))} Views
                  </span>
                </>
              )}
            </div>

            <h3 className="text-xl font-semibold text-zinc-100 tracking-tight leading-snug">
              <a href={suggestion.url} target="_blank" rel="noreferrer" className="hover:text-white transition-colors line-clamp-2">
                {suggestion.episode_title}
              </a>
            </h3>
          </div>

          <div className="flex gap-2 items-center flex-shrink-0">
            <button onClick={handleShare} className="p-2.5 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all" title="Share Link">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>

            {/* List Mode Icons (Edit / Delete) */}
            {isAdmin && isList && (
              <div className="flex gap-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out">
                <button onClick={() => setIsEditing(!isEditing)} className="p-2.5 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => onReject(suggestion.id)} className="p-2.5 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* List Mode Actions (Approve / Deploy) */}
        {isAdmin && isList && (
          <div className="mt-8 flex gap-3">
            {!suggestion.is_approved ? (
              <button onClick={() => onApprove(suggestion.id)} className="bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full text-xs font-bold transition-all">Approve Submission</button>
            ) : (
              <button onClick={() => onMoveToLibrary(suggestion)} className="bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full text-xs font-bold transition-all">Deploy to Library</button>
            )}
          </div>
        )}

        {/* Notes Editor Block */}
        {isEditing && isAdmin ? (
          <div className="mt-6 flex flex-col gap-4 w-full">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add minimalist insights..." className="w-full p-5 text-sm bg-black border border-white/10 rounded-[1.5rem] focus:border-white/30 text-zinc-200 outline-none resize-none transition-all placeholder:text-zinc-600" rows={3} />
            <button onClick={() => { handleSaveNotes(suggestion.id, notes); setIsEditing(false); }} className="bg-white hover:bg-zinc-200 text-black py-3 px-6 rounded-full text-xs font-bold self-end transition-all">Save Insights</button>
          </div>
        ) : (
          suggestion.notes && (
            <div className="mt-6 pl-4 border-l-2 border-white/10">
              <p className="text-sm text-zinc-400 leading-relaxed">
                {suggestion.notes}
              </p>
            </div>
          )
        )}
      </div>
    </motion.div>
  );
}

// --- MAIN PORTAL COMPONENT ---
export default function Home() {
  const [activeTab, setActiveTab] = useState("library");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "views">("default");

  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionUrl, setSuggestionUrl] = useState("");
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    fetchBookmarks();
    fetchSuggestions();
  }, []);

  const fetchBookmarks = async () => {
    const { data } = await supabase.from("bookmarks").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
    if (data) setBookmarks(data);
  };

  const fetchSuggestions = async () => {
    const { data } = await supabase.from("suggestions").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
    if (data) setSuggestions(data);
  };

  const handleAdminUnlock = () => {
    if (isAdmin) { setIsAdmin(false); return; }
    const passcode = window.prompt("Enter Admin Passcode:");
    const correctPasscode = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || "7412";
    if (passcode === correctPasscode) { setIsAdmin(true); }
    else if (passcode !== null) { alert("Incorrect passcode."); }
  };

  // Filter and Sort Processing Engine (FIXED: Targeted podcast_name & platform correctly)
  const processItems = (items: any[]) => {
    let filtered = items.filter((item) => {
      const query = searchQuery.toLowerCase();
      const matchesTitle = item.episode_title?.toLowerCase().includes(query);
      const matchesPodcastName = item.podcast_name?.toLowerCase().includes(query);
      const matchesPlatform = item.platform?.toLowerCase().includes(query);
      return matchesTitle || matchesPodcastName || matchesPlatform;
    });

    if (sortBy === "views") {
      filtered = [...filtered].sort((a, b) => {
        const viewsA = parseInt(a.view_count) || 0;
        const viewsB = parseInt(b.view_count) || 0;
        return viewsB - viewsA;
      });
    }
    return filtered;
  };

  // --- LIBRARY FUNCTIONS ---
  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return alert("Please paste a URL first!");
    setLoading(true); setPreview(null);
    try {
      const res = await fetch("/api/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) });
      const data = await res.json();
      if (res.ok) setPreview(data);
      else alert("Scraper Error: " + (data.error || "Could not parse the link."));
    } catch (err) { alert("Network Error"); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!preview) return;

    // FIX: Target top placement by subtracting 1 from the minimum sort order
    const minSortOrder = bookmarks.length > 0 ? Math.min(...bookmarks.map(b => b.sort_order ?? 0)) : 0;

    const { data, error } = await supabase.from("bookmarks").insert([{
      url: preview.url,
      podcast_name: preview.author || preview.platform,
      episode_title: preview.episode_title,
      platform: preview.platform,
      description: preview.description,
      thumbnail_url: preview.thumbnail_url,
      publish_date: preview.publish_date,
      view_count: preview.view_count,
      sort_order: minSortOrder - 1
    }]).select();

    if (error) { alert("Database Error: " + error.message); return; }
    if (data) {
      setBookmarks([data[0], ...bookmarks]); // Prepend locally
      setPreview(null);
      setUrl("");
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    setBookmarks(bookmarks.filter((b) => b.id !== id));
  };

  const handleSaveNotes = async (id: string, notes: string) => {
    await supabase.from("bookmarks").update({ notes }).eq("id", id);
    setBookmarks(bookmarks.map(b => b.id === id ? { ...b, notes } : b));
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id && isAdmin) {
      setBookmarks((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newArray = arrayMove(items, oldIndex, newIndex);
        newArray.forEach((item, index) => { supabase.from("bookmarks").update({ sort_order: index }).eq("id", item.id).then(); });
        return newArray;
      });
    }
  };

  // --- SUGGESTION FUNCTIONS ---
  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestionLoading(true);
    try {
      const res = await fetch("/api/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: suggestionUrl }) });
      const previewData = await res.json();
      if (res.ok) {
        // FIX: Target top placement by subtracting 1 from the minimum sort order
        const minSortOrder = suggestions.length > 0 ? Math.min(...suggestions.map(s => s.sort_order ?? 0)) : 0;

        const { data, error } = await supabase.from("suggestions").insert([{
          url: previewData.url,
          podcast_name: previewData.author || previewData.platform,
          episode_title: previewData.episode_title,
          platform: previewData.platform,
          description: previewData.description,
          thumbnail_url: previewData.thumbnail_url,
          publish_date: previewData.publish_date,
          view_count: previewData.view_count,
          sort_order: minSortOrder - 1,
          is_approved: false
        }]).select();
        if (error) { alert("Database Error: " + error.message); }
        else if (data) {
          setSuggestions([data[0], ...suggestions]); // Prepend locally
          setSuggestionUrl("");
          alert("Suggestion submitted for review.");
        }
      } else { alert("Could not pull data."); }
    } catch (err) { console.error("Scrape failed", err); } finally { setSuggestionLoading(false); }
  };

  const handleApproveSuggestion = async (id: string) => {
    await supabase.from("suggestions").update({ is_approved: true }).eq("id", id);
    setSuggestions(suggestions.map(s => s.id === id ? { ...s, is_approved: true } : s));
  };

  const handleRejectSuggestion = async (id: string) => {
    await supabase.from("suggestions").delete().eq("id", id);
    setSuggestions(suggestions.filter(s => s.id !== id));
  };

  const handleSaveSuggestionNotes = async (id: string, notes: string) => {
    await supabase.from("suggestions").update({ notes }).eq("id", id);
    setSuggestions(suggestions.map(s => s.id === id ? { ...s, notes } : s));
  };

  const handleMoveToLibrary = async (suggestion: any) => {
    // FIX: Target top placement by subtracting 1 from the minimum sort order
    const minSortOrder = bookmarks.length > 0 ? Math.min(...bookmarks.map(b => b.sort_order ?? 0)) : 0;

    const { data } = await supabase.from("bookmarks").insert([{
      url: suggestion.url,
      podcast_name: suggestion.podcast_name,
      episode_title: suggestion.episode_title,
      platform: suggestion.platform,
      description: suggestion.description,
      thumbnail_url: suggestion.thumbnail_url,
      publish_date: suggestion.publish_date,
      view_count: suggestion.view_count,
      sort_order: minSortOrder - 1
    }]).select();

    if (data) {
      setBookmarks([data[0], ...bookmarks]); // Prepend locally
      handleRejectSuggestion(suggestion.id);
    }
  };

  // Safe dual-list Drag n' Drop handler
  const handleSuggestionDragEnd = (event: any, listType: "approved" | "unapproved") => {
    const { active, over } = event;
    if (active && over && active.id !== over.id && isAdmin) {
      setSuggestions((allItems) => {
        const isAppr = listType === "approved";

        const targetList = allItems.filter(s => s.is_approved === isAppr);
        const otherList = allItems.filter(s => s.is_approved !== isAppr);

        const oldIndex = targetList.findIndex(item => item.id === active.id);
        const newIndex = targetList.findIndex(item => item.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return allItems;

        const reorderedList = arrayMove(targetList, oldIndex, newIndex);

        // FIX: Update sort_order locally AND in database so inline layout sorting respects the changes
        const updatedReorderedList = reorderedList.map((item, index) => {
          supabase.from("suggestions").update({ sort_order: index }).eq("id", item.id).then();
          return { ...item, sort_order: index };
        });

        return [...updatedReorderedList, ...otherList];
      });
    }
  };

  const renderLayoutToolbar = (title: string, count: number) => (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
        <p className="text-sm text-zinc-500 font-medium">{count} Podcasts matched</p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex items-center">
          <svg className="w-4 h-4 absolute left-3.5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search titles or channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-10 pr-4 py-2 text-xs font-medium bg-black/40 border border-white/5 rounded-full text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 focus:bg-black/60 transition-all duration-300"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex bg-black p-1 rounded-full border border-white/5 relative">
            {[
              { id: "default", label: "Default Sort" },
              { id: "views", label: "Most Viewed" }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id as "default" | "views")}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-full transition-colors duration-300 z-10 ${sortBy === option.id ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
              >
                {sortBy === option.id && (
                  <motion.div
                    layoutId="activeSort"
                    className="absolute inset-0 bg-zinc-800 rounded-full -z-10"
                    transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                  />
                )}
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex bg-black p-1 rounded-full border border-white/5 relative">
            {["list", "grid"].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as "list" | "grid")}
                className={`relative p-2 rounded-full transition-colors duration-300 z-10 ${viewMode === mode ? "text-white" : "text-zinc-600 hover:text-zinc-300"
                  }`}
                title={`${mode} View`}
              >
                {viewMode === mode && (
                  <motion.div
                    layoutId="activeView"
                    className="absolute inset-0 bg-zinc-800 rounded-full -z-10"
                    transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                  />
                )}
                {mode === "list" ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Derived filtered/sorted arrays to perfectly handle searches and layout arrangements
  const unapprovedSuggestions = sortBy === "views"
    ? processItems(suggestions.filter(s => !s.is_approved))
    : processItems(suggestions.filter(s => !s.is_approved)).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const approvedSuggestions = sortBy === "views"
    ? processItems(suggestions.filter(s => s.is_approved))
    : processItems(suggestions.filter(s => s.is_approved)).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const filteredBookmarks = processItems(bookmarks);

  return (
    <div className="min-h-screen bg-black text-zinc-100 antialiased selection:bg-white/30 pb-24">
      {/* Premium Floating Navigation Island */}
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
        <nav className="bg-zinc-900/60 backdrop-blur-2xl border border-white/5 rounded-full px-6 py-3 flex items-center justify-between w-full max-w-3xl shadow-2xl pointer-events-auto">
          <h1 onClick={handleAdminUnlock} className="text-sm font-bold tracking-wide text-white cursor-pointer select-none flex items-center gap-3 hover:opacity-70 transition-opacity">
            🎧 Podcast Hub {isAdmin && <span className="text-[9px] border border-white/20 text-zinc-300 px-2 py-0.5 rounded-full uppercase tracking-widest">Admin</span>}
          </h1>
          <div className="flex gap-1 bg-black/50 p-1 rounded-full border border-white/5 relative">
            {["library", "suggestions"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-5 py-2 text-xs font-medium rounded-full transition-colors duration-300 z-10 ${activeTab === tab ? "text-black" : "text-zinc-400 hover:text-white"
                  }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white rounded-full -z-10"
                    transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                  />
                )}
                <span className="capitalize">{tab}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      <main className="max-w-5xl mx-auto px-6 space-y-16 pt-36">
        {activeTab === "library" ? (
          <>
            {isAdmin && (
              <div className="bg-zinc-900/30 border border-white/5 p-8 rounded-[2rem] shadow-2xl">
                <form onSubmit={handleScrape} className="flex gap-4">
                  <input type="url" required placeholder="Paste media URL to parse..." value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1 px-6 py-4 text-sm bg-black border border-white/10 rounded-full focus:border-white/30 text-white placeholder-zinc-600 focus:outline-none transition-all" />
                  <button type="submit" disabled={loading} className="bg-white text-black px-8 py-4 rounded-full font-bold text-sm hover:bg-zinc-200 active:scale-95 disabled:opacity-50 transition-all flex-shrink-0">
                    {loading ? "Parsing..." : "Ingest"}
                  </button>
                </form>

                {preview && (
                  <div className="mt-6 p-4 border border-white/10 bg-black rounded-[1.5rem] flex items-center justify-between gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center gap-4 min-w-0">
                      {preview.thumbnail_url && <img src={preview.thumbnail_url} alt="Cover" className="w-12 h-12 object-cover rounded-full border border-white/10" />}
                      <h3 className="font-semibold text-sm text-white line-clamp-1">{preview.episode_title}</h3>
                    </div>
                    <button onClick={handleSave} className="bg-white text-black px-6 py-2.5 rounded-full text-xs font-bold hover:bg-zinc-200 transition-all whitespace-nowrap">Commit</button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-8">
              {renderLayoutToolbar("My Library", filteredBookmarks.length)}

              {filteredBookmarks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/10 rounded-[2rem]">
                  <span className="text-zinc-600 font-medium tracking-widest text-xs uppercase">No records found</span>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={filteredBookmarks} strategy={viewMode === "list" ? verticalListSortingStrategy : rectSortingStrategy}>
                    <motion.div layout className={viewMode === "list" ? "grid grid-cols-1 gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-8"}>
                      <AnimatePresence mode="popLayout">
                        {filteredBookmarks.map((bookmark) => (
                          <SortableBookmarkItem
                            key={bookmark.id}
                            bookmark={bookmark}
                            handleDelete={handleDelete}
                            handleSaveNotes={handleSaveNotes}
                            isAdmin={isAdmin}
                            viewMode={viewMode}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-16">
            <div className="bg-zinc-900/30 border border-white/5 p-8 rounded-[2rem] shadow-2xl">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white tracking-tight">Any suggestions?</h2>
                <p className="text-zinc-500 text-sm mt-1">Share with us your favourite Podcasts or Media links.</p>
              </div>
              <form onSubmit={handleSubmitSuggestion} className="flex gap-4">
                <input type="url" required placeholder="https://..." value={suggestionUrl} onChange={(e) => setSuggestionUrl(e.target.value)} className="flex-1 px-6 py-4 text-sm bg-black border border-white/10 rounded-full focus:border-white/30 text-white placeholder-zinc-600 focus:outline-none transition-all" />
                <button type="submit" disabled={suggestionLoading} className="bg-white text-black px-8 py-4 rounded-full font-bold text-sm hover:bg-zinc-200 disabled:opacity-50 transition-all">
                  {suggestionLoading ? "Processing..." : "Submit"}
                </button>
              </form>
            </div>

            <div className="space-y-16 w-full">
              {/* AUDIT PIPELINE */}
              {isAdmin && (
                <div className="space-y-8">
                  {renderLayoutToolbar("Audit Pipeline", unapprovedSuggestions.length)}
                  {unapprovedSuggestions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/5 rounded-[2rem]">
                      <span className="text-zinc-600 font-medium tracking-widest text-xs uppercase">Queue Empty</span>
                    </div>
                  ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleSuggestionDragEnd(e, "unapproved")}>
                      <SortableContext items={unapprovedSuggestions} strategy={viewMode === "list" ? verticalListSortingStrategy : rectSortingStrategy}>
                        <div className={viewMode === "list" ? "grid grid-cols-1 gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-8"}>
                          {unapprovedSuggestions.map((suggestion) => (
                            <SortableSuggestionItem
                              key={suggestion.id}
                              suggestion={suggestion}
                              isAdmin={isAdmin}
                              viewMode={viewMode}
                              onApprove={handleApproveSuggestion}
                              onReject={handleRejectSuggestion}
                              onMoveToLibrary={handleMoveToLibrary}
                              handleSaveNotes={handleSaveSuggestionNotes}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              )}

              {/* APPROVED LOG */}
              <div className="space-y-8">
                {renderLayoutToolbar("Approved Log", approvedSuggestions.length)}
                {approvedSuggestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/5 rounded-[2rem]">
                    <span className="text-zinc-600 font-medium tracking-widest text-xs uppercase">No Approvals Yet</span>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleSuggestionDragEnd(e, "approved")}>
                    <SortableContext items={approvedSuggestions} strategy={viewMode === "list" ? verticalListSortingStrategy : rectSortingStrategy}>
                      <div className={viewMode === "list" ? "grid grid-cols-1 gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-8"}>
                        {approvedSuggestions.map((suggestion) => (
                          <SortableSuggestionItem
                            key={suggestion.id}
                            suggestion={suggestion}
                            isAdmin={isAdmin}
                            viewMode={viewMode}
                            onApprove={handleApproveSuggestion}
                            onReject={handleRejectSuggestion}
                            onMoveToLibrary={handleMoveToLibrary}
                            handleSaveNotes={handleSaveSuggestionNotes}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}