import os

PAGE_TSX = """\"\"\"use client\"\"\";

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

// --- SVGS ---
const PlayIcon = () => <svg width="12" height="13" viewBox="0 0 12 13" fill="white" className="ml-0.5"><path d="M1 1l10 5.5L1 12V1z" /></svg>;
const TrashIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const CopyIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>;
const ChevIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="block shrink-0"><polyline points="9 18 15 12 9 6" /></svg>;
const PlusIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;

// --- SHARED COMPONENTS ---
function SortableItemCard({ item, isAdmin, handleDelete, handleLinkClick, type }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !isAdmin
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms cubic-bezier(0.2, 0, 0, 1)',
    zIndex: isDragging ? 50 : 1,
  };

  const isQuran = type === 'quran';
  const author = item.podcast_name || item.platform || "Unknown";
  const icon = isQuran ? '📖' : '🎙';

  return (
    <div ref={setNodeRef} style={style} className={`w-full transition-transform duration-200 hover:-translate-y-0.5`}>
      <div className={`bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-3.5 relative ${isDragging ? 'shadow-2xl shadow-indigo-500/20 scale-[1.02] bg-zinc-800/80 z-50' : ''}`}>
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-xl overflow-hidden relative bg-zinc-800 border border-zinc-700/50">
             {item.thumbnail_url ? <img src={item.thumbnail_url} className="w-full h-full object-cover" alt="thumbnail" /> : icon}
             {isAdmin && <div {...attributes} {...listeners} className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center cursor-grab text-white"><ChevIcon /></div>}
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={(e) => handleLinkClick(e, item, type)}>
            <div className="text-sm font-semibold text-zinc-100 leading-tight mb-1 truncate">
              {item.episode_title}
            </div>
            <div className="text-[11px] text-zinc-400">
              {author} · {item.view_count ? `${Intl.NumberFormat('en-US', { notation: 'compact' }).format(Number(item.view_count))} views` : ''}
              {isAdmin && item.hub_clicks > 0 && ` · ${item.hub_clicks} clicks`}
            </div>
          </div>
          <button
            className="p-2 shrink-0 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(item.url); toast.success("Link copied!"); }}
          >
            <CopyIcon />
          </button>
          {isAdmin && (
             <button onClick={() => handleDelete(item.id, type)} className="p-2 shrink-0 hover:bg-red-500/20 rounded-full text-red-400 transition-colors">
               <TrashIcon />
             </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SortableSuggestionCard({ item, isAdmin, type, handleApprove, handleReject, handleLinkClick }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !isAdmin
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms cubic-bezier(0.2, 0, 0, 1)',
    zIndex: isDragging ? 50 : 1,
  };

  const isQuran = type === 'quran';
  const icon = isQuran ? '📖' : '🎙';

  return (
    <div ref={setNodeRef} style={style} className={`w-full transition-transform duration-200 hover:-translate-y-0.5`}>
      <div className={`bg-indigo-900/10 backdrop-blur-md border border-indigo-500/20 rounded-2xl p-3.5 relative ${isDragging ? 'shadow-2xl shadow-indigo-500/30 scale-[1.02] bg-indigo-900/30 z-50' : ''}`}>
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-xl overflow-hidden relative bg-zinc-800 border border-indigo-500/30">
             {item.thumbnail_url ? <img src={item.thumbnail_url} className="w-full h-full object-cover" /> : icon}
             {isAdmin && <div {...attributes} {...listeners} className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center cursor-grab text-white"><ChevIcon /></div>}
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={(e) => handleLinkClick(e, item, type)}>
            <div className="text-sm font-semibold text-zinc-100 leading-tight mb-1 truncate">
              {item.episode_title}
            </div>
            <div className="text-[11px] text-zinc-400">
              {item.podcast_name || item.platform}
            </div>
          </div>
          {isAdmin && (
             <div className="flex gap-1 items-center">
               <button onClick={() => handleApprove(item, type)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-medium transition-colors">
                 Approve
               </button>
               <button onClick={() => handleReject(item.id, type)} className="p-2 rounded-full text-red-400 hover:bg-red-500/20 transition-colors">
                 <TrashIcon />
               </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

const HeroCard = ({ item, title, isQuran=false, accent }: { item: any, title: string, isQuran?: boolean, accent: string }) => {
  if (!item) return null;
  return (
    <motion.div whileHover={{ y: -2 }} className={`bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 rounded-[22px] p-5 relative overflow-hidden shadow-lg group`}>
      <div className={`absolute -top-[50px] -right-[50px] w-[200px] h-[200px] rounded-full blur-[60px] opacity-20 pointer-events-none ${accent}`} />
      <div className="flex gap-4 items-start relative z-10">
        <div className="w-16 h-16 rounded-2xl shrink-0 flex items-center justify-center text-2xl overflow-hidden bg-zinc-800 border border-zinc-700/50 shadow-md">
           {item.thumbnail_url ? <img src={item.thumbnail_url} className="w-full h-full object-cover" /> : (isQuran ? '📖' : '🎙')}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="text-[10px] font-bold tracking-[0.15em] uppercase mb-1.5 text-zinc-400 group-hover:text-zinc-300 transition-colors">
            {title}
          </div>
          <div className="text-base font-semibold text-zinc-100 leading-snug mb-1 line-clamp-2">{item.episode_title}</div>
          <div className="text-xs text-zinc-400 line-clamp-1">{item.podcast_name || item.platform}</div>
        </div>
        <div onClick={() => window.open(item.url, "_blank")} className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-white text-black shrink-0 flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95">
          <svg width="14" height="15" viewBox="0 0 12 13" fill="black" className="ml-0.5"><path d="M1 1l10 5.5L1 12V1z" /></svg>
        </div>
      </div>
    </motion.div>
  );
};

// --- ADD SHEET (MODAL) ---
const AddSheet = ({ onClose, onIngest }: any) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('podcast');

  const handleSave = async () => {
    if (!url.trim()) { toast.error("Paste a URL first!"); return; }
    setLoading(true);
    await onIngest(url, type);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-4" onClick={onClose}>
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 50, opacity: 0, scale: 0.95 }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        onClick={e => e.stopPropagation()}
        className="bg-zinc-950 rounded-3xl p-6 sm:p-8 border border-zinc-800 w-full max-w-md shadow-2xl"
      >
        <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6 sm:hidden" />
        <h2 className="text-2xl font-bold text-zinc-100 mb-6">Save Link</h2>

        <div className="relative mb-5">
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Paste a YouTube or media URL..."
            autoFocus
            className="w-full p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none pb-1">
          {[{k:'podcast', l:'🎙 Podcast'}, {k:'quran', l:'📖 Quran'}, {k:'suggestion', l:'💡 Suggestion'}].map(t => (
            <div 
              key={t.k} 
              onClick={() => setType(t.k)}
              className={`px-4 py-2 rounded-full border text-sm cursor-pointer whitespace-nowrap transition-colors ${type === t.k ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-semibold' : 'border-zinc-800 text-zinc-400 hover:bg-zinc-900'}`}
            >
              {t.l}
            </div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={handleSave} disabled={loading}
          className="w-full p-4 rounded-xl border-none cursor-pointer text-sm font-semibold text-zinc-950 bg-zinc-100 hover:bg-white transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Save to Library'}
        </motion.button>
      </motion.div>
    </div>
  );
};


// --- SCREENS ---
const HomeScreen = ({ bookmarks, qurans, onLibrary, onAdminClick }: any) => {
  const latestPodcast = [...bookmarks].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  
  // Random Quran logic
  const randomQuran = useMemo(() => {
    if (!qurans || qurans.length === 0) return null;
    return qurans[Math.floor(Math.random() * qurans.length)];
  }, [qurans]);

  const recent = [...bookmarks, ...qurans].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4);

  return (
    <div className="w-full max-w-2xl mx-auto px-5 pt-8 pb-32 sm:pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <div className="text-xs font-medium text-zinc-500 mb-1 tracking-wider uppercase">{DATE_STR}</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-zinc-100" onClick={onAdminClick}>
          {GREETING}
        </h1>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <HeroCard item={latestPodcast} title="Continue Listening" accent="bg-indigo-500" />
        <HeroCard item={randomQuran} title="Daily Reflection" isQuran={true} accent="bg-emerald-500" />
      </div>

      {recent.length > 0 && (
        <>
          <div className="flex justify-between items-baseline mb-4 mt-8">
            <h2 className="text-xl font-bold text-zinc-100">Recently Saved</h2>
            <button onClick={onLibrary} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              View all
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {recent.map((item) => (
              <SortableItemCard 
                key={item.id} 
                item={item} 
                isAdmin={false} 
                type={item.type || (item.is_approved !== undefined ? 'quran' : 'podcast')} 
                handleLinkClick={(e: any, item: any) => window.open(item.url, "_blank")} 
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const processItems = (items: any[], sortBy: string) => {
  let sorted = [...items];
  if (sortBy === "views") {
    sorted.sort((a, b) => (Number(b.view_count) || 0) - (Number(a.view_count) || 0));
  } else if (sortBy === "clicked") {
    sorted.sort((a, b) => (b.hub_clicks || 0) - (a.hub_clicks || 0));
  } else {
    sorted.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }
  return sorted;
};

const LibraryScreen = ({ bookmarks, qurans, isAdmin, handleDragEnd, handleDelete, handleLinkClick }: any) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  const TABS = [
    { k: 'all', l: 'All' },
    { k: 'podcast', l: '🎙 Podcasts' },
    { k: 'quran', l: '📖 Quran' },
  ];
  
  const allItems = [
    ...bookmarks.map((b:any) => ({...b, _type: 'podcast'})),
    ...qurans.filter((q:any) => q.is_approved).map((q:any) => ({...q, _type: 'quran'}))
  ];

  let filtered = filter === 'all' ? allItems : allItems.filter(x => x._type === filter);
  filtered = processItems(filtered, sortBy);

  return (
    <div className="w-full max-w-2xl mx-auto px-5 pt-8 pb-32 sm:pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="text-xs font-medium text-zinc-500 mb-1">{allItems.length} items saved</div>
          <h1 className="text-3xl font-bold text-zinc-100">Your Library</h1>
        </div>
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
        >
          <option value="default">Custom Sort</option>
          <option value="views">Most Views</option>
          <option value="clicked">Most Clicked</option>
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-5 px-5 mb-6 scrollbar-none">
        {TABS.map(t => (
          <button
            key={t.k}
            onClick={() => setFilter(t.k)}
            className={`px-4 py-2 rounded-full border transition-all text-sm whitespace-nowrap shrink-0 ${filter === t.k ? 'border-transparent bg-zinc-100 text-zinc-950 font-semibold' : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 font-medium hover:bg-zinc-800'}`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 bg-zinc-900/20 rounded-2xl border border-zinc-800/50 dashed">Nothing saved here yet</div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, filter, sortBy)}>
          <SortableContext items={filtered} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {filtered.map((item) => (
                <SortableItemCard 
                  key={item.id} 
                  item={item} 
                  isAdmin={sortBy === 'default' ? isAdmin : false} 
                  handleDelete={handleDelete} 
                  handleLinkClick={handleLinkClick} 
                  type={item._type} 
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

const AdminScreen = ({ suggestions, qurans, handleApprove, handleReject, handleDragEnd, handleLinkClick }: any) => {
  const unapprovedSuggestions = processItems(suggestions.filter((s:any) => !s.is_approved), 'default');
  const unapprovedQurans = processItems(qurans.filter((q:any) => !q.is_approved), 'default');

  return (
    <div className="w-full max-w-2xl mx-auto px-5 pt-8 pb-32 sm:pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold text-zinc-100 mb-8">Review Queue</h1>

      <h2 className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-3">Podcasts ({unapprovedSuggestions.length})</h2>
      {unapprovedSuggestions.length === 0 ? (
         <div className="text-center py-8 text-sm text-zinc-500 bg-zinc-900/30 border border-zinc-800 rounded-2xl mb-8">Queue Empty</div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'suggestions', 'default')}>
          <SortableContext items={unapprovedSuggestions} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3 mb-10">
              {unapprovedSuggestions.map((item:any) => (
                <SortableSuggestionCard key={item.id} item={item} isAdmin={true} type="suggestions" handleApprove={handleApprove} handleReject={handleReject} handleLinkClick={handleLinkClick} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <h2 className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-3">Quran ({unapprovedQurans.length})</h2>
      {unapprovedQurans.length === 0 ? (
         <div className="text-center py-8 text-sm text-zinc-500 bg-zinc-900/30 border border-zinc-800 rounded-2xl">Queue Empty</div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'qurans', 'default')}>
          <SortableContext items={unapprovedQurans} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {unapprovedQurans.map((item:any) => (
                <SortableSuggestionCard key={item.id} item={item} isAdmin={true} type="qurans" handleApprove={handleApprove} handleReject={handleReject} handleLinkClick={handleLinkClick} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};


// --- RESPONSIVE NAVIGATION ---
const Navigation = ({ tab, setTab, onAdd, isAdmin }: any) => {
  const items = [
    { k: 'home', l: 'Home', i: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
    { k: 'library', l: 'Library', i: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> },
  ];
  if (isAdmin) items.push({ k: 'admin', l: 'Admin', i: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> });

  return (
    <>
      {/* MOBILE BOTTOM NAV */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800/60 flex justify-around items-center pt-2 pb-6 z-50 px-2">
        {items.map(({ k, l, i }, idx) => (
          <div key={k} className="flex items-center">
            {idx === 1 && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onAdd}
                className="w-12 h-12 rounded-full bg-indigo-500 text-white border-none flex items-center justify-center shadow-lg shadow-indigo-500/30 mx-4"
              >
                <PlusIcon />
              </motion.button>
            )}
            <button
              onClick={() => setTab(k)}
              className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${tab === k ? 'text-zinc-100' : 'text-zinc-500'}`}
            >
              {i}
              <span className={`text-[10px] ${tab === k ? 'font-bold' : 'font-medium'}`}>{l}</span>
            </button>
          </div>
        ))}
      </nav>

      {/* DESKTOP TOP ISLAND NAV */}
      <div className="hidden sm:flex justify-center pt-8 pb-4 sticky top-0 z-50 pointer-events-none">
        <nav className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-full px-2 py-2 flex items-center gap-2 shadow-2xl pointer-events-auto">
          {items.map(({ k, l, i }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium ${tab === k ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'}`}
            >
              {i} {l}
            </button>
          ))}
          <div className="w-px h-6 bg-zinc-800 mx-2" />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAdd}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20"
          >
            <PlusIcon /> Add Link
          </motion.button>
        </nav>
      </div>
    </>
  );
};


// --- ROOT APP COMPONENT ---
export default function App() {
  const [tab, setTab] = useState('home');
  const [showAdd, setShowAdd] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [qurans, setQurans] = useState<any[]>([]);

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
          return next;
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
          return next;
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
          return next;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchBookmarks = async () => {
    const { data } = await supabase.from("bookmarks").select("*");
    if (data) setBookmarks(data);
  };
  const fetchSuggestions = async () => {
    const { data } = await supabase.from("suggestions").select("*");
    if (data) setSuggestions(data);
  };
  const fetchQurans = async () => {
    const { data } = await supabase.from("quran").select("*");
    if (data) setQurans(data);
  };

  const handleAdminUnlock = () => {
    if (isAdmin) { setIsAdmin(false); toast("Admin mode locked", { icon: "🔒" }); setTab('home'); return; }
    const passcode = window.prompt("Enter Admin Passcode:");
    const correctPasscode = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || "7412";
    if (passcode === correctPasscode) { setIsAdmin(true); toast.success("Admin unlocked"); setTab('admin'); }
    else if (passcode !== null) { toast.error("Incorrect passcode."); }
  };

  const handleIngest = async (url: string, type: string) => {
    try {
      const res = await fetch("/api/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const preview = await res.json();
      if (!res.ok) throw new Error(preview.error || "Scrape failed");

      const table = type === 'podcast' ? 'bookmarks' : (type === 'quran' ? 'quran' : 'suggestions');
      const stateArr = type === 'podcast' ? bookmarks : (type === 'quran' ? qurans : suggestions);
      const minSortOrder = stateArr.length > 0 ? Math.min(...stateArr.map(b => b.sort_order ?? 0)) : 0;
      
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
        sort_order: minSortOrder - 1
      };

      if (type !== 'podcast') payload.is_approved = false;

      const { error } = await supabase.from(table).insert([payload]);
      if (error) throw error;
      toast.success("Saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to process");
    }
  };

  const handleLinkClick = async (e: React.MouseEvent, item: any, type: string) => {
    e.preventDefault();
    window.open(item.url, "_blank");
    const newClicks = (item.hub_clicks || 0) + 1;
    const table = type === 'qurans' || type === 'quran' ? 'quran' : (type === 'suggestions' ? 'suggestions' : 'bookmarks');
    await supabase.from(table).update({ hub_clicks: newClicks }).eq("id", item.id);
  };

  const handleDelete = async (id: string, type: string) => {
    const table = type === 'qurans' || type === 'quran' ? 'quran' : 'bookmarks';
    await supabase.from(table).delete().eq("id", id);
    toast.success("Deleted item");
  };

  const handleApprove = async (item: any, type: string) => {
     if (type === 'suggestions') {
        const minSortOrder = bookmarks.length > 0 ? Math.min(...bookmarks.map(b => b.sort_order ?? 0)) : 0;
        await supabase.from("bookmarks").insert([{ ...item, id: undefined, is_approved: undefined, sort_order: minSortOrder - 1 }]);
        await supabase.from("suggestions").delete().eq("id", item.id);
     } else {
        await supabase.from("quran").update({ is_approved: true }).eq("id", item.id);
     }
     toast.success("Approved!");
  };

  const handleReject = async (id: string, type: string) => {
     await supabase.from(type === 'qurans' ? 'quran' : 'suggestions').delete().eq("id", id);
     toast.success("Rejected!");
  };

  const handleDragEnd = async (event: any, group: string, currentSort: string) => {
    if (currentSort !== 'default') return; // Cannot drag to reorder if sorted by views/clicks
    
    const { active, over } = event;
    if (active && over && active.id !== over.id && isAdmin) {
       let arr = group === 'all' ? bookmarks : (group === 'podcast' ? bookmarks : (group === 'quran' ? qurans : (group === 'qurans' ? qurans : suggestions)));
       const table = group === 'all' || group === 'podcast' ? 'bookmarks' : (group === 'quran' || group === 'qurans' ? 'quran' : 'suggestions');
       
       let targetList = processItems(arr, 'default');
       if (group === 'quran' && tab === 'library') targetList = processItems(qurans.filter(q => q.is_approved), 'default');
       if (group === 'qurans' && tab === 'admin') targetList = processItems(qurans.filter(q => !q.is_approved), 'default');
       if (group === 'suggestions' && tab === 'admin') targetList = processItems(suggestions.filter(s => !s.is_approved), 'default');

       const oldIndex = targetList.findIndex(item => item.id === active.id);
       const newIndex = targetList.findIndex(item => item.id === over.id);
       if (oldIndex === -1 || newIndex === -1) return;

       const reorderedList = arrayMove(targetList, oldIndex, newIndex);
       reorderedList.forEach((item, index) => {
          supabase.from(table).update({ sort_order: index }).eq("id", item.id).then();
       });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative">
      <Navigation tab={tab} setTab={setTab} onAdd={() => setShowAdd(true)} isAdmin={isAdmin} />
      
      <div className="flex-1 w-full">
        {tab === 'home' && <HomeScreen bookmarks={bookmarks} qurans={qurans} onLibrary={() => setTab('library')} onAdminClick={handleAdminUnlock} />}
        {tab === 'library' && <LibraryScreen bookmarks={bookmarks} qurans={qurans} isAdmin={isAdmin} handleDragEnd={handleDragEnd} handleDelete={handleDelete} handleLinkClick={handleLinkClick} />}
        {tab === 'admin' && <AdminScreen suggestions={suggestions} qurans={qurans} handleApprove={handleApprove} handleReject={handleReject} handleDragEnd={handleDragEnd} handleLinkClick={handleLinkClick} />}
      </div>
      
      <AnimatePresence>
         {showAdd && <AddSheet onClose={() => setShowAdd(false)} onIngest={handleIngest} />}
      </AnimatePresence>
    </div>
  );
}
"""

with open('app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(PAGE_TSX.replace('\\"', '"'))
