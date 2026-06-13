import re

with open('app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Revert Navigation items
nav_old = """  const items = [
    { k: 'home', l: 'Home', i: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
    { k: 'podcasts', l: 'Podcasts', i: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg> },
    { k: 'quran', l: 'Quran', i: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
  ];"""
nav_new = """  const items = [
    { k: 'home', l: 'Home', i: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
    { k: 'library', l: 'Library', i: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> },
  ];"""
content = content.replace(nav_old, nav_new)

# 2. Update LayoutToolbar signature
tb_sig_old = "const LayoutToolbar = ({ title, count, searchQuery, setSearchQuery, sortBy, setSortBy, viewMode, setViewMode, isAdmin }: any) => ("
tb_sig_new = "const LayoutToolbar = ({ title, count, searchQuery, setSearchQuery, sortBy, setSortBy, viewMode, setViewMode, isAdmin, libraryTab, setLibraryTab }: any) => ("
content = content.replace(tb_sig_old, tb_sig_new)

# 3. Add pill to LayoutToolbar
tb_pill_old = """      <div className="flex items-center justify-between sm:justify-start gap-2">
        <div className="flex bg-black p-1 rounded-full border border-white/5 relative">"""
tb_pill_new = """      <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2">
        {setLibraryTab && (
          <div className="flex bg-black p-1 rounded-full border border-white/5 relative mr-2">
            {[
              { id: "podcasts", label: "🎙️ Podcasts" },
              { id: "quran", label: "📖 Quran" }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setLibraryTab(option.id)}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-full transition-colors duration-300 z-10 ${libraryTab === option.id ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
              >
                {libraryTab === option.id && (
                  <motion.div
                    layoutId="activeLibraryTab"
                    className="absolute inset-0 bg-zinc-800 rounded-full -z-10"
                    transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                  />
                )}
                {option.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex bg-black p-1 rounded-full border border-white/5 relative">"""
content = content.replace(tb_pill_old, tb_pill_new)

# 4. Add libraryTab state to Home
state_old = """  const [tab, setTab] = useState("home");"""
state_new = """  const [tab, setTab] = useState("home");
  const [libraryTab, setLibraryTab] = useState("podcasts");"""
content = content.replace(state_old, state_new)

# 5. Fix link active tab check
link_old = """    if (tab === "quran") {
      table = "quran";
    }"""
link_new = """    if (tab === "library") {
      if (libraryTab === "quran") table = "quran";
    }"""
content = content.replace(link_old, link_new)

# 6. Change "View all ->" button back to library
viewall_old = """<button onClick={() => setTab('podcasts')} className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors">View all →</button>"""
viewall_new = """<button onClick={() => setTab('library')} className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors">View all →</button>"""
content = content.replace(viewall_old, viewall_new)

# 7. Merge Podcasts and Quran rendering blocks
pattern = r'\{\/\* ==================== PODCASTS TAB ==================== \*\/\}(.*?)\{\/\* ==================== ADMIN TAB ==================== \*\/\}'
def replace_tabs(match):
    return """{/* ==================== LIBRARY TAB ==================== */}
        {tab === "library" && (
          <div className="space-y-8">
            <LayoutToolbar
              title={libraryTab === "podcasts" ? "Your Podcasts" : "Your Quran Library"}
              count={libraryTab === "podcasts" ? filteredBookmarks.length : approvedQurans.length}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortBy={sortBy}
              setSortBy={setSortBy}
              viewMode={viewMode}
              setViewMode={setViewMode}
              isAdmin={isAdmin}
              libraryTab={libraryTab}
              setLibraryTab={setLibraryTab}
            />

            {libraryTab === "podcasts" ? (
              filteredBookmarks.length === 0 ? (
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
              )
            ) : (
              approvedQurans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/10 rounded-[2rem]">
                  <span className="text-zinc-600 font-medium tracking-widest text-xs uppercase">No Quran videos found</span>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleQuranDragEnd(e, "approved")}>
                  <SortableContext items={approvedQurans} strategy={viewMode === "list" ? verticalListSortingStrategy : rectSortingStrategy}>
                    <motion.div layout className={viewMode === "list" ? "grid grid-cols-1 gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-8"}>
                      <AnimatePresence mode="popLayout">
                        {approvedQurans.map((q) => (
                          <SortableSuggestionItem
                            key={q.id}
                            suggestion={q}
                            isAdmin={isAdmin}
                            viewMode={viewMode}
                            onMoveToPodcast={handleMoveToPodcast}
                            onMoveToQuran={handleMoveToQuran}
                            onReject={handleRejectQuran}
                            handleSaveNotes={handleSaveQuranNotes}
                            onLinkClick={handleLinkClick}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  </SortableContext>
                </DndContext>
              )
            )}
          </div>
        )}

        {/* ==================== ADMIN TAB ==================== */}"""

content = re.sub(pattern, replace_tabs, content, flags=re.DOTALL)

with open('app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
