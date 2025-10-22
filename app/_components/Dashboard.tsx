"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { useSupabase } from "@/_components/SupabaseProvider";
import {
  Plus,
  Send,
  Inbox,
  Folder,
  LogOut,
  Loader2,
  Settings,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Letter, LetterWithSubject } from "@/_lib/supabase";
import LetterDetailModal from "./LetterDetailModal";
import { useLetterData } from "./useLetterData";
type View = "sent" | "received" | "drafts" | string;

export default function Dashboard() {
  const supabase = useSupabase();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [letters, setLetters] = useState<LetterWithSubject[]>([]);
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [view, setView] = useState<View>("sent");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] =
    useState<LetterWithSubject | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState<string>("");
  const { updateLetterData } = useLetterData();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const promptForNewFolder = () => {
    const folderName = prompt("Enter a name for your new folder:");
    if (folderName) {
      handleNewFolder(folderName);
    }
  };
    const handleDeleteFolder = async (folderId: string) => {
    if (window.confirm("Are you sure you want to delete this folder? This action cannot be undone.")) {
      try {
        // First, delete all associations in folder_letters
        const { error: assocError } = await supabase.from('folder_letters').delete().eq('folder_id', folderId);
        if (assocError) throw assocError;

        // Then, delete the folder itself
        const { error: folderError } = await supabase.from('folders').delete().eq('id', folderId);
        if (folderError) throw folderError;

        setFolders(prev => prev.filter(f => f.id !== folderId));
        setView('sent'); // Reset view to default
        setSelectedFolderName(null);
        setEditingFolderId(null);
      } catch (err) {
        console.error("Error deleting folder:", err);
        alert("Could not delete the folder. Please try again.");
      }
    }
  };

  const handleRenameFolder = async () => {
    if (!editingFolderId || !editingFolderName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('folders')
        .update({ name: editingFolderName.trim() })
        .eq('id', editingFolderId)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setFolders(prev => prev.map(f => f.id === editingFolderId ? data : f));
        setSelectedFolderName(data.name);
      }
      setEditingFolderId(null);

    } catch (err) {
      console.error("Error renaming folder:", err);
      alert("Could not rename the folder. Please try again.");
    }
  };

  const handleNewFolder = async (folderName: string, letterId: string | null = null) => {
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
          if (letterId) {
            await handleFolderAssign(letterId, data.id);
          }
          return data;
        }
      } catch (err) {
        console.error("Error creating folder:", err);
        alert("Could not create the folder. Please try again.");
      }
    }
    return null;
  };

  const handleFolderAssign = async (letterId: string, folderId: string | null) => {
    try {
      if (folderId) {
        const { error } = await supabase.from('folder_letters').upsert({
          letter_id: letterId,
          folder_id: folderId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('folder_letters').delete().match({ letter_id: letterId });
        if (error) throw error;
      }
      // Optionally, refetch data or update local state to reflect the change
      if (user) {
        await fetchData(user, view);
      }
    } catch (err) {
      console.error("Error assigning folder:", err);
      alert("Could not assign the folder. Please try again.");
    }
  };

  const fetchData = useCallback(
    async (user: User, currentView: View) => {
      setLoading(true);
      try {
        let lettersData: LetterWithSubject[] = [];
        const { data: allLetters, error: allLettersError } = await supabase.rpc("get_letters_for_user", { p_user_id: user.id });
        if (allLettersError) {
            console.error('Error from get_letters_for_user RPC:', allLettersError);
            throw allLettersError;
        }

        if (currentView === "sent") {
          lettersData = (allLetters || []).filter((letter: LetterWithSubject) => letter.status === 'finalized');
        } else if (currentView === "received") {
          const { data, error } = await supabase.rpc("get_saved_letters_for_user", { p_user_id: user.id });
          if (error) {
            console.error('Error from get_saved_letters_for_user RPC:', error);
            throw error;
          }
          lettersData = (data || []).filter((letter: LetterWithSubject) => letter.sender_id !== user.id);
        } else if (currentView === "drafts") {
          const { data, error } = await supabase
            .from('letters')
            .select('*')
            .eq('sender_id', user.id)
            .eq('status', 'draft');
          if (error) throw error;
          lettersData = data || [];
        } else {
          const { data: folderLetters, error: lfError } = await supabase
            .from('folder_letters')
            .select('letter_id')
            .eq('folder_id', currentView);

          if (lfError) throw lfError;

          if (folderLetters) {
            const letterIds = folderLetters.map(lf => lf.letter_id);
            if (letterIds.length > 0) {
              const { data: sentLetters, error: sentError } = await supabase.rpc("get_letters_for_user", { p_user_id: user.id });
              const { data: receivedLetters, error: receivedError } = await supabase.rpc("get_saved_letters_for_user", { p_user_id: user.id });

              if (sentError) throw sentError;
              if (receivedError) throw receivedError;

              const allLetters = [...(sentLetters || []), ...(receivedLetters || [])];
              const uniqueLetters = Array.from(new Map(allLetters.map(l => [l.id, l])).values());

              lettersData = uniqueLetters.filter(l => letterIds.includes(l.id));
            } else {
              lettersData = [];
            }
          }
        }
        lettersData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const user = session.user;
        setUser(user);

        const shareCodeToClaim = localStorage.getItem('lastFinalizedShareCode');
        if (shareCodeToClaim) {
          const claimLetterAndFetchData = async () => {
            let claimedLetter: LetterWithSubject | null = null;
            try {
              const { error: claimError } = await supabase.rpc('claim_letter', { share_code_to_claim: shareCodeToClaim });
              if (claimError) {
                console.error('Error claiming letter RPC:', claimError);
                throw claimError;
              }

              const { data: letter, error: letterError } = await supabase
                .from('letters')
                .select('*')
                .eq('share_code', shareCodeToClaim)
                .single();

              if (letterError) {
                console.error('Error fetching letter by share code:', letterError);
                throw letterError;
              }

              if (letter) {
                const { error: saveError } = await supabase
                  .from('saved_letters')
                  .insert({ user_id: user.id, letter_id: letter.id });

                if (saveError && saveError.code !== '23505') {
                  console.error('Error inserting into saved_letters:', saveError);
                  throw saveError;
                }
                claimedLetter = letter;
              }

              localStorage.removeItem('lastFinalizedShareCode');
            } catch (error) {
              console.error('Full error claiming letter and saving:', error);
            } finally {
              if (claimedLetter && view === 'sent') {
                setLetters(prevLetters => [claimedLetter!, ...prevLetters].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
              } else {
                await fetchData(user, view);
              }
            }
          };
          claimLetterAndFetchData();
        } else {
          fetchData(user, view);
        }
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        router.push('/');
      }
    });

    // Initial check for a session
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        // Don't fetch data here, let the onAuthStateChange handle it
      } else {
        // Only redirect if there is no ongoing auth event
        const params = new URLSearchParams(window.location.hash.substring(1));
        if (!params.has('access_token')) {
          router.push('/');
        }
      }
      setLoading(false);
    };

    initializeSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, view, fetchData]);

  if (loading && !user) {
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
          <button onClick={() => { setView('sent'); setSelectedFolderName(null); }} className={`w-full flex items-center gap-3 p-3 rounded-md ${view === 'sent' ? 'bg-primary text-primary-bg' : 'hover:bg-primary-bg'}`}>
            <Send className="w-5 h-5" /> {isSidebarOpen && 'Sent'}
          </button>
          <button onClick={() => { setView('drafts'); setSelectedFolderName(null); }} className={`w-full flex items-center gap-3 p-3 rounded-md ${view === 'drafts' ? 'bg-primary text-primary-bg' : 'hover:bg-primary-bg'}`}>
            <Pencil className="w-5 h-5" /> {isSidebarOpen && 'Drafts'}
          </button>
          <button onClick={() => { setView('received'); setSelectedFolderName(null); }} className={`w-full flex items-center gap-3 p-3 rounded-md ${view === 'received' ? 'bg-primary text-primary-bg' : 'hover:bg-primary-bg'}`}>
            <Inbox className="w-5 h-5" /> {isSidebarOpen && 'Received'}
          </button>
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-sm font-semibold text-secondary ${!isSidebarOpen && 'text-center'}`}>{isSidebarOpen ? 'Folders' : '📁'}</p>
              {isSidebarOpen && (
                <button onClick={promptForNewFolder} className="text-btn-primary hover:text-btn-hover p-1 rounded-md">
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-1">
              {folders.map(folder => (
                <button key={folder.id} onClick={() => { setView(folder.id); setSelectedFolderName(folder.name); }} className={`w-full flex items-center gap-3 p-3 rounded-md text-sm ${view === folder.id ? 'bg-primary text-primary-bg' : 'hover:bg-primary-bg'}`}>
                  <Folder className="w-5 h-5" /> {isSidebarOpen && <span className="truncate">{folder.name}</span>}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>
      <div className="border-t border-border pt-4">
        <button onClick={handleSignOut} className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-red-500 hover:text-white">
          <LogOut className="w-5 h-5" /> {isSidebarOpen && 'Sign Out'}
        </button>
      </div>
    </aside>
  );

  const MainContent = () => {
    const isFolderView = view !== 'sent' && view !== 'received';
    const currentFolder = isFolderView ? folders.find(f => f.id === view) : null;

    return (
      <main className="flex-1 p-8 bg-primary-bg">
        <div className="flex justify-between items-center mb-8">
          {editingFolderId === view && isFolderView ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editingFolderName}
                onChange={(e) => setEditingFolderName(e.target.value)}
                className="text-3xl font-bold text-primary bg-transparent border-b-2 border-btn-primary focus:outline-none"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder()}
              />
            </div>
          ) : (
            <h1
              className="text-3xl font-bold text-primary capitalize cursor-pointer flex items-center gap-2"
              onClick={() => {
                if (isFolderView && currentFolder) {
                  setEditingFolderId(currentFolder.id);
                  setEditingFolderName(currentFolder.name);
                }
              }}
            >
              {selectedFolderName || view}
              {isFolderView && <Pencil className="w-5 h-5 text-secondary opacity-50 hover:opacity-100 transition-opacity" />}
            </h1>
          )}
          <div>
            {editingFolderId === view && (
              <button
                onClick={() => handleDeleteFolder(editingFolderId)}
                className="bg-btn-secondary text-primary-bg font-bold py-2 px-4 rounded-lg flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" /> Delete Folder
              </button>
            )}
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
  }

  const LetterCard = ({ letter }: { letter: LetterWithSubject }) => {
    const isDraft = letter.status === 'draft';

    const handleContinueDraft = (e: React.MouseEvent) => {
      e.stopPropagation();
      updateLetterData({
        id: letter.id,
        content: letter.content || '',
        senderName: letter.sender_name || '',
        recipientName: letter.recipient_name || '',
        musicUrl: letter.music_url || null,
        theme: letter.theme || 'light',
      });
      router.push('/create/write');
    };

    const handleDeleteDraft = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm('Are you sure you want to delete this draft?')) {
        try {
          const { error } = await supabase.from('letters').delete().eq('id', letter.id);
          if (error) throw error;
          setLetters(prev => prev.filter(l => l.id !== letter.id));
        } catch (err) {
          console.error('Error deleting draft:', err);
          alert('Could not delete the draft. Please try again.');
        }
      }
    };

    return (
      <div
        className="bg-secondary-bg rounded-lg shadow-md p-4 flex flex-col justify-between hover:shadow-xl transition-shadow cursor-pointer"
        onClick={() => {
          if (!isDraft) {
            setSelectedLetter(letter);
            setIsDetailModalOpen(true);
          }
        }}
      >
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-primary truncate pr-2">
              {isDraft ? (letter.content?.substring(0, 20) || 'Untitled Draft') : (letter.user_subject || letter.subject || 'No Subject')}
            </h3>
            {!isDraft && <Pencil className="w-4 h-4 text-secondary" />}
          </div>
          <p className="text-sm text-secondary mb-4">
            To: {letter.recipient_name || 'Anonymous'}
          </p>
          <p className="text-sm text-secondary line-clamp-3">{letter.content}</p>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="text-xs text-gray-400">
            {new Date(letter.created_at).toLocaleDateString()}
          </div>
          {isDraft ? (
            <div className="flex gap-2">
              <button
                onClick={handleContinueDraft}
                className="text-xs bg-btn-primary text-white font-semibold py-1 px-3 rounded-full hover:bg-btn-hover transition-colors"
              >
                Continue Draft
              </button>
              <button
                onClick={handleDeleteDraft}
                className="text-xs bg-red-500 text-white font-semibold py-1 px-3 rounded-full hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/letter/${letter.share_code}`);
              }}
              className="text-xs bg-btn-primary text-white font-semibold py-1 px-3 rounded-full hover:bg-btn-hover transition-colors"
            >
              View Letter
            </button>
          )}
        </div>
      </div>
    );
  };


  const handleSubjectUpdate = (letterId: string, newSubject: string) => {
    setLetters(prevLetters =>
      prevLetters.map(l =>
        l.id === letterId ? { ...l, user_subject: newSubject, subject: newSubject } : l
      )
    );
    if (selectedLetter && selectedLetter.id === letterId) {
      setSelectedLetter(prev => prev ? { ...prev, user_subject: newSubject, subject: newSubject } : null);
    }
  };

  const handleRecipientNameUpdate = (letterId: string, newRecipientName: string) => {
    setLetters(prevLetters =>
      prevLetters.map(l =>
        l.id === letterId ? { ...l, recipient_name: newRecipientName } : l
      )
    );
    if (selectedLetter && selectedLetter.id === letterId) {
      setSelectedLetter(prev => prev ? { ...prev, recipient_name: newRecipientName } : null);
    }
  };

  const handleRecipientNameSave = async (letterId: string, recipientName: string) => {
    try {
      const { error } = await supabase.from('letters').update({ recipient_name: recipientName }).eq('id', letterId);
      if (error) throw error;
      handleRecipientNameUpdate(letterId, recipientName);
    } catch (err) {
      console.error('Error saving recipient name:', err);
      alert('Failed to save recipient name.');
    }
  };

  const handleSubjectSave = async (letterId: string, subject: string, userId: string) => {
    try {
      const { error } = await supabase.from('user_letter_subjects').upsert({
        user_id: userId,
        letter_id: letterId,
        subject: subject,
      });
      if (error) throw error;
      handleSubjectUpdate(letterId, subject);
    } catch (err) {
      console.error('Error saving subject:', err);
      alert('Failed to save subject.');
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <MainContent />
      {isDetailModalOpen && selectedLetter && (
        <LetterDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          letter={selectedLetter}
          user={user}
          onSubjectUpdate={handleSubjectUpdate}
          folders={folders}
          onNewFolder={(folderName) => handleNewFolder(folderName, selectedLetter.id)}
          onSubjectSave={handleSubjectSave}
          onFolderAssign={handleFolderAssign}
        />
      )}
    </div>
  );
}
