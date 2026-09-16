import {
  FOUNDRYS_YOUTUBE_CHANNEL_ID,
  FOUNDRYS_YOUTUBE_FEATURED_VIDEO_ID,
  FOUNDRYS_YOUTUBE_UPLOADS_PLAYLIST_ID,
} from "@/lib/brand";
import { isStoredLessonFile } from "@/lib/learning/lesson-file";
import { uploadUrl } from "@/lib/urls";

export type LessonVideo =
  | { kind: "youtube"; id: string; src: string; poster: string }
  | { kind: "vimeo"; id: string; src: string }
  | { kind: "file"; src: string }
  | { kind: "link"; href: string };

function youtubeHost(hostname: string) {
  const host = hostname.replace(/^www\./, "");
  return (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtube-nocookie.com" ||
    host === "youtu.be"
  );
}

function isYouTubeVideoId(id: string) {
  return /^[A-Za-z0-9_-]{6,}$/.test(id) && id !== "videoseries" && id !== "playlist";
}

function youtubePlaylistIdFromUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (!youtubeHost(url.hostname)) return null;
    const list = url.searchParams.get("list");
    if (list && /^PL[\w-]{6,}$/i.test(list)) return list;
  } catch {
    return null;
  }
  return null;
}

/** First video when a playlist URL has no `v=` — a bare videoseries embed of a private list shows as private. */
const YOUTUBE_PLAYLIST_LEAD_VIDEO: Record<string, string> = {
  PLM0upyoEdKOM: "dUclJ0Hs56Y",
};

/** Playlist is still private even when its videos are Unlisted — `list=` on the embed shows "Video is private". */
const YOUTUBE_PLAYLISTS_SKIP_LIST_EMBED = new Set(["PLM0upyoEdKOM"]);

function foundrysChannelUploads(raw: string): {
  videoId: string;
  list: string;
} | null {
  try {
    const url = new URL(raw);
    if (!youtubeHost(url.hostname)) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    const channelId =
      parts[0] === "channel" && parts[1]?.startsWith("UC") ? parts[1] : null;
    const list = url.searchParams.get("list");
    const isFoundrysChannel =
      channelId === FOUNDRYS_YOUTUBE_CHANNEL_ID ||
      list === FOUNDRYS_YOUTUBE_UPLOADS_PLAYLIST_ID;
    if (!isFoundrysChannel) return null;
    return {
      videoId: youtubeIdFromUrl(raw) ?? FOUNDRYS_YOUTUBE_FEATURED_VIDEO_ID,
      list: FOUNDRYS_YOUTUBE_UPLOADS_PLAYLIST_ID,
    };
  } catch {
    return null;
  }
}

function youtubeIdFromUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && isYouTubeVideoId(id) ? id : null;
    }
    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const fromQuery = url.searchParams.get("v");
      if (fromQuery && isYouTubeVideoId(fromQuery)) return fromQuery;
      const parts = url.pathname.split("/").filter(Boolean);
      if (
        parts[0] === "embed" ||
        parts[0] === "shorts" ||
        parts[0] === "live" ||
        parts[0] === "v"
      ) {
        const id = parts[1];
        return id && isYouTubeVideoId(id) ? id : null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function youtubePlayerParams() {
  return new URLSearchParams({
    autoplay: "1",
    mute: "0",
    controls: "0",
    disablekb: "1",
    fs: "0",
    modestbranding: "1",
    rel: "0",
    iv_load_policy: "3",
    cc_load_policy: "0",
    playsinline: "1",
    enablejsapi: "1",
  });
}

/** Chrome-less embed: no related videos, title, or share UI. */
export function parseLessonVideo(url: string): LessonVideo {
  if (isStoredLessonFile(url)) {
    return { kind: "file", src: uploadUrl(url.trim()) };
  }

  const videoId = youtubeIdFromUrl(url);
  const foundrys = foundrysChannelUploads(url);
  if (foundrys) {
    const params = youtubePlayerParams();
    params.set("list", foundrys.list);
    return {
      kind: "youtube",
      id: foundrys.videoId,
      src: `https://www.youtube.com/embed/${foundrys.videoId}?${params.toString()}`,
      poster: `https://i.ytimg.com/vi/${foundrys.videoId}/hqdefault.jpg`,
    };
  }

  const playlistId = youtubePlaylistIdFromUrl(url);
  if (playlistId) {
    const embedId =
      videoId ?? YOUTUBE_PLAYLIST_LEAD_VIDEO[playlistId] ?? "videoseries";
    const params = youtubePlayerParams();
    if (!YOUTUBE_PLAYLISTS_SKIP_LIST_EMBED.has(playlistId)) {
      params.set("list", playlistId);
    }
    return {
      kind: "youtube",
      id: embedId === "videoseries" ? playlistId : embedId,
      src: `https://www.youtube.com/embed/${embedId}?${params.toString()}`,
      poster: `https://i.ytimg.com/vi/${embedId === "videoseries" ? FOUNDRYS_YOUTUBE_FEATURED_VIDEO_ID : embedId}/hqdefault.jpg`,
    };
  }

  if (videoId) {
    return {
      kind: "youtube",
      id: videoId,
      src: `https://www.youtube.com/embed/${videoId}?${youtubePlayerParams().toString()}`,
      poster: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo?.[1]) {
    const vimeoId = vimeo[1];
    return {
      kind: "vimeo",
      id: vimeoId,
      src: `https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=0&controls=0&title=0&byline=0&portrait=0&sidedock=0&dnt=1&api=1`,
    };
  }

  return { kind: "link", href: url };
}

/**
 * Guess activity type from pasted content so YGP/PGP editors only need
 * title + content (YouTube/Vimeo → video, other URL → link, else text).
 */
export function inferLessonContentType(
  raw: string,
): "RICH_TEXT" | "VIDEO_URL" | "EXTERNAL_LINK" {
  const value = raw.trim();
  if (!value || /\s/.test(value)) return "RICH_TEXT";
  if (isStoredLessonFile(value)) return "VIDEO_URL";
  const href = value.startsWith("www.") ? `https://${value}` : value;
  try {
    const url = new URL(href);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "RICH_TEXT";
    }
  } catch {
    return "RICH_TEXT";
  }
  const parsed = parseLessonVideo(href);
  if (parsed.kind === "youtube" || parsed.kind === "vimeo" || parsed.kind === "file") {
    return "VIDEO_URL";
  }
  return "EXTERNAL_LINK";
}

/** YouTube Error 153 if origin/referrer do not match the page that embeds the player. */
export function withYouTubePlayerOrigin(src: string, origin: string) {
  const next = new URL(src);
  next.searchParams.set("origin", origin);
  next.searchParams.set("widget_referrer", origin);
  return next.toString();
}

export function isEmbeddedPlayerEnded(origin: string, raw: unknown) {
  let host = "";
  try {
    host = new URL(origin).hostname;
  } catch {
    return false;
  }

  let data: unknown = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return false;
    }
  }
  if (!data || typeof data !== "object") return false;
  const payload = data as { event?: unknown; info?: unknown };

  if (host.endsWith("youtube-nocookie.com") || host.endsWith("youtube.com")) {
    if (payload.info === 0) return true;
    if (
      payload.info &&
      typeof payload.info === "object" &&
      (payload.info as { playerState?: unknown }).playerState === 0
    ) {
      return true;
    }
    return false;
  }

  if (host === "player.vimeo.com") {
    return payload.event === "finish" || payload.event === "ended";
  }

  return false;
}
