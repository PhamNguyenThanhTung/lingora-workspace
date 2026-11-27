'use client';

import React, { useEffect, useRef, useState } from 'react';
import { isValidAudioReferenceUrl } from '@/server/lessons/vocabulary-candidates';

export interface AudioPreviewPlayerProps {
  url: string;
  label?: string;
  showUrlSummary?: boolean;
  idPrefix?: string;
}

type AudioLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export function AudioPreviewPlayer({
  url,
  label,
  showUrlSummary = false,
  idPrefix = 'audio-preview',
}: AudioPreviewPlayerProps) {
  const trimmedUrl = typeof url === 'string' ? url.trim() : '';
  const isValid = isValidAudioReferenceUrl(trimmedUrl);
  const [status, setStatus] = useState<AudioLoadStatus>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setStatus('idle');
    setRetryCount(0);
  }, [trimmedUrl]);

  if (!trimmedUrl) {
    return null;
  }

  if (!isValid) {
    return (
      <div
        id={`${idPrefix}-invalid`}
        role="alert"
        style={{
          marginTop: '6px',
          fontSize: '12px',
          color: '#b45309',
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '6px',
          padding: '6px 10px',
        }}
      >
        Liên kết âm thanh chưa đúng định dạng HTTPS công khai để nghe thử.
      </div>
    );
  }

  const handleRetry = () => {
    setStatus('loading');
    setRetryCount((prev) => prev + 1);
    requestAnimationFrame(() => {
      try {
        audioRef.current?.load();
      } catch {
        // Ignore browser media load errors; onError handler updates status.
      }
    });
  };

  return (
    <div
      id={`${idPrefix}-container`}
      style={{
        marginTop: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        maxWidth: '100%',
      }}
    >
      {label && (
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
          {label}
        </div>
      )}

      <audio
        key={`${trimmedUrl}-${retryCount}`}
        ref={audioRef}
        id={`${idPrefix}-player`}
        controls
        preload="none"
        src={trimmedUrl}
        onLoadStart={() => setStatus('loading')}
        onLoadedMetadata={() => setStatus('ready')}
        onCanPlay={() => setStatus('ready')}
        onPlaying={() => setStatus('ready')}
        onError={() => setStatus('error')}
        style={{ width: '100%', maxWidth: '380px', height: '36px', display: 'block' }}
      />

      {status === 'loading' && (
        <div
          id={`${idPrefix}-loading`}
          role="status"
          style={{ fontSize: '12px', color: '#475569' }}
        >
          Đang tải âm thanh...
        </div>
      )}

      {status === 'error' && (
        <div
          id={`${idPrefix}-error`}
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            fontSize: '12px',
            color: '#b91c1c',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            padding: '6px 10px',
          }}
        >
          <span>Không thể tải tệp âm thanh. Kiểm tra liên kết hoặc thử lại.</span>
          <button
            type="button"
            id={`${idPrefix}-retry`}
            className="btn btn-secondary"
            onClick={handleRetry}
            style={{ fontSize: '11px', padding: '2px 8px' }}
          >
            Thử lại
          </button>
        </div>
      )}

      {showUrlSummary && (
        <div
          id={`${idPrefix}-url`}
          title={trimmedUrl}
          style={{
            fontSize: '11px',
            color: '#64748b',
            maxWidth: '380px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {trimmedUrl}
        </div>
      )}
    </div>
  );
}
