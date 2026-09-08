export type LessonVideo =
  | { kind: "youtube"; id: string; src: string; poster: string }
  | { kind: "vimeo"; id: string; src: string }
  | { kind: "link"; href: string };

function youtubeIdFromUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[A-Za-z0-9_-]{6,}$/.test(id) ? id : null;
    }
    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const fromQuery = url.searchParams.get("v");
      if (fromQuery && /^[A-Za-z0-9_-]{6,}$/.test(fromQuery)) return fromQuery;
      const parts = url.pathname.split("/").filter(Boolean);
      if (
        parts[0] === "embed" ||
        parts[0] === "shorts" ||
        parts[0] === "live" ||
        parts[0] === "v"
      ) {
        const id = parts[1];
        return id && /^[A-Za-z0-9_-]{6,}$/.test(id) ? id : null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/** Chrome-less embed: no related videos, title, or share UI. */
export function parseLessonVideo(url: string): LessonVideo {
  const id = youtubeIdFromUrl(url);
  if (id) {
    const params = new URLSearchParams({
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
    return {
      kind: "youtube",
      id,
      // youtube.com (not nocookie) avoids Error 153 on many production hosts.
      src: `https://www.youtube.com/embed/${id}?${params.toString()}`,
      poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
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
