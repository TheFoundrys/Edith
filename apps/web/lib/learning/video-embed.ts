export type LessonVideo =
  | { kind: "youtube"; id: string; src: string; poster: string }
  | { kind: "vimeo"; id: string; src: string }
  | { kind: "link"; href: string };

/** Chrome-less embed: no controls, related videos, title, or share UI. */
export function parseLessonVideo(url: string): LessonVideo {
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  if (yt?.[1]) {
    const id = yt[1];
    const params = new URLSearchParams({
      autoplay: "1",
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
      src: `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`,
      poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo?.[1]) {
    const id = vimeo[1];
    return {
      kind: "vimeo",
      id,
      src: `https://player.vimeo.com/video/${id}?autoplay=1&controls=0&title=0&byline=0&portrait=0&sidedock=0&dnt=1&api=1`,
    };
  }

  return { kind: "link", href: url };
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
