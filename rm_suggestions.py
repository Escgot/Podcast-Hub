import re

with open('app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove suggestions state
content = re.sub(r'const \[suggestions, setSuggestions\] = useState<any\[\]>\(\[\]\);\n?', '', content)

# 2. Remove suggestions fetch
content = re.sub(r'\s*const \{ data.*?await supabase.from\("suggestions"\).*?;\s*setSuggestions\(.*?\);', '', content)
content = re.sub(r'\s*const \{ data \} = await supabase\.from\("suggestions"\)\.select\("\*"\)\.order\("sort_order", \{ ascending: true \}\)\.order\("created_at", \{ ascending: false \}\);\s*setSuggestions\(data \|\| \[\]\);', '', content)

# 3. Update handleIngest
ingest_old = """  const handleIngest = async (url: string, type: string) => {
    try {
      const res = await fetch("/api/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const preview = await res.json();
      if (!res.ok) throw new Error(preview.error || "Scrape failed");

      const minSortOrder = bookmarks.length > 0 ? Math.min(...bookmarks.map(b => b.sort_order ?? 0)) : 0;

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

      const { error } = await supabase.from("bookmarks").insert([payload]);
      if (error) throw error;
      toast.success("Link added to Inbox!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    }
  };"""

# Wait, handleIngest in the file currently looks like this:
ingest_actual_old = """  const handleIngest = async (url: string, type: string) => {
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
      toast.success("Added to library!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    }
  };"""

if ingest_actual_old in content:
    content = content.replace(ingest_actual_old, ingest_old)
else:
    # try regex approach for ingest
    content = re.sub(r'const handleIngest = async \(url: string, type: string\) => \{[\s\S]*?toast\.error\(error\.message\);\s*\}\s*\};', ingest_old, content)

# 4. Remove unused suggestion handlers
content = re.sub(r'const handleApproveSuggestion[\s\S]*?\}\s*;\n?', '', content)
content = re.sub(r'const handleRejectSuggestion[\s\S]*?\}\s*;\n?', '', content)
content = re.sub(r'const handleSaveSuggestionNotes[\s\S]*?\}\s*;\n?', '', content)
content = re.sub(r'const handleSuggestionDragEnd[\s\S]*?\}\s*;\n?', '', content)

# 5. Add Inbox handlers
inbox_handlers = """  const handleRejectInbox = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  const handleSaveInboxNotes = async (id: string, notes: string) => {
    await supabase.from("bookmarks").update({ notes }).eq("id", id);
    setBookmarks(bookmarks.map(b => b.id === id ? { ...b, notes } : b));
  };

  const handleInboxDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setBookmarks((items) => {
      const inboxOnly = items.filter(b => b.is_approved === false);
      const otherItems = items.filter(b => b.is_approved !== false);

      const oldIndex = inboxOnly.findIndex((i) => i.id === active.id);
      const newIndex = inboxOnly.findIndex((i) => i.id === over.id);
      const newArray = arrayMove(inboxOnly, oldIndex, newIndex);
      
      newArray.forEach((item, index) => {
        supabase.from("bookmarks").update({ sort_order: index }).eq("id", item.id).then();
      });
      return [...otherItems, ...newArray];
    });
  };
"""
# insert before handleMoveToPodcast
content = content.replace('const handleMoveToPodcast', inbox_handlers + '\n  const handleMoveToPodcast')

# 6. Rewrite handleMoveToPodcast and handleMoveToQuran
move_old = """  const handleMoveToPodcast = async (suggestion: any) => {
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

move_new = """  const handleMoveToPodcast = async (item: any) => {
    await supabase.from("bookmarks").update({ is_approved: true }).eq("id", item.id);
    setBookmarks(bookmarks.map(b => b.id === item.id ? { ...b, is_approved: true } : b));
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
      await supabase.from("bookmarks").delete().eq("id", item.id);
      setBookmarks(bookmarks.filter(b => b.id !== item.id));
    }
  };"""
content = content.replace(move_old, move_new)

# 7. Update filteredBookmarks
fbm_old = """  const filteredBookmarks = processItems(bookmarks);"""
fbm_new = """  const activePodcasts = bookmarks.filter(b => b.is_approved !== false);
  const filteredBookmarks = processItems(activePodcasts);
  
  const inboxItems = sortBy !== "default"
    ? processItems(bookmarks.filter(b => b.is_approved === false))
    : processItems(bookmarks.filter(b => b.is_approved === false)).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));"""
content = content.replace(fbm_old, fbm_new)

# 8. Update Admin Tab
admin_old = """        {/* ==================== ADMIN TAB ==================== */}
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
admin_new = """        {/* ==================== ADMIN TAB ==================== */}
        {tab === "admin" && isAdmin && (
          <div className="space-y-16">
            <div className="space-y-8">
              <LayoutToolbar title="Link Inbox" count={inboxItems.length} searchQuery={searchQuery} setSearchQuery={setSearchQuery} sortBy={sortBy} setSortBy={setSortBy} viewMode={viewMode} setViewMode={setViewMode} isAdmin={isAdmin} />
              {inboxItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/5 rounded-[2rem]">
                  <span className="text-zinc-600 font-medium tracking-widest text-xs uppercase">Queue Empty</span>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleInboxDragEnd}>
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
                          onReject={handleRejectInbox}
                          handleSaveNotes={handleSaveInboxNotes}
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

# 9. Update handleLinkClick logic where suggestions was used
link_old = """    if (tab === "admin") {
      // Determine table from context
      if (suggestions.some(s => s.id === item.id)) table = "suggestions";
      else if (qurans.some(q => q.id === item.id)) table = "quran";
    }"""
link_new = """    if (tab === "admin") {
      if (bookmarks.some(s => s.id === item.id && s.is_approved === false)) table = "bookmarks";
    }"""
content = content.replace(link_old, link_new)

with open('app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
