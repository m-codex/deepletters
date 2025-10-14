"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Music, Check } from 'lucide-react';
import { supabase, MusicTrack } from '@/_lib/supabase';
import { useLetterData } from '../useLetterData';
import StepWrapper from './StepWrapper';

export default function MusicStep() {
  const router = useRouter();
  const { letterData, updateLetterData } = useLetterData();
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [selectedMusicId, setSelectedMusicId] = useState<string | null>(letterData.musicId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    const { data, error } = await supabase
      .from('music_tracks')
      .select('*')
      .eq('is_active', true)
      .order('created_at');

    if (error) {
      console.error('Error loading music tracks:', error);
    } else if (data) {
      setTracks(data);
    }
    setLoading(false);
  };

  const handleNext = () => {
    updateLetterData({ musicId: selectedMusicId });
    router.push('/create/preview');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            onClick={() => setSelectedMusicId(null)}
            className={`w-full flex items-center justify-between p-6 rounded-md border-2 transition-all duration-200 ${
              selectedMusicId === null
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
            {selectedMusicId === null && (
              <div className="w-6 h-6 bg-btn-primary rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </button>

          {tracks.map((track) => (
            <button
              key={track.id}
              onClick={() => setSelectedMusicId(track.id)}
              className={`w-full flex items-center justify-between p-6 rounded-md border-2 transition-all duration-200 ${
                selectedMusicId === track.id
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
                  <p className="text-sm text-secondary">
                    {track.artist} • {formatDuration(track.duration)}
                  </p>
                </div>
              </div>
              {selectedMusicId === track.id && (
                <div className="w-6 h-6 bg-btn-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </StepWrapper>
  );
}
