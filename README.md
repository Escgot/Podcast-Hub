# 🎧 Podcast Hub

A premium, highly responsive, and mobile-optimized dashboard for curating, organizing, and managing podcast bookmarks and media links. Built with a sleek, iOS-inspired (HIG) interface, it features seamless drag-and-drop organization, URL scraping, and an admin approval pipeline for community suggestions.

---

## ✨ Features

* **Admin Authorization:** Secure passcode-protected admin mode to manage content.
* **Dual Pipeline System:** 
  * **My Library:** The live database of curated media.
  * **Suggestions:** A community inbox where users can submit URLs. Admins can review, approve, and deploy these directly to the Library.
* **Smart URL Ingestion:** Paste a link to automatically scrape and fetch metadata (thumbnail, title, author, publish date, and view count).
* **Fluid Drag & Drop:** Custom drag-and-drop sorting (`dnd-kit`) that automatically saves the exact order of your items to the database.
* **Dynamic Layouts:** Toggle seamlessly between Grid and List views with smooth Framer Motion layout animations.
* **Search & Sort:** Real-time search filtering and sorting by View Count or Default Order.
* **Mobile-First Design:** Fluid padding, tap-friendly targets (minimum 44x44px), and expanding action buttons tailored for iOS and Android devices.

---

## 🛠 Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (React)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Animations:** [Framer Motion](https://www.framer.com/motion/)
* **Database & Auth:** [Supabase](https://supabase.com/)
* **Drag & Drop:** [@dnd-kit/core](https://dndkit.com/)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone [https://github.com/yourusername/media-hub.git](https://github.com/yourusername/media-hub.git)
cd media-hub
```
### 2. Install dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```
### 3. Environment Variables
Create a .env.local file in the root of your project and add the following variables:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Admin Authentication
NEXT_PUBLIC_ADMIN_PASSCODE=7412 # Change this to your desired PIN
```
### 4. Database Setup (Supabase)
You will need to create two tables in your Supabase project: bookmarks and suggestions.

Both tables should share this general schema:

```sql
id (uuid, primary key)

created_at (timestamp)

url (text)

podcast_name (text, nullable)

episode_title (text, nullable)

platform (text, nullable)

description (text, nullable)

thumbnail_url (text, nullable)

publish_date (timestamp, nullable)

view_count (numeric/text, nullable)

sort_order (numeric)

notes (text, nullable)

Note: The suggestions table requires an additional boolean column:

is_approved (boolean, default: false)
```
### 5. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### 🔐 Usage & Admin Access
Viewing: By default, users load into the read-only view. They can search, sort, toggle layouts, and submit links to the "Suggestions" tab.

Admin Unlock: Click/Tap the "🎧 Hub" logo in the top-left floating navigation bar.

Management: Once unlocked, an "Admin" badge will appear. You can now drag and drop cards, delete entries, add private insights/notes, and approve/deploy suggestions.

### 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.