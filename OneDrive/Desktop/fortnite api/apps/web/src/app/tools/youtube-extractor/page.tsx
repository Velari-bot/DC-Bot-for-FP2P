"use client";

import React, { useMemo, useState } from "react";

type ExtractResult = {
  id: string;
  title: string;
  url: string;
  transcript: string;
  author: string;
  created_at: string;
  thumbnail?: string;
  tags?: string[];
};

export default function YouTubeExtractorPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ExtractResult[]>([]);
  const [errors, setErrors] = useState<{ id: string; error: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const parsedUrls = useMemo(() => {
    return input
      .split(/\r?\n|,/) // split by newline or comma
      .map((s) => s.trim())
      .filter(Boolean);
  }, [input]);

  const onSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setInput(text);
  };

  const handleExtract = async () => {
    setLoading(true);
    setErrorMsg(null);
    setResults([]);
    setErrors([]);
    try {
      const resp = await fetch("/api/youtube/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrls: parsedUrls }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setErrorMsg(data?.message || data?.error || "Failed to extract metadata");
        setLoading(false);
        return;
      }
      setResults((data?.results as ExtractResult[]) || []);
      setErrors((data?.errors as any[]) || []);
    } catch (e: any) {
      setErrorMsg(e?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const jsonOutput = useMemo(() => {
    const payload = (results || []).map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      transcript: r.transcript,
      author: r.author,
      created_at: r.created_at,
      thumbnail: r.thumbnail,
      tags: r.tags || ["fortnite"],
    }));
    return JSON.stringify(payload, null, 2);
  }, [results]);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonOutput);
    } catch {
      // Fallback if clipboard API is not available
      console.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="min-h-[100vh] text-white bg-black">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">YouTube Video Extractor</h1>
        <p className="text-sm text-gray-300 mb-4">
          Paste one or more YouTube URLs (watch or youtu.be). We&apos;ll fetch titles, channels, publish dates, and
          thumbnails, and return a ready-to-use <code>index.json</code> array for your Pathgen project. For best
          results, save each transcript as <code>&lt;VIDEO_ID&gt;.vtt</code> under <code>fortnite-core/data/videos/</code>.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">YouTube URLs (one per line or comma-separated)</label>
          <textarea
            className="w-full h-40 bg-[#111] border border-gray-700 rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://www.youtube.com/watch?v=vMdcwibUpMw\nhttps://youtu.be/j8VM6nSD2lk?si=..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="flex items-center gap-3 mt-2">
            <input type="file" accept=".txt" onChange={onSelectFile} className="text-sm" />
            <button
              onClick={handleExtract}
              disabled={loading || parsedUrls.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white disabled:opacity-50"
            >
              {loading ? "Extracting…" : "Extract"}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded bg-red-900 text-white mb-4">{errorMsg}</div>
        )}

        {results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb 3">
              <button onClick={copyJson} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">Copy JSON</button>
              <a
                href={`data:application/json;charset=utf-8,${encodeURIComponent(jsonOutput)}`}
                download="index.json"
                className="px-3 py-2 bg-gray-700 rounded text-sm"
              >
                Download index.json
              </a>
            </div>

            <div className="overflow-x-auto border border-gray-800 rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left">Thumbnail</th>
                    <th className="px-3 py-2 text-left">Title</th>
                    <th className="px-3 py-2 text-left">Channel</th>
                    <th className="px-3 py-2 text-left">Published</th>
                    <th className="px-3 py-2 text-left">Video ID</th>
                    <th className="px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id} className="border-t border-gray-800">
                      <td className="px-3 py-2">
                        {r.thumbnail ? (
                          <img src={r.thumbnail} alt={r.title} className="w-24 h-auto rounded" />
                        ) : (
                          <div className="w-24 h-14 bg-gray-800 rounded" />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="l font-medium">{r.title || "(untitled)"}</div>
                        <div className="text-xs text-gray-400">{r.url}</div>
                      </td>
                      <td className="px-3 py-2">{r.author || "-"}</td>
                      <td className="px-3 py-2">{r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</td>
                      <td className="px-3 py-2">{r.id}</td>
                      <td className="px-3 py-2">
                        <button
                          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                          onClick={async () => {
                            // id is prefixed with 'vid-'
                            const vid = r.id.replace(/^vid-/, '');
                            try {
                              const res = await fetch(`/api/youtube/transcribe?videoId=${encodeURIComponent(vid)}`);
                              if (!res.ok) {
                                const err = await res.json().catch(() => ({} as any));
                                alert(err?.error || 'No captions found');
                                return;
                              }
                              const vtt = await res.text();
                              const blob = new Blob([vtt], { type: 'text/vtt;charset=utf-8' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${vid}.vtt`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(url);
                            } catch (e: any) {
                              alert(e?.message || 'Failed to fetch captions');
                            }
                          }}
                        >
                          Get VTT
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


