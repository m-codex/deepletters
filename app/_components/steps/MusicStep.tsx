"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Music, Check } from 'lucide-react';
import { supabase } from '@/_lib/supabase';
import { useLetterData } from '../useLetterData';
import StepWrapper from './StepWrapper';

type MusicTrack = {
  name: string;
  url: string;
};

type MusicCategory = {
  name: string;
  tracks: MusicTrack[];
};

export default function MusicStep() {
  const router = useRouter();
  const { letterData, updateLetterData } = useLetterData();
  const [musicCategories, setMusicCategories] = useState<MusicCategory[]>([]);
  const [selectedMusicUrl, setSelectedMusicUrl] = useState<string | null>(letterData.musicUrl);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMusicFromStorage();
  }, []);

  const loadMusicFromStorage = async () => {
    const { data: folders, error: foldersError } = await supabase.storage
      .from('music-tracks')
      .list();

    if (foldersError) {
      console.error('Error loading music categories:', foldersError);
      setLoading(false);
      return;
    }

    const categories: MusicCategory[] = [];
    for (const folder of folders) {
      if (folder.id === null) { // This filters for folders, which have a null id
        const { data: tracks, error: tracksError } = await supabase.storage
          .from('music-tracks')
          .list(folder.name);

        if (tracksError) {
          console.error(`Error loading tracks for category ${folder.name}:`, tracksError);
          continue;
        }

        const trackList: MusicTrack[] = tracks
          .filter(track => !track.name.startsWith('.')) // a .folder is created by default
          .map(track => {
            const { data } = supabase.storage
              .from('music-tracks')
              .getPublicUrl(`${folder.name}/${track.name}`);
            return {
              name: track.name.replace(/\.(mp3|wav|ogg)$/, ''),
              url: data.publicUrl,
            };
          });

        if (trackList.length > 0) {
            categories.push({
                name: folder.name,
                tracks: trackList,
              });
        }
      }
    }
    setMusicCategories(categories);
    setLoading(false);
  };

  const handleNext = () => {
    updateLetterData({ musicUrl: selectedMusicUrl });
    router.push('/create/preview');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-btn-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <StepWrapper
      title="Choose Background Music"
      description="Add a beautiful soundtrack to your letter"
      icon={<Music className="w-8 h-8 text-btn-primary" />}
      buttonText="Next Step"
      onNext={handleNext}
      isNextDisabled={false}
    >
      <div className="bg-secondary-bg shadow-xl p-8 md:p-12 mb-8">
        <div className="space-y-4 mb-8">
          <button
            onClick={() => setSelectedMusicUrl(null)}
            className={`w-full flex items-center justify-between p-6 rounded-md border-2 transition-all duration-200 ${
              selectedMusicUrl === null
                ? 'border-btn-primary bg-primary-bg'
                : 'border-secondary'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Music className="w-6 h-6 text-secondary" />
              </div>
              <div className="text-left">
                <h3 className="text-primary">No Music</h3>
                <p className="text-sm text-secondary">Silent letter</p>
              </div>
            </div>
            {selectedMusicUrl === null && (
              <div className="w-6 h-6 bg-btn-primary rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </button>

          {musicCategories.map((category) => (
            <div key={category.name}>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">{category.name}</h2>
              {category.tracks.map((track) => (
                <button
                  key={track.url}
                  onClick={() => setSelectedMusicUrl(track.url)}
                  className={`w-full flex items-center justify-between p-6 rounded-md border-2 transition-all duration-200 mb-4 ${
                    selectedMusicUrl === track.url
                      ? 'border-btn-primary bg-primary-bg'
                      : 'border-secondary'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-btn-primary rounded-full flex items-center justify-center">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-primary">{track.name}</h3>
                    </div>
                  </div>
                  {selectedMusicUrl === track.url && (
                    <div className="w-6 h-6 bg-btn-primary rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </StepWrapper>
  );
}
