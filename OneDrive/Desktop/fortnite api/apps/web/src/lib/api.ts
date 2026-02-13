// Use relative paths - API is on the same domain
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface UploadResponse {
  trackingId: string;
  status: string;
  matchId?: string;
}

export interface UploadStatus {
  status: 'STATUS_PENDING' | 'STATUS_PROCESSING' | 'STATUS_COMPLETE' | 'STATUS_FAILED';
  matchId?: string;
}

export interface ComprehensiveMatchData {
  matchId: string;
  matchInfo?: any;
  players?: any;
  weapons?: any;
  buildingStats?: any;
  teamPlayers?: any;
  events?: any;
  movementEvents?: any;
  shotEvents?: any;
  playerPerZoneStats?: any;
  [key: string]: any;
}

// Upload file to Osirion via our backend API (fixes CORS)
export async function uploadReplay(file: File): Promise<UploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/api/analyze/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Upload error:', error);
    throw new Error(error.message || 'Upload failed');
  }
}

// Check upload status
export async function checkJobStatus(trackingId: string): Promise<UploadStatus & { comprehensiveData?: ComprehensiveMatchData; fightBreakdown?: any }> {
  const response = await fetch(`${API_BASE}/api/analyze/status/${trackingId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to check status' }));
    throw new Error(error.error || 'Failed to check status');
  }

  return await response.json();
}
