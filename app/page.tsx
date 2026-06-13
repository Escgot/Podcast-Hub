"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- HELPER STRINGS ---
const GREETING = (() => {
  const h = new Date().getHours();
  if (h < 5) return 'Good Night';
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
})();
const DATE_STR = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

// --- SVG ICONS ---
const PlusIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;

// ============================================================================
// SUB-COMPONENT: Ultra-Premium Library Card (ORIGINAL DESIGN RESTORED)
// ============================================================================
function SortableBookmarkItem({ bookmark, handleDelete, handleSaveNotes, isAdmin, viewMode, onLinkClick }: any) {
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
    toast.success("Link copied to clipboard!");
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
              {isAdmin && bookmark.hub_clicks > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-zinc-700 flex-shrink-0" />
                  <span className="text-zinc-400">
                    {bookmark.hub_clicks} Hub Clicks
                  </span>
                </>
              )}
            </div>

            <h3 className="text-xl font-semibold text-zinc-100 tracking-tight leading-snug">
              <a href={bookmark.url} onClick={(e) => onLinkClick(e, bookmark)} target="_blank" rel="noreferrer" className="hover:text-white transition-colors line-clamp-2 cursor-pointer">
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

// ============================================================================
// SUB-COMPONENT: Ultra-Premium Sortable Suggestion Card (ORIGINAL DESIGN)
// ============================================================================
function SortableSuggestionItem({ suggestion, isAdmin, viewMode, onMoveToPodcast, onMoveToQuran, onReject, handleSaveNotes, onLinkClick }: any) {
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
    toast.success("Link copied to clipboard!");
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
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onMoveToPodcast(suggestion)} className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold transition-colors hover:bg-zinc-200">To Podcast</motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onMoveToQuran(suggestion)} className="px-5 py-2.5 rounded-full bg-emerald-500 text-white text-xs font-bold transition-colors hover:bg-emerald-600">To Quran</motion.button>
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
              {isAdmin && suggestion.hub_clicks > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-zinc-700 flex-shrink-0" />
                  <span className="text-zinc-400">
                    {suggestion.hub_clicks} Hub Clicks
                  </span>
                </>
              )}
            </div>

            <h3 className="text-xl font-semibold text-zinc-100 tracking-tight leading-snug">
              <a href={suggestion.url} onClick={(e) => onLinkClick(e, suggestion)} target="_blank" rel="noreferrer" className="hover:text-white transition-colors line-clamp-2 cursor-pointer">
                {suggestion.episode_title}
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
                <button onClick={() => onReject(suggestion.id)} className="p-2.5 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {isAdmin && isList && (
          <div className="mt-8 flex gap-3">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onMoveToPodcast(suggestion)} className="bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full text-xs font-bold transition-colors">To Podcast</motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onMoveToQuran(suggestion)} className="bg-emerald-500 text-white hover:bg-emerald-600 px-6 py-2.5 rounded-full text-xs font-bold transition-colors">To Quran</motion.button>
          </div>
        )}

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

// ============================================================================
// HERO CARDS for Home Screen
// ============================================================================
const HeroCard = ({ item, title, accent }: { item: any, title: string, accent: string }) => {
  if (!item) return null;
  return (
    <motion.div whileHover={{ y: -3, scale: 1.01 }} transition={{ duration: 0.3 }} className="group relative rounded-[2rem] overflow-hidden border border-white/5 cursor-pointer" onClick={() => window.open(item.url, "_blank")}>
      <div className="relative aspect-video bg-black">
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt="Cover" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
            <span className="text-zinc-600 tracking-widest uppercase text-xs">No Artwork</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <div className={`text-[10px] font-bold tracking-[0.15em] uppercase mb-2 ${accent}`}>
            {title}
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-white leading-snug line-clamp-2 mb-1">{item.episode_title}</h3>
          <p className="text-xs text-zinc-400">{item.podcast_name || item.platform}</p>
        </div>
        <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
          <svg width="14" height="15" viewBox="0 0 12 13" fill="white" className="ml-0.5"><path d="M1 1l10 5.5L1 12V1z" /></svg>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// ADD SHEET (MODAL)
// ============================================================================
const AddSheet = ({ onClose, onIngest }: any) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('podcast');

  const handleSave = async () => {
    if (!url.trim()) { toast.error("Paste a URL first!"); return; }
    setLoading(true);
    await onIngest(url, 'suggestion');
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-4" onClick={onClose}>
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 50, opacity: 0, scale: 0.95 }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        onClick={e => e.stopPropagation()}
        className="bg-zinc-950 rounded-[2rem] p-6 sm:p-8 border border-white/5 w-full max-w-md shadow-2xl"
      >
        <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6 sm:hidden" />
        <h2 className="text-2xl font-bold text-zinc-100 mb-6">Save Link</h2>

        <div className="relative mb-5">
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
            placeholder="Paste a YouTube or media URL..."
            autoFocus
            className="w-full p-4 bg-black/40 border border-white/10 rounded-full text-sm text-zinc-100 outline-none focus:border-white/30 transition-colors placeholder:text-zinc-600"
          />
        </div>



        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
          onClick={handleSave} disabled={loading}
          className="w-full p-4 rounded-full border-none cursor-pointer text-sm font-bold text-black bg-white hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Save to Library'}
        </motion.button>
      </motion.div>
    </div>
  );
};

// ============================================================================
// RESPONSIVE NAVIGATION
// ============================================================================
const Navigation = ({ tab, setTab, onAdd, isAdmin }: any) => {
  const items = [
    { k: 'home', l: 'Home', i: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
    { k: 'podcasts', l: 'Podcasts', i: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg> },
    { k: 'quran', l: 'Quran', i: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> },
  ];
  if (isAdmin) items.push({ k: 'admin', l: 'Admin', i: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> });

  return (
    <>
      {/* MOBILE BOTTOM NAV */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 flex justify-around items-center pt-2 pb-6 z-50 px-2">
        {items.map(({ k, l, i }, idx) => (
          <div key={k} className="flex items-center">
            {idx === Math.floor(items.length / 2) && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onAdd}
                className="w-12 h-12 rounded-full bg-white text-black border-none flex items-center justify-center shadow-lg shadow-white/10 mx-4"
              >
                <PlusIcon />
              </motion.button>
            )}
            <button
              onClick={() => setTab(k)}
              className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${tab === k ? 'text-white' : 'text-zinc-500'}`}
            >
              {i}
              <span className={`text-[10px] ${tab === k ? 'font-bold' : 'font-medium'}`}>{l}</span>
            </button>
          </div>
        ))}
      </nav>

      {/* DESKTOP TOP ISLAND NAV */}
      <div className="hidden sm:flex fixed top-6 left-0 right-0 z-50 justify-center px-6 pointer-events-none">
        <nav className="bg-zinc-900/60 backdrop-blur-2xl border border-white/5 rounded-full px-6 py-3 flex items-center gap-0 shadow-2xl pointer-events-auto">
          <h1 onClick={() => setTab('home')} className="text-sm font-bold tracking-wide text-white cursor-pointer select-none flex items-center gap-3 hover:opacity-70 transition-opacity mr-6">
            🎧 Podcast Hub {isAdmin && <span className="text-[9px] border border-white/20 text-zinc-300 px-2 py-0.5 rounded-full uppercase tracking-widest">Admin</span>}
          </h1>
          <div className="flex gap-1 bg-black/50 p-1 rounded-full border border-white/5 relative">
            {items.map(({ k, l }) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`relative px-5 py-2 text-xs font-medium rounded-full transition-colors duration-300 z-10 ${tab === k ? "text-black" : "text-zinc-400 hover:text-white"}`}
              >
                {tab === k && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white rounded-full -z-10"
                    transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                  />
                )}
                <span className="capitalize">{l}</span>
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-zinc-800 mx-4" />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAdd}
            className="flex items-center gap-2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold transition-colors hover:bg-zinc-200"
          >
            <PlusIcon /> Add
          </motion.button>
        </nav>
      </div>
    </>
  );
};

// ============================================================================
// LAYOUT TOOLBAR (search + sort + view toggle)
// ============================================================================
const LayoutToolbar = ({ title, count, searchQuery, setSearchQuery, sortBy, setSortBy, viewMode, setViewMode, isAdmin }: any) => (
  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-6">
    <div className="space-y-1">
      <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
      <p className="text-sm text-zinc-500 font-medium">{count} items matched</p>
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

      <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2">
        <div className="flex bg-black p-1 rounded-full border border-white/5 relative">
          {[
            { id: "default", label: "Default Sort" },
            { id: "views", label: "Most Viewed" },
            ...(isAdmin ? [{ id: "clicked", label: "Most Clicked" }] : [])
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setSortBy(option.id)}
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
              onClick={() => setViewMode(mode)}
              className={`relative p-2 rounded-full transition-colors duration-300 z-10 ${viewMode === mode ? "text-white" : "text-zinc-600 hover:text-zinc-300"}`}
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


// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
export default function Home() {
  const [tab, setTab] = useState("home");

  const [showAdd, setShowAdd] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastOpenedId, setLastOpenedId] = useState<string | null>(null);
  const [currentHour, setCurrentHour] = useState(Math.floor(Date.now() / (1000 * 60 * 60)));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tab]);

  useEffect(() => {
    const saved = localStorage.getItem('lastOpenedId');
    if (saved) setLastOpenedId(saved);
    
    const interval = setInterval(() => {
      setCurrentHour(Math.floor(Date.now() / (1000 * 60 * 60)));
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);
  const [sortBy, setSortBy] = useState<"default" | "views" | "clicked">("default");

  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [qurans, setQurans] = useState<any[]>([]);

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState("");

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    fetchBookmarks();
    fetchSuggestions();
    fetchQurans();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookmarks' }, (payload) => {
        setBookmarks((prev) => {
          let next = [...prev];
          if (payload.eventType === 'INSERT') {
            if (!next.some(b => b.id === payload.new.id)) next = [payload.new, ...next];
          } else if (payload.eventType === 'UPDATE') {
            next = next.map(b => b.id === payload.new.id ? payload.new : b);
          } else if (payload.eventType === 'DELETE') {
            next = next.filter(b => b.id !== payload.old.id);
          }
          return next.sort((a, b) => {
            if (a.sort_order === b.sort_order) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            return (a.sort_order || 0) - (b.sort_order || 0);
          });
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suggestions' }, (payload) => {
        setSuggestions((prev) => {
          let next = [...prev];
          if (payload.eventType === 'INSERT') {
            if (!next.some(s => s.id === payload.new.id)) next = [payload.new, ...next];
          } else if (payload.eventType === 'UPDATE') {
            next = next.map(s => s.id === payload.new.id ? payload.new : s);
          } else if (payload.eventType === 'DELETE') {
            next = next.filter(s => s.id !== payload.old.id);
          }
          return next.sort((a, b) => {
            if (a.sort_order === b.sort_order) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            return (a.sort_order || 0) - (b.sort_order || 0);
          });
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quran' }, (payload) => {
        setQurans((prev) => {
          let next = [...prev];
          if (payload.eventType === 'INSERT') {
            if (!next.some(q => q.id === payload.new.id)) next = [payload.new, ...next];
          } else if (payload.eventType === 'UPDATE') {
            next = next.map(q => q.id === payload.new.id ? payload.new : q);
          } else if (payload.eventType === 'DELETE') {
            next = next.filter(q => q.id !== payload.old.id);
          }
          return next.sort((a, b) => {
            if (a.sort_order === b.sort_order) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            return (a.sort_order || 0) - (b.sort_order || 0);
          });
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchBookmarks = async () => {
    const { data } = await supabase.from("bookmarks").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
    if (data) setBookmarks(data);
  };
  const fetchSuggestions = async () => {
    const { data } = await supabase.from("suggestions").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
    if (data) setSuggestions(data);
  };
  const fetchQurans = async () => {
    const { data } = await supabase.from("quran").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
    if (data) setQurans(data);
  };

  const handleAdminUnlock = () => {
    if (isAdmin) { setIsAdmin(false); toast("Admin mode locked"); setTab('home'); return; }
    setIsAdminModalOpen(true);
  };

  const submitAdminPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPasscode = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || "7412";
    if (adminPasscode === correctPasscode) {
      setIsAdmin(true);
      setIsAdminModalOpen(false);
      setAdminPasscode("");
      toast.success("Admin unlocked");
      setTab('admin');
    } else {
      toast.error("Incorrect passcode.");
      setAdminPasscode("");
    }
  };

  // Filter and Sort Processing Engine
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
    } else if (sortBy === "clicked") {
      filtered = [...filtered].sort((a, b) => {
        const clicksA = a.hub_clicks || 0;
        const clicksB = b.hub_clicks || 0;
        return clicksB - clicksA;
      });
    }
    return filtered;
  };

  // Interaction Handlers
  const handleLinkClick = async (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    window.open(item.url, "_blank");

    const newClicks = (item.hub_clicks || 0) + 1;
    let table = "bookmarks";
    if (tab === "admin") {
      table = "suggestions";
    }
    if (tab === "quran") {
      table = "quran";
    }

    if (table === "suggestions") {
      setSuggestions(prev => prev.map(s => s.id === item.id ? { ...s, hub_clicks: newClicks } : s));
    } else if (table === "quran") {
      setQurans(prev => prev.map(q => q.id === item.id ? { ...q, hub_clicks: newClicks } : q));
    } else {
      setBookmarks(prev => prev.map(b => b.id === item.id ? { ...b, hub_clicks: newClicks } : b));
      setLastOpenedId(item.id);
      localStorage.setItem('lastOpenedId', item.id);
    }

    await supabase.from(table).update({ hub_clicks: newClicks }).eq("id", item.id);
  };

  // --- LIBRARY FUNCTIONS ---
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
  const handleRejectSuggestion = async (id: string) => {
    await supabase.from("suggestions").delete().eq("id", id);
    setSuggestions(suggestions.filter(s => s.id !== id));
  };

  const handleSaveSuggestionNotes = async (id: string, notes: string) => {
    await supabase.from("suggestions").update({ notes }).eq("id", id);
    setSuggestions(suggestions.map(s => s.id === id ? { ...s, notes } : s));
  };

  const handleSuggestionDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSuggestions((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const newArray = arrayMove(items, oldIndex, newIndex);
      newArray.forEach((item, index) => {
        supabase.from("suggestions").update({ sort_order: index }).eq("id", item.id).then();
      });
      return newArray;
    });
  };

  const handleMoveToPodcast = async (item: any) => {
    const minSortOrder = bookmarks.length > 0 ? Math.min(...bookmarks.map(b => b.sort_order ?? 0)) : 0;
    const { data } = await supabase.from("bookmarks").insert([{
      url: item.url,
      podcast_name: item.podcast_name,
      episode_title: item.episode_title,
      platform: item.platform,
      description: item.description,
      thumbnail_url: item.thumbnail_url,
      publish_date: item.publish_date,
      view_count: item.view_count,
      hub_clicks: item.hub_clicks || 0,
      sort_order: minSortOrder - 1
    }]).select();

    if (data) {
      setBookmarks([data[0], ...bookmarks]);
      handleRejectSuggestion(item.id);
    }
  };

  const handleMoveToQuran = async (item: any) => {
    const minSortOrder = qurans.length > 0 ? Math.min(...qurans.map(q => q.sort_order ?? 0)) : 0;
    const { data } = await supabase.from("quran").insert([{
      url: item.url,
      podcast_name: item.podcast_name,
      episode_title: item.episode_title,
      platform: item.platform,
      description: item.description,
      thumbnail_url: item.thumbnail_url,
      publish_date: item.publish_date,
      view_count: item.view_count,
      hub_clicks: item.hub_clicks || 0,
      sort_order: minSortOrder - 1,
      is_approved: true
    }]).select();

    if (data) {
      setQurans([data[0], ...qurans]);
      handleRejectSuggestion(item.id);
    }
  };



  // --- QURAN FUNCTIONS ---
  const handleApproveQuran = async (id: string) => {
    await supabase.from("quran").update({ is_approved: true }).eq("id", id);
    setQurans(qurans.map(q => q.id === id ? { ...q, is_approved: true } : q));
  };

  const handleRejectQuran = async (id: string) => {
    await supabase.from("quran").delete().eq("id", id);
    setQurans(qurans.filter(q => q.id !== id));
  };

  const handleSaveQuranNotes = async (id: string, notes: string) => {
    await supabase.from("quran").update({ notes }).eq("id", id);
    setQurans(qurans.map(q => q.id === id ? { ...q, notes } : q));
  };

  const handleQuranDragEnd = (event: any, listType: "approved" | "unapproved") => {
    const { active, over } = event;
    if (active && over && active.id !== over.id && isAdmin) {
      setQurans((allItems) => {
        const isAppr = listType === "approved";
        const targetList = allItems.filter(q => q.is_approved === isAppr);
        const otherList = allItems.filter(q => q.is_approved !== isAppr);
        const oldIndex = targetList.findIndex(item => item.id === active.id);
        const newIndex = targetList.findIndex(item => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return allItems;
        const reorderedList = arrayMove(targetList, oldIndex, newIndex);
        const updatedReorderedList = reorderedList.map((item, index) => {
          supabase.from("quran").update({ sort_order: index }).eq("id", item.id).then();
          return { ...item, sort_order: index };
        });
        return [...updatedReorderedList, ...otherList];
      });
    }
  };

  // --- INGEST HANDLER (AddSheet) ---
  const handleIngest = async (url: string, type: string) => {
    try {
      const res = await fetch("/api/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const preview = await res.json();
      if (!res.ok) throw new Error(preview.error || "Scrape failed");

      const minSortOrder = suggestions.length > 0 ? Math.min(...suggestions.map(s => s.sort_order ?? 0)) : 0;

      const payload: any = {
        url: preview.url,
        podcast_name: preview.author || preview.platform,
        episode_title: preview.episode_title,
        platform: preview.platform,
        description: preview.description,
        thumbnail_url: preview.thumbnail_url,
        publish_date: preview.publish_date,
        view_count: preview.view_count,
        hub_clicks: 0,
        sort_order: minSortOrder - 1,
        is_approved: false
      };

      const { error } = await supabase.from("suggestions").insert([payload]);
      if (error) throw error;
      toast.success("Link added to Inbox!");
    } catch (err: any) {
      toast.error(err.message || "Failed to process");
    }
  };

  // Derived filtered/sorted arrays
  const filteredBookmarks = processItems(bookmarks);
  
  const inboxItems = sortBy !== "default"
    ? processItems(suggestions)
    : processItems(suggestions).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));



  const unapprovedQurans = sortBy !== "default"
    ? processItems(qurans.filter(q => !q.is_approved))
    : processItems(qurans.filter(q => !q.is_approved)).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const approvedQurans = sortBy !== "default"
    ? processItems(qurans.filter(q => q.is_approved))
    : processItems(qurans.filter(q => q.is_approved)).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  // Home screen items
  const latestPodcast = useMemo(() => {
    if (lastOpenedId) {
      const found = bookmarks.find(x => x.id === lastOpenedId);
      if (found) return found;
    }
    return [...bookmarks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  }, [bookmarks, lastOpenedId]);
  
  const randomQuran = useMemo(() => {
    const approved = qurans.filter(q => q.is_approved);
    if (approved.length === 0) return null;
    
    // Sort array so order is deterministic
    const sorted = [...approved].sort((a, b) => a.id.localeCompare(b.id));
    
    // Pseudo-random index based on the current hour (changes every hour)
    const index = (currentHour * 137) % sorted.length;
    return sorted[index];
  }, [qurans, currentHour]);

  // Combined library items
  const allLibraryItems = [
    ...filteredBookmarks,
    ...(sortBy !== "default" ? processItems(qurans.filter(q => q.is_approved)) : processItems(qurans.filter(q => q.is_approved)).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)))
  ];

  return (
    <div className="min-h-screen bg-black text-zinc-100 antialiased selection:bg-white/30 pb-24 sm:pb-8">
      <Navigation tab={tab} setTab={setTab} onAdd={() => setShowAdd(true)} isAdmin={isAdmin} />

      {/* Admin Passcode Modal */}
      <AnimatePresence>
        {isAdminModalOpen && (
          <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsAdminModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-white/10 rounded-[2rem] p-8 w-full max-w-sm shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-6 text-center">Admin Access</h2>
              <form onSubmit={submitAdminPasscode} className="space-y-4">
                <input
                  type="password"
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  placeholder="Enter passcode..."
                  autoFocus
                  className="w-full px-6 py-4 text-sm bg-black border border-white/10 rounded-full focus:border-white/30 text-white placeholder-zinc-600 focus:outline-none transition-all text-center tracking-[0.3em]"
                />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} type="submit" className="w-full bg-white text-black py-3.5 rounded-full font-bold text-sm transition-colors hover:bg-zinc-200">
                  Unlock
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-5xl mx-auto px-6 space-y-16 pt-8 sm:pt-36">

        {/* ==================== HOME TAB ==================== */}
        {tab === "home" && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <div className="text-xs font-medium text-zinc-500 mb-1 tracking-wider uppercase">{DATE_STR}</div>
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-100 cursor-pointer" onClick={handleAdminUnlock}>
                {GREETING}
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <HeroCard item={latestPodcast} title="Continue Listening" accent="text-indigo-400" />
              <HeroCard item={randomQuran} title="Daily Reflection" accent="text-emerald-400" />
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-baseline">
                <h2 className="text-xl font-bold text-zinc-100">Recently Saved</h2>
                <button onClick={() => setTab('podcasts')} className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors">View all →</button>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {[...bookmarks, ...qurans.filter(q => q.is_approved)].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3).map((item) => (
                  <SortableBookmarkItem
                    key={item.id}
                    bookmark={item}
                    handleDelete={handleDelete}
                    handleSaveNotes={handleSaveNotes}
                    isAdmin={false}
                    viewMode="list"
                    onLinkClick={handleLinkClick}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== PODCASTS TAB ==================== */}
        {tab === "podcasts" && (
          <div className="space-y-8">
            <LayoutToolbar
              title="Your Podcasts"
              count={filteredBookmarks.length}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortBy={sortBy}
              setSortBy={setSortBy}
              viewMode={viewMode}
              setViewMode={setViewMode}
              isAdmin={isAdmin}
            />

            {filteredBookmarks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/10 rounded-[2rem]">
                  <span className="text-zinc-600 font-medium tracking-widest text-xs uppercase">No podcasts found</span>
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
                            onLinkClick={handleLinkClick}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  </SortableContext>
                </DndContext>
              )}
          </div>
        )}

        {/* ==================== QURAN TAB ==================== */}
        {tab === "quran" && (
          <div className="space-y-8">
            <LayoutToolbar
              title="Your Quran Library"
              count={approvedQurans.length}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortBy={sortBy}
              setSortBy={setSortBy}
              viewMode={viewMode}
              setViewMode={setViewMode}
              isAdmin={isAdmin}
            />

            {approvedQurans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/10 rounded-[2rem]">
                  <span className="text-zinc-600 font-medium tracking-widest text-xs uppercase">No Quran videos found</span>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleQuranDragEnd(e, "approved")}>
                  <SortableContext items={approvedQurans} strategy={viewMode === "list" ? verticalListSortingStrategy : rectSortingStrategy}>
                    <motion.div layout className={viewMode === "list" ? "grid grid-cols-1 gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-8"}>
                      <AnimatePresence mode="popLayout">
                        {approvedQurans.map((q) => (
                          <SortableBookmarkItem
                            key={q.id}
                            bookmark={q}
                            handleDelete={handleRejectQuran}
                            handleSaveNotes={handleSaveQuranNotes}
                            isAdmin={isAdmin}
                            viewMode={viewMode}
                            onLinkClick={handleLinkClick}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  </SortableContext>
                </DndContext>
              )}
          </div>
        )}

        {/* ==================== ADMIN TAB ==================== */}
        {tab === "admin" && isAdmin && (
          <div className="space-y-16">
            <div className="space-y-8">
              <LayoutToolbar title="Link Inbox" count={inboxItems.length} searchQuery={searchQuery} setSearchQuery={setSearchQuery} sortBy={sortBy} setSortBy={setSortBy} viewMode={viewMode} setViewMode={setViewMode} isAdmin={isAdmin} />
              {inboxItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/5 rounded-[2rem]">
                  <span className="text-zinc-600 font-medium tracking-widest text-xs uppercase">Queue Empty</span>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSuggestionDragEnd}>
                  <SortableContext items={inboxItems} strategy={viewMode === "list" ? verticalListSortingStrategy : rectSortingStrategy}>
                    <div className={viewMode === "list" ? "grid grid-cols-1 gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-8"}>
                      {inboxItems.map((item) => (
                        <SortableSuggestionItem
                          key={item.id}
                          suggestion={item}
                          isAdmin={isAdmin}
                          viewMode={viewMode}
                          onMoveToPodcast={handleMoveToPodcast}
                          onMoveToQuran={handleMoveToQuran}
                          onReject={handleRejectSuggestion}
                          handleSaveNotes={handleSaveSuggestionNotes}
                          onLinkClick={handleLinkClick}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add Link Sheet */}
      <AnimatePresence>
        {showAdd && <AddSheet onClose={() => setShowAdd(false)} onIngest={handleIngest} />}
      </AnimatePresence>
    </div>
  );
}
