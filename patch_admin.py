import re

with open('app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update SortableSuggestionItem signature
content = content.replace(
    'function SortableSuggestionItem({ suggestion, isAdmin, viewMode, onApprove, onReject, onMoveToLibrary, handleSaveNotes, onLinkClick }: any)',
    'function SortableSuggestionItem({ suggestion, isAdmin, viewMode, onMoveToPodcast, onMoveToQuran, onReject, handleSaveNotes, onLinkClick }: any)'
)

# 2. Update Grid actions
grid_old = """            {!suggestion.is_approved ? (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onApprove(suggestion.id)} className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold transition-colors hover:bg-zinc-200">Approve</motion.button>
            ) : (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onMoveToLibrary(suggestion)} className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold transition-colors hover:bg-zinc-200">Deploy</motion.button>
            )}"""
grid_new = """            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onMoveToPodcast(suggestion)} className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold transition-colors hover:bg-zinc-200">🎙️ To Podcast</motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onMoveToQuran(suggestion)} className="px-5 py-2.5 rounded-full bg-emerald-500 text-white text-xs font-bold transition-colors hover:bg-emerald-600">📖 To Quran</motion.button>"""
content = content.replace(grid_old, grid_new)

# 3. Update List actions
list_old = """        {isAdmin && isList && !suggestion.is_approved && (
          <div className="mt-8 flex gap-3">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onApprove(suggestion.id)} className="bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full text-xs font-bold transition-colors">Approve Submission</motion.button>
          </div>
        )}"""
list_new = """        {isAdmin && isList && (
          <div className="mt-8 flex gap-3">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onMoveToPodcast(suggestion)} className="bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full text-xs font-bold transition-colors">🎙️ To Podcast</motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onMoveToQuran(suggestion)} className="bg-emerald-500 text-white hover:bg-emerald-600 px-6 py-2.5 rounded-full text-xs font-bold transition-colors">📖 To Quran</motion.button>
          </div>
        )}"""
content = content.replace(list_old, list_new)

# 4. Remove AddSheet type buttons
add_sheet_old = """        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none pb-1">
          {[{ k: 'podcast', l: 'Podcast' }, { k: 'quran', l: 'Quran' }, { k: 'suggestion', l: 'Suggestion' }].map(t => (
            <button
              key={t.k}
              onClick={() => setType(t.k)}
              className={`px-4 py-2 rounded-full border text-xs font-medium cursor-pointer whitespace-nowrap transition-all ${type === t.k ? 'bg-white text-black border-transparent font-bold' : 'border-white/10 text-zinc-400 hover:bg-zinc-800'}`}
            >
              {t.l}
            </button>
          ))}
        </div>"""
content = content.replace(add_sheet_old, "")

# 5. AddSheet hardcode 'suggestion' in handleSave
save_old = """  const handleSave = async () => {
    if (!url.trim()) { toast.error("Paste a URL first!"); return; }
    setLoading(true);
    await onIngest(url, type);
    setLoading(false);
    onClose();
  };"""
save_new = """  const handleSave = async () => {
    if (!url.trim()) { toast.error("Paste a URL first!"); return; }
    setLoading(true);
    await onIngest(url, 'suggestion');
    setLoading(false);
    onClose();
  };"""
content = content.replace(save_old, save_new)

# 6. Handlers in Home
handler_old = """  const handleMoveToLibrary = async (suggestion: any) => {
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
      hub_clicks: suggestion.hub_clicks || 0,
      sort_order: minSortOrder - 1
    }]).select();

    if (data) {
      setBookmarks([data[0], ...bookmarks]);
      handleRejectSuggestion(suggestion.id);
    }
  };"""
handler_new = """  const handleMoveToPodcast = async (suggestion: any) => {
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
      hub_clicks: suggestion.hub_clicks || 0,
      sort_order: minSortOrder - 1
    }]).select();

    if (data) {
      setBookmarks([data[0], ...bookmarks]);
      handleRejectSuggestion(suggestion.id);
    }
  };

  const handleMoveToQuran = async (suggestion: any) => {
    const minSortOrder = qurans.length > 0 ? Math.min(...qurans.map(q => q.sort_order ?? 0)) : 0;
    const { data } = await supabase.from("quran").insert([{
      url: suggestion.url,
      podcast_name: suggestion.podcast_name,
      episode_title: suggestion.episode_title,
      platform: suggestion.platform,
      description: suggestion.description,
      thumbnail_url: suggestion.thumbnail_url,
      publish_date: suggestion.publish_date,
      view_count: suggestion.view_count,
      hub_clicks: suggestion.hub_clicks || 0,
      sort_order: minSortOrder - 1,
      is_approved: true
    }]).select();

    if (data) {
      setQurans([data[0], ...qurans]);
      handleRejectSuggestion(suggestion.id);
    }
  };"""
content = content.replace(handler_old, handler_new)

# 7. Admin Tab Rendering Update
admin_old = """        {/* ==================== ADMIN TAB ==================== */}
        {tab === "admin" && isAdmin && (
          <div className="space-y-16">
            {/* Suggestion Pipeline */}
            <div className="space-y-8">
              <LayoutToolbar title="Suggestion Pipeline" count={unapprovedSuggestions.length} searchQuery={searchQuery} setSearchQuery={setSearchQuery} sortBy={sortBy} setSortBy={setSortBy} viewMode={viewMode} setViewMode={setViewMode} isAdmin={isAdmin} />
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
                          onLinkClick={handleLinkClick}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Approved Suggestions */}
            <div className="space-y-8">
              <LayoutToolbar title="Approved Suggestions" count={approvedSuggestions.length} searchQuery={searchQuery} setSearchQuery={setSearchQuery} sortBy={sortBy} setSortBy={setSortBy} viewMode={viewMode} setViewMode={setViewMode} isAdmin={isAdmin} />
              {approvedSuggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/5 rounded-[2rem]">
                  <span className="text-zinc-600 font-medium tracking-widest text-xs uppercase">None approved</span>
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
                          onLinkClick={handleLinkClick}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Quran Pipeline */}
            <div className="space-y-8">
              <LayoutToolbar title="Quran Pipeline" count={unapprovedQurans.length} searchQuery={searchQuery} setSearchQuery={setSearchQuery} sortBy={sortBy} setSortBy={setSortBy} viewMode={viewMode} setViewMode={setViewMode} isAdmin={isAdmin} />
              {unapprovedQurans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/5 rounded-[2rem]">
                  <span className="text-zinc-600 font-medium tracking-widest text-xs uppercase">Queue Empty</span>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleQuranDragEnd(e, "unapproved")}>
                  <SortableContext items={unapprovedQurans} strategy={viewMode === "list" ? verticalListSortingStrategy : rectSortingStrategy}>
                    <div className={viewMode === "list" ? "grid grid-cols-1 gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-8"}>
                      {unapprovedQurans.map((q) => (
                        <SortableSuggestionItem
                          key={q.id}
                          suggestion={q}
                          isAdmin={isAdmin}
                          viewMode={viewMode}
                          onApprove={handleApproveQuran}
                          onReject={handleRejectQuran}
                          onMoveToLibrary={() => { }}
                          handleSaveNotes={handleSaveQuranNotes}
                          onLinkClick={handleLinkClick}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Approved Qurans */}
            <div className="space-y-8">
              <LayoutToolbar title="Approved Quran" count={approvedQurans.length} searchQuery={searchQuery} setSearchQuery={setSearchQuery} sortBy={sortBy} setSortBy={setSortBy} viewMode={viewMode} setViewMode={setViewMode} isAdmin={isAdmin} />
              {approvedQurans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/5 rounded-[2rem]">
                  <span className="text-zinc-600 font-medium tracking-widest text-xs uppercase">None approved</span>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleQuranDragEnd(e, "approved")}>
                  <SortableContext items={approvedQurans} strategy={viewMode === "list" ? verticalListSortingStrategy : rectSortingStrategy}>
                    <div className={viewMode === "list" ? "grid grid-cols-1 gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-8"}>
                      {approvedQurans.map((q) => (
                        <SortableSuggestionItem
                          key={q.id}
                          suggestion={q}
                          isAdmin={isAdmin}
                          viewMode={viewMode}
                          onApprove={handleApproveQuran}
                          onReject={handleRejectQuran}
                          onMoveToLibrary={() => { }}
                          handleSaveNotes={handleSaveQuranNotes}
                          onLinkClick={handleLinkClick}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        )}"""

admin_new = """        {/* ==================== ADMIN TAB ==================== */}
        {tab === "admin" && isAdmin && (
          <div className="space-y-16">
            <div className="space-y-8">
              <LayoutToolbar title="Link Inbox" count={suggestions.length} searchQuery={searchQuery} setSearchQuery={setSearchQuery} sortBy={sortBy} setSortBy={setSortBy} viewMode={viewMode} setViewMode={setViewMode} isAdmin={isAdmin} />
              {suggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/5 rounded-[2rem]">
                  <span className="text-zinc-600 font-medium tracking-widest text-xs uppercase">Queue Empty</span>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleSuggestionDragEnd(e, "unapproved")}>
                  <SortableContext items={suggestions} strategy={viewMode === "list" ? verticalListSortingStrategy : rectSortingStrategy}>
                    <div className={viewMode === "list" ? "grid grid-cols-1 gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-8"}>
                      {suggestions.map((suggestion) => (
                        <SortableSuggestionItem
                          key={suggestion.id}
                          suggestion={suggestion}
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
        )}"""

content = content.replace(admin_old, admin_new)

with open('app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
