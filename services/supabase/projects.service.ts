import { supabase, ensureSupabaseUserId } from './client';
import { supabaseStorage } from './storage.service';
import { Project, ProjectStatus, defaultAdjustments } from '../../types';

const TABLE = 'projects';

// Map the in-app Project to a flat DB row (snake_case columns).
function toRow(p: Project, ownerId: string, urls: { original: string; edited: string | null; thumb: string | null }) {
  return {
    id: p.id,
    user_id: ownerId,
    title: p.title,
    original_image_uri: urls.original,
    edited_image_uri: urls.edited,
    thumbnail_uri: urls.thumb,
    status: p.status,
    is_favorite: p.isFavorite,
    width: p.width,
    height: p.height,
    file_size_bytes: p.fileSizeBytes,
    applied_filter_id: p.appliedFilterId,
    applied_filter_name: p.appliedFilterName,
    adjustments: p.adjustments,
    layers: p.layers,
    tags: p.tags,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

// Map a DB row back into a full Project (filling defaults for local-only fields).
export function rowToProject(r: any): Project {
  return {
    id: r.id,
    userId: r.user_id,
    originalImageUri: r.original_image_uri ?? '',
    editedImageUri: r.edited_image_uri ?? null,
    thumbnailUri: r.thumbnail_uri ?? null,
    title: r.title ?? 'Project',
    layers: r.layers ?? [],
    adjustments: { ...defaultAdjustments, ...(r.adjustments ?? {}) },
    appliedFilterId: r.applied_filter_id ?? null,
    appliedFilterName: r.applied_filter_name ?? null,
    status: (r.status ?? 'draft') as ProjectStatus,
    isFavorite: r.is_favorite ?? false,
    tags: r.tags ?? [],
    width: r.width ?? 0,
    height: r.height ?? 0,
    fileSizeBytes: r.file_size_bytes ?? 0,
    cloudUrl: r.original_image_uri ?? null,
    isSynced: true,
    createdAt: r.created_at ?? new Date().toISOString(),
    updatedAt: r.updated_at ?? new Date().toISOString(),
    exportedAt: null,
  };
}

export const supabaseProjects = {
  /** Upload the project's images to Storage, then insert/update its row. */
  async upsert(project: Project): Promise<void> {
    const ownerId = await ensureSupabaseUserId();
    if (!ownerId) return; // no session (anon sign-in disabled) → skip silently

    const [original, edited, thumb] = await Promise.all([
      supabaseStorage.uploadImageCached(project.originalImageUri, `${project.id}-original`),
      supabaseStorage.uploadImageCached(project.editedImageUri, `${project.id}-edited`),
      supabaseStorage.uploadImageCached(project.thumbnailUri, `${project.id}-thumb`),
    ]);

    const row = toRow(project, ownerId, {
      original: original ?? project.originalImageUri,
      edited: edited ?? project.editedImageUri,
      thumb: thumb ?? project.thumbnailUri,
    });
    const { error } = await supabase.from(TABLE).upsert(row, { onConflict: 'id' });
    if (error) throw error;
  },

  /** Delete a project row (RLS guarantees only the owner's row is affected). */
  async remove(id: string): Promise<void> {
    const ownerId = await ensureSupabaseUserId();
    if (!ownerId) return;
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  },

  /** Fetch the current user's projects, newest first, mapped to Project[]. */
  async listMine(): Promise<Project[]> {
    const ownerId = await ensureSupabaseUserId();
    if (!ownerId) return [];
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToProject);
  },
};
