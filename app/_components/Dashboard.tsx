"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import {
  Plus,
  Send,
  Inbox,
  Folder,
  LogOut,
  Loader2,
  Settings,
  Trash2,
  Edit,
} from "lucide-react";
import { Letter, LetterWithSubject } from "@/_lib/supabase";
import LetterDetailModal from "./LetterDetailModal";
type View = "sent" | "received" | string;

export default function Dashboard() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [letters, setLetters] = useState<LetterWithSubject[]>([]);
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [view, setView] = useState<View>("sent");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedLetter, setSelectedLetter] =
    useState<LetterWithSubject | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleNewFolder = async () => {
    const folderName = prompt("Enter a name for your new folder:");
    if (folderName && user) {
      try {
        const { data, error } = await supabase
          .from("folders")
          .insert({ name: folderName, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        if (data) {
          setFolders((prev) => [...prev, data]);
        }
      } catch (err) {
        console.error("Error creating folder:", err);
        alert("Could not create the folder. Please try again.");
      }
    }
  };

  const fetchData = useCallback(
    async (user: User, currentView: View) => {
      setLoading(true);
      try {
        let lettersData: LetterWithSubject[] = [];
        if (currentView === "sent") {
          const { data, error } = await supabase.rpc("get_letters_for_user", {
            p_user_id: user.id,
          });
          if (error) throw error;
          lettersData = data || [];
        } else if (currentView === "received") {
          const { data, error } = await supabase.rpc(
            "get_saved_letters_for_user",
            { p_user_id: user.id },
          );
          if (error) throw error;
          lettersData = data || [];
        } else {
          lettersData = [];
        }
        setLetters(lettersData);

        const { data: folderData, error: folderError } = await supabase
          .from("folders")
          .select("id, name")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (folderError) throw folderError;
        setFolders(folderData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    },
    [supabase],
  );

  useEffect(() => {
    // Clear the temp_id from localStorage if it exists.
    // This is crucial for the sender flow after a magic link signup.
    if (localStorage.getItem("tempId")) {
      localStorage.removeItem("tempId");
    }

    setLoading(true);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const currentUser = session.user;
        setUser(currentUser);
        fetchData(currentUser, view);
      } else {
        router.push("/");
      }
    });

    // On initial load, getSession can be faster for an existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
            // If getSession is fast and there's no session, we can stop loading early.
            // onAuthStateChange will still handle the redirect.
            setLoading(false);
        }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, view, fetchData]);

  console.log(`Dashboard Component Render - Loading: ${loading}, User: ${user ? user.id : 'null'}`);

  if (loading && !user) {
    console.log("Dashboard: Render loading spinner.");
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary-bg">
        <Loader2 className="w-12 h-12 text-btn-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Or a redirect component
  }

  const Sidebar = () => (
    <aside className={`bg-secondary-bg text-primary p-6 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex-grow">
        <button onClick={() => router.push('/create')} className="w-full bg-btn-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-btn-hover mb-8 flex items-center justify-center gap-2">
          <Plus className="w-6 h-6" /> {isSidebarOpen && 'New Letter'}
        </button>
        <nav className="space-y-2">
          <button onClick={() => setView('sent')} className={`w-full flex items-center gap-3 p-3 rounded-md ${view === 'sent' ? 'bg-primary text-primary-bg' : 'hover:bg-primary-bg'}`}>
            <Send className="w-5 h-5" /> {isSidebarOpen && 'Sent'}
          </button>
          <button onClick={() => setView('received')} className={`w-full flex items-center gap-3 p-3 rounded-md ${view === 'received' ? 'bg-primary text-primary-bg' : 'hover:bg-primary-bg'}`}>
            <Inbox className="w-5 h-5" /> {isSidebarOpen && 'Received'}
          </button>
          <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-sm font-semibold text-secondary ${!isSidebarOpen && 'text-center'}`}>{isSidebarOpen ? 'Folders' : '📁'}</h3>
              {isSidebarOpen && (
                <button onClick={handleNewFolder} className="text-btn-primary hover:text-btn-hover p-1 rounded-md">
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-1">
              {folders.map(folder => (
                <button key={folder.id} onClick={() => setView(folder.id)} className={`w-full flex items-center gap-3 p-3 rounded-md text-sm ${view === folder.id ? 'bg-primary text-primary-bg' : 'hover:bg-primary-bg'}`}>
                  <Folder className="w-5 h-5" /> {isSidebarOpen && <span className="truncate">{folder.name}</span>}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>
      <div className="border-t border-secondary pt-4">
        <button onClick={handleSignOut} className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-red-500 hover:text-white">
          <LogOut className="w-5 h-5" /> {isSidebarOpen && 'Sign Out'}
        </button>
      </div>
    </aside>
  );

  const MainContent = () => (
    <main className="flex-1 p-8 bg-primary-bg">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary capitalize">{view}</h1>
        <div>
          {/* Action buttons like 'New Folder' can go here */}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <p className="text-secondary">Loading letters...</p>
        ) : letters.length > 0 ? (
          letters.map(letter => (
            <LetterCard key={letter.id} letter={letter} />
          ))
        ) : (
          <p className="text-secondary">No letters found in this view.</p>
        )}
      </div>
    </main>
  );

  const LetterCard = ({ letter }: { letter: LetterWithSubject }) => (
    <div
      onClick={() => {
        setSelectedLetter(letter);
        setIsDetailModalOpen(true);
      }}
      className="bg-secondary-bg rounded-lg shadow-md p-4 flex flex-col justify-between hover:shadow-xl transition-shadow cursor-pointer"
    >
      <div>
        <h3 className="font-bold text-lg text-primary mb-2 truncate">{letter.user_subject || letter.subject || 'No Subject'}</h3>
        <p className="text-sm text-secondary mb-4">To: {letter.recipient_name || 'Anonymous'}</p>
        <p className="text-sm text-secondary line-clamp-3">{letter.content}</p>
      </div>
      <div className="text-xs text-gray-400 mt-4">
        {new Date(letter.created_at).toLocaleDateString()}
      </div>
    </div>
  );

  const handleSubjectUpdate = (letterId: string, newSubject: string) => {
    setLetters(prevLetters =>
      prevLetters.map(l =>
        l.id === letterId ? { ...l, user_subject: newSubject } : l
      )
    );
    if (selectedLetter && selectedLetter.id === letterId) {
      setSelectedLetter(prev => prev ? { ...prev, user_subject: newSubject } : null);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <MainContent />
      <LetterDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        letter={selectedLetter}
        user={user}
        onSubjectUpdate={handleSubjectUpdate}
      />
    </div>
  );
}