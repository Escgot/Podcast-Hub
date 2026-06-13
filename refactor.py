import re

def refactor():
    with open('app/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add toast import
    content = content.replace(
        'import { useState, useEffect } from "react";',
        'import { useState, useEffect } from "react";\nimport toast from "react-hot-toast";'
    )

    # 2. Replace all alerts
    content = content.replace('alert("Link copied to clipboard!");', 'toast.success("Link copied to clipboard!");')
    content = content.replace('alert("Please paste a URL first!");', 'toast.error("Please paste a URL first!");')
    content = content.replace('alert("Scraper Error: " + (data.error || "Could not parse the link."));', 'toast.error("Scraper Error: " + (data.error || "Could not parse the link."));')
    content = content.replace('alert("Network Error");', 'toast.error("Network Error");')
    content = content.replace('alert("Database Error: " + error.message);', 'toast.error("Database Error: " + error.message);')
    content = content.replace('alert("Suggestion submitted for review.");', 'toast.success("Suggestion submitted for review.");')
    content = content.replace('alert("Could not pull data.");', 'toast.error("Could not pull data.");')
    content = content.replace('alert("Quran link submitted for review.");', 'toast.success("Quran link submitted for review.");')
    # Admin alert inside unlock function
    content = content.replace('alert("Incorrect passcode.");', 'toast.error("Incorrect passcode.");')

    # 3. Handle handleAdminUnlock
    admin_unlock_old = """  const handleAdminUnlock = () => {
    if (isAdmin) { setIsAdmin(false); return; }
    const passcode = window.prompt("Enter Admin Passcode:");
    const correctPasscode = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || "7412";
    if (passcode === correctPasscode) { setIsAdmin(true); }
    else if (passcode !== null) { alert("Incorrect passcode."); }
  };"""

    admin_unlock_new = """  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState("");

  const handleAdminUnlock = () => {
    if (isAdmin) { setIsAdmin(false); toast("Admin mode locked", { icon: "🔒" }); return; }
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
    }
    else { 
      toast.error("Incorrect passcode."); 
      setAdminPasscode("");
    }
  };"""
    content = content.replace(admin_unlock_old, admin_unlock_new)

    # 4. Inject Admin Modal before the closing main tag
    admin_modal_jsx = """
      {/* Admin Passcode Modal */}
      <AnimatePresence>
        {isAdminModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">Admin Access</h3>
              <form onSubmit={submitAdminPasscode} className="flex flex-col gap-4">
                <input 
                  type="password" 
                  autoFocus
                  placeholder="Enter passcode..." 
                  value={adminPasscode} 
                  onChange={(e) => setAdminPasscode(e.target.value)} 
                  className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsAdminModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white transition-colors">Cancel</button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" className="px-4 py-2 rounded-xl text-sm font-bold bg-white text-black hover:bg-zinc-200 transition-colors">Unlock</motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </main>"""
    content = content.replace('</main>', admin_modal_jsx)

    # 5. Make buttons interactive with Framer Motion (whileHover, whileTap)
    content = content.replace(
        '<button type="submit" disabled={loading} className="bg-white text-black px-8 py-4 rounded-full font-bold text-sm hover:bg-zinc-200 active:scale-95 disabled:opacity-50 transition-all flex-shrink-0">',
        '<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" disabled={loading} className="bg-white text-black px-8 py-4 rounded-full font-bold text-sm disabled:opacity-50 transition-colors flex-shrink-0">'
    )
    content = content.replace('</button>\n                </form>', '</motion.button>\n                </form>')
    content = content.replace('</button>\n              </form>', '</motion.button>\n              </form>')

    content = content.replace(
        '<button onClick={handleSave} className="bg-white text-black px-6 py-2.5 rounded-full text-xs font-bold hover:bg-zinc-200 transition-all whitespace-nowrap">Commit</button>',
        '<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSave} className="bg-white text-black px-6 py-2.5 rounded-full text-xs font-bold hover:bg-zinc-200 transition-colors whitespace-nowrap">Commit</motion.button>'
    )
    
    content = content.replace(
        '<button type="submit" disabled={suggestionLoading} className="bg-white text-black px-8 py-4 rounded-full font-bold text-sm hover:bg-zinc-200 disabled:opacity-50 transition-all">',
        '<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" disabled={suggestionLoading} className="bg-white text-black px-8 py-4 rounded-full font-bold text-sm disabled:opacity-50 transition-colors">'
    )
    
    content = content.replace(
        '<button type="submit" disabled={quranLoading} className="bg-white text-black px-8 py-4 rounded-full font-bold text-sm hover:bg-zinc-200 disabled:opacity-50 transition-all">',
        '<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" disabled={quranLoading} className="bg-white text-black px-8 py-4 rounded-full font-bold text-sm disabled:opacity-50 transition-colors">'
    )
    
    content = content.replace(
        '<button onClick={() => onApprove(suggestion.id)} className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold transition-all hover:bg-zinc-200">Approve</button>',
        '<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onApprove(suggestion.id)} className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold transition-colors hover:bg-zinc-200">Approve</motion.button>'
    )
    
    content = content.replace(
        '<button onClick={() => onMoveToLibrary(suggestion)} className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold transition-all hover:bg-zinc-200">Deploy</button>',
        '<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onMoveToLibrary(suggestion)} className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold transition-colors hover:bg-zinc-200">Deploy</motion.button>'
    )
    
    content = content.replace(
        '<button onClick={() => onApprove(suggestion.id)} className="bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full text-xs font-bold transition-all">Approve Submission</button>',
        '<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onApprove(suggestion.id)} className="bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full text-xs font-bold transition-colors">Approve Submission</motion.button>'
    )

    with open('app/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    refactor()
