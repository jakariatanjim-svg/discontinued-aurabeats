import { useState } from "react";
import {
  ArrowLeft,
  Clock,
  Heart,
  ListMusic,
  Pencil,
  Play,
  Plus,
  Trash2,
  DownloadCloud,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { formatDurationList, gradientFrom, relativeTime } from "@/utils/format";
import { usePlayer } from "@/hooks/usePlayer";
import { Button, IconButton, Modal, SectionHeader } from "@/components/ui";
import { EmptyState } from "@/components/states";
import { TrackRow } from "@/components/TrackList";
import type { UserPlaylist } from "@/types";
import type { Track } from "@/types";
import type { RouteKey } from "@/routes";

function PlaylistArt({ tracks, name }: { tracks: Track[]; name: string }) {
  const shown = tracks.filter((t) => t.artwork).slice(0, 4);
  if (shown.length >= 4) {
    return (
      <div className="grid h-full w-full grid-cols-2 grid-rows-2 overflow-hidden">
        {shown.map((t) => (
          <img key={t.id} src={t.artwork} alt="" className="h-full w-full object-cover" />
        ))}
      </div>
    );
  }
  if (shown.length > 0) {
    return <img src={shown[0].artwork} alt={name} className="h-full w-full object-cover" />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ backgroundImage: gradientFrom(name) }}>
      <ListMusic className="h-8 w-8 text-white/80" />
    </div>
  );
}

function PlaylistCard({ playlist, onOpen }: { playlist: UserPlaylist; onOpen: () => void }) {
  const { playAll, deletePlaylist, renamePlaylist } = usePlayer();
  return (
    <div className="blur-panel group relative overflow-hidden p-3 transition-transform duration-200 hover:-translate-y-1">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="mb-3 aspect-square w-full overflow-hidden rounded-xl shadow-lg">
          <PlaylistArt tracks={playlist.tracks} name={playlist.name} />
        </div>
        <p className="truncate text-sm font-bold text-ink">{playlist.name}</p>
        <p className="truncate text-[11px] text-ink3">
          {playlist.tracks.length} tracks · {formatDurationList(playlist.tracks)}
        </p>
      </button>
      <div className="mt-2 flex items-center gap-1">
        <button
          type="button"
          onClick={() => playlist.tracks.length > 0 && playAll(playlist.tracks, 0)}
          disabled={playlist.tracks.length === 0}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-accent py-1.5 text-[11px] font-bold text-white transition hover:brightness-110 disabled:opacity-40"
        >
          <Play className="h-3 w-3 fill-current" /> Play
        </button>
        <IconButton
          size="sm"
          aria-label="Rename playlist"
          onClick={() => {
            const next = window.prompt("Rename playlist", playlist.name);
            if (next && next.trim()) renamePlaylist(playlist.id, next.trim());
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton
          size="sm"
          aria-label="Delete playlist"
          onClick={() => {
            if (window.confirm(`Delete "${playlist.name}"?`)) deletePlaylist(playlist.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </IconButton>
      </div>
    </div>
  );
}

export function LibraryView({ onNavigate }: { onNavigate: (r: RouteKey) => void }) {
  const { playlists, favorites, history, createPlaylist } = usePlayer();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");

  return (
    <div className="space-y-8 pb-4">
      <div className="blur-panel flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-ink">Your library</h2>
          <p className="mt-1 text-xs text-ink3">
            {playlists.length} playlists · {favorites.length} favourites · {history.length} in history — all stored
            locally on this device
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New playlist
        </Button>
      </div>

      <section>
        <SectionHeader title="Quick access" subtitle="Auto-curated collections" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CollectionTile
            title="Favourites"
            count={favorites.length}
            icon={<Heart className="h-5 w-5" />}
            tint="bg-rose-500/20 text-rose-400"
            tracks={favorites}
            onOpen={() => onNavigate("favorites")}
          />
          <CollectionTile
            title="Recently played"
            count={history.length}
            icon={<Clock className="h-5 w-5" />}
            tint="bg-accent/20 text-accent"
            tracks={history}
            onOpen={() => onNavigate("history")}
          />
        </div>
      </section>

      <section>
        <SectionHeader
          title="Playlists"
          subtitle="Create, mix and keep them forever"
          icon={<ListMusic className="h-4 w-4 text-accent" />}
        />
        {playlists.length === 0 ? (
          <EmptyState
            title="No playlists yet"
            hint="Create one and drop any track into it from the ••• menu on any row."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" /> Create playlist
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {playlists.map((p) => (
              <PlaylistCard key={p.id} playlist={p} onOpen={() => onNavigate(`playlist:${p.id}`)} />
            ))}
          </div>
        )}
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create a playlist">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            createPlaylist(name.trim());
            setName("");
            setCreateOpen(false);
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Midnight drive"
            className="w-full rounded-xl border border-line bg-ink/5 px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink3 focus:border-accent"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function CollectionTile({
  title,
  count,
  icon,
  tint,
  tracks,
  onOpen,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  tint: string;
  tracks: Track[];
  onOpen: () => void;
}) {
  const { playAll } = usePlayer();
  return (
    <div className="blur-panel flex items-center gap-4 p-4">
      <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", tint)}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{title}</p>
        <p className="truncate text-[11px] text-ink3">
          {count} {count === 1 ? "track" : "tracks"}
        </p>
      </div>
      <div className="flex gap-1.5">
        <IconButton size="sm" aria-label={`Play ${title}`} onClick={() => tracks.length > 0 && playAll(tracks, 0)}>
          <Play className="h-4 w-4 fill-current" />
        </IconButton>
        <button
          type="button"
          onClick={onOpen}
          className="rounded-full border border-line px-3 py-1.5 text-[11px] font-bold text-ink3 transition hover:border-accent hover:text-accent"
        >
          Open
        </button>
      </div>
    </div>
  );
}

export function PlaylistDetailView({ playlistId, onBack }: { playlistId: string; onBack: () => void }) {
  const { playlists, queue, favorites, playAll, removeFromPlaylist, renamePlaylist, deletePlaylist, createPlaylist, addToPlaylist } =
    usePlayer();
  const playlist = playlists.find((p) => p.id === playlistId);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!playlist) {
    return (
      <EmptyState
        title="Playlist not found"
        hint="It may have been deleted."
        action={<Button onClick={onBack}>Back to library</Button>}
      />
    );
  }

  return (
    <div className="space-y-6 pb-4">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-xs font-bold text-ink3 hover:text-accent">
        <ArrowLeft className="h-3.5 w-3.5" /> Your library
      </button>

      <div className="blur-panel flex flex-col gap-5 p-5 sm:flex-row sm:items-end">
        <div className="mx-auto aspect-square w-40 shrink-0 overflow-hidden rounded-2xl shadow-xl sm:mx-0 sm:w-44">
          <PlaylistArt tracks={playlist.tracks} name={playlist.name} />
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-[10px] font-bold tracking-[0.2em] text-ink3 uppercase">Playlist</p>
          <h2 className="mt-1 truncate text-3xl font-black tracking-tight text-ink">{playlist.name}</h2>
          <p className="mt-1 text-xs text-ink3">
            {playlist.tracks.length} tracks · {formatDurationList(playlist.tracks)} · created{" "}
            {relativeTime(playlist.createdAt)}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Button onClick={() => playlist.tracks.length > 0 && playAll(playlist.tracks, 0)} disabled={playlist.tracks.length === 0}>
              <Play className="h-4 w-4 fill-current" /> Play
            </Button>
            <Button variant="outline" onClick={() => setPickerOpen(true)}>
              <Plus className="h-4 w-4" /> Add tracks
            </Button>
            <IconButton
              aria-label="Rename"
              onClick={() => {
                const n = window.prompt("Rename playlist", playlist.name);
                if (n) renamePlaylist(playlist.id, n);
              }}
            >
              <Pencil className="h-4 w-4" />
            </IconButton>
            <IconButton
              aria-label="Delete playlist"
              onClick={() => {
                if (window.confirm(`Delete "${playlist.name}"?`)) {
                  deletePlaylist(playlist.id);
                  onBack();
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      </div>

      {playlist.tracks.length === 0 ? (
        <EmptyState
          title="This playlist is empty"
          hint="Use “Add tracks” to pull in anything currently queued, or the ••• menu on any track elsewhere."
          action={
            <Button onClick={() => setPickerOpen(true)}>
              <Plus className="h-4 w-4" /> Add tracks
            </Button>
          }
        />
      ) : (
        <div className="blur-panel p-2">
          {playlist.tracks.map((t, i) => (
            <TrackRow
              key={t.id}
              track={t}
              context={playlist.tracks}
              index={i}
              onRemove={() => removeFromPlaylist(playlist.id, t.id)}
              removeLabel="Remove from playlist"
            />
          ))}
        </div>
      )}

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Add tracks to this playlist">
        <div className="max-h-[50vh] space-y-1 overflow-y-auto scroll-area pr-1">
          {queue.length > 1 && (
            <button
              type="button"
              onClick={() => {
                addToPlaylist(playlist.id, queue);
                setPickerOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-ink/10"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent">
                <ListMusic className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">Current queue</span>
                <span className="block text-xs text-ink3">{queue.length} tracks</span>
              </span>
            </button>
          )}
          {playlists
            .filter((p) => p.id !== playlist.id && p.tracks.length > 0)
            .map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  addToPlaylist(playlist.id, p.tracks);
                  setPickerOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-ink/10"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink/10 text-ink2">
                  <ListMusic className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{p.name}</span>
                  <span className="block text-xs text-ink3">copy {p.tracks.length} tracks</span>
                </span>
              </button>
            ))}
          {favorites.length > 0 && (
            <button
              type="button"
              onClick={() => {
                addToPlaylist(playlist.id, favorites);
                setPickerOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-ink/10"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
                <Heart className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">All favourites</span>
                <span className="block text-xs text-ink3">copy {favorites.length} tracks</span>
              </span>
            </button>
          )}
          {queue.length <= 1 && playlists.filter((p) => p.id !== playlist.id).length === 0 && favorites.length === 0 && (
            <p className="p-3 text-xs text-ink3">
              Play something first, or use the ••• menu on any track in Discover to send it straight here.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            createPlaylist("New playlist");
            setPickerOpen(false);
          }}
          className="mt-4 w-full rounded-full border border-line py-2 text-xs font-bold text-ink2 transition hover:border-accent hover:text-accent"
        >
          + New playlist instead
        </button>
      </Modal>
    </div>
  );
}

export function FavoritesView() {
  const { favorites, playAll } = usePlayer();
  return (
    <div className="space-y-6 pb-4">
      <div className="blur-panel flex flex-col gap-5 p-5 sm:flex-row sm:items-end">
        <div
          className="mx-auto flex aspect-square w-36 shrink-0 items-center justify-center rounded-2xl shadow-xl sm:mx-0 sm:w-40"
          style={{ backgroundImage: "linear-gradient(135deg, var(--c-accent), var(--c-accent2))" }}
        >
          <Heart className="h-14 w-14 text-white/90 drop-shadow" />
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-[10px] font-bold tracking-[0.2em] text-ink3 uppercase">Collection</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight text-ink">Favourites</h2>
          <p className="mt-1 text-xs text-ink3">
            {favorites.length} {favorites.length === 1 ? "track" : "tracks"} · saved on this device
          </p>
          {favorites.length > 0 && (
            <Button className="mt-4" onClick={() => playAll(favorites, 0)}>
              <Play className="h-4 w-4 fill-current" /> Play all
            </Button>
          )}
        </div>
      </div>

      {favorites.length === 0 ? (
        <EmptyState title="No favourites yet" hint="Tap the heart on any track to keep it here instantly." />
      ) : (
        <div className="blur-panel p-2">
          {favorites.map((t, i) => (
            <TrackRow key={t.id} track={t} context={favorites} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export function HistoryView() {
  const { history, playAll, toast } = usePlayer();
  return (
    <div className="space-y-6 pb-4">
      <SectionHeader
        title="Recently played"
        subtitle={`${history.length} tracks remembered locally`}
        icon={<Clock className="h-4 w-4 text-accent" />}
        action={
          history.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                playAll(history, 0);
                toast("Replaying your history", "success");
              }}
              className="rounded-full border border-line px-3 py-1.5 text-[11px] font-bold text-ink3 transition hover:border-accent hover:text-accent"
            >
              Replay all
            </button>
          ) : undefined
        }
      />
      {history.length === 0 ? (
        <EmptyState title="Nothing played yet" hint="Your listening history appears here automatically." />
      ) : (
        <div className="blur-panel p-2">
          {history.map((t, i) => (
            <TrackRow
              key={t.id}
              track={t}
              context={history}
              index={i}
              meta={relativeTime(t.addedAt)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DownloadsView() {
  const { offlineTracks, removeOffline, playAll } = usePlayer();

  return (
    <div className="space-y-6 pb-4">
      <section className="blur-panel glass-inset rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.05] px-3.5 py-1.5">
          <DownloadCloud className="h-4 w-4 text-accent" />
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink2">Offline Music</span>
        </div>
        <h1 className="mb-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">
          Your Downloads
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-ink2">
          Tracks saved for offline playback. These are stored in your browser's internal database
          and can be played even without an internet connection.
        </p>
        {offlineTracks.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => playAll(offlineTracks, 0)}>
              <Play className="h-4 w-4 fill-current" /> Play all
            </Button>
          </div>
        )}
      </section>

      {offlineTracks.length === 0 ? (
        <EmptyState
          title="No downloads yet"
          hint="Save tracks for offline playback from the '...' menu on any song."
        />
      ) : (
        <div className="blur-panel overflow-hidden p-1.5 sm:p-2.5">
          {offlineTracks.map((t, i) => (
            <TrackRow
              key={t.id}
              track={t}
              context={offlineTracks}
              index={i}
              removeLabel="Remove from downloads"
              onRemove={() => {
                if (window.confirm(`Remove "${t.title}" from offline storage?`)) {
                  removeOffline(t.id);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
