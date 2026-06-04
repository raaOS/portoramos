import { compareAndSetD1Value, getD1Value } from '@/lib/cloudflareD1';
import { getExplorerFileDisplayName } from '@/lib/utils/explorerName';
import { explorerService } from '@/lib/services/explorerService';
import type { AnyExplorerNode, ExplorerFile, ExplorerFolder } from '@/types/explorer';
import type {
  EventPage,
  EventPageAsset,
  EventPageInput,
  EventPageSection,
  ResolvedEventPage,
} from '@/types/event-page';
import { v4 as uuidv4 } from 'uuid';

const EVENT_PAGES_KEY = 'eventPages';
const MAX_D1_WRITE_RETRIES = 8;

type EventPageMap = Record<string, EventPage>;
type EventPagesRoot = {
  pages?: EventPageMap;
  [key: string]: unknown;
};

type EventPageMutation<T> = {
  pages: EventPageMap;
  result: T;
};

let eventPageMutationChain: Promise<void> = Promise.resolve();

function clonePages(pages: EventPageMap): EventPageMap {
  return JSON.parse(JSON.stringify(pages)) as EventPageMap;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runEventPageMutation<T>(operation: () => Promise<T>): Promise<T> {
  const run = eventPageMutationChain.then(operation, operation);
  eventPageMutationChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function readEventPagesRoot() {
  return await getD1Value<EventPagesRoot>(EVENT_PAGES_KEY);
}

async function mutateEventPages<T>(
  mutator: (pages: EventPageMap) => EventPageMutation<T> | Promise<EventPageMutation<T>>
) {
  return runEventPageMutation(async () => {
    for (let attempt = 0; attempt < MAX_D1_WRITE_RETRIES; attempt++) {
      const currentRoot = await readEventPagesRoot();
      const currentPages = clonePages(currentRoot?.pages || {});
      const mutation = await mutator(currentPages);
      const nextRoot: EventPagesRoot = {
        ...(currentRoot || {}),
        pages: mutation.pages,
      };

      if (await compareAndSetD1Value(EVENT_PAGES_KEY, currentRoot, nextRoot)) {
        return mutation.result;
      }

      await sleep(20 * (attempt + 1));
    }

    throw new Error('Event page data changed too quickly; please retry');
  });
}

function cleanText(value?: string | null) {
  return (value || '').trim().replace(/\s+/g, ' ');
}

function cleanMultiline(value?: string | null) {
  return (value || '').trim();
}

function cleanFileIds(ids?: string[] | null) {
  return Array.from(new Set((ids || []).filter((id) => typeof id === 'string' && id.trim())));
}

function cleanSections(sections?: EventPageSection[] | null): EventPageSection[] {
  return (sections || [])
    .map((section) => ({
      id: section.id || uuidv4(),
      title: cleanText(section.title),
      body: cleanMultiline(section.body),
      imageFileIds: cleanFileIds(section.imageFileIds),
    }))
    .filter((section) => section.title || section.body || section.imageFileIds.length > 0);
}

function normalizeInput(input: EventPageInput, existing?: EventPage): EventPage {
  const now = new Date().toISOString();
  const title = cleanText(input.title);
  const folderId = cleanText(input.folderId);
  const description = cleanMultiline(input.description);

  if (!title) throw new Error('Title is required');
  if (!folderId) throw new Error('Folder is required');
  if (!description) throw new Error('Description is required');

  const rawColor = cleanText(input.headerColor);
  const headerColor = /^#[0-9a-fA-F]{6}$/.test(rawColor) ? rawColor : undefined;

  return {
    id: existing?.id || input.id || uuidv4(),
    folderId,
    title,
    subtitle: cleanText(input.subtitle),
    role: cleanText(input.role),
    description,
    status: input.status === 'draft' ? 'draft' : 'published',
    coverFileId: cleanText(input.coverFileId),
    headerColor,
    galleryFileIds: cleanFileIds(input.galleryFileIds),
    sections: cleanSections(input.sections),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

function toEventPageAsset(file: ExplorerFile): EventPageAsset {
  return {
    id: file.id,
    name: getExplorerFileDisplayName(file),
    fileType: file.fileType,
    url: file.url,
    previewUrl: file.previewUrl,
    thumbnailUrl: file.thumbnailUrl,
    storageKey: file.storageKey,
    size: file.size,
    updatedAt: file.updatedAt,
  };
}

function resolveAssets(page: EventPage, nodes: AnyExplorerNode[]): ResolvedEventPage {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const folder = nodeById.get(page.folderId);
  const missingFileIds = new Set<string>();

  const resolveFile = (fileId?: string) => {
    if (!fileId) return undefined;
    const node = nodeById.get(fileId);
    if (!node || node.type !== 'file') {
      missingFileIds.add(fileId);
      return undefined;
    }
    return toEventPageAsset(node);
  };

  const galleryFiles = page.galleryFileIds
    .map((fileId) => resolveFile(fileId))
    .filter((file): file is EventPageAsset => Boolean(file));

  const sectionFiles = page.sections.reduce<Record<string, EventPageAsset[]>>((acc, section) => {
    acc[section.id] = section.imageFileIds
      .map((fileId) => resolveFile(fileId))
      .filter((file): file is EventPageAsset => Boolean(file));
    return acc;
  }, {});

  return {
    ...page,
    folderName: folder?.type === 'folder' ? (folder as ExplorerFolder).name : undefined,
    coverFile: resolveFile(page.coverFileId),
    galleryFiles,
    sectionFiles,
    missingFileIds: Array.from(missingFileIds),
  };
}

export const eventPageService = {
  async getAllPages(): Promise<EventPage[]> {
    try {
      const root = await readEventPagesRoot();
      return Object.values(root?.pages || {}).sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt)
      );
    } catch (error) {
      console.error('[EventPageService] Failed to get pages:', error);
      return [];
    }
  },

  async getPageById(id: string): Promise<EventPage | null> {
    const root = await readEventPagesRoot();
    return root?.pages?.[id] || null;
  },

  async getPageByFolderId(folderId: string, includeDraft = false): Promise<EventPage | null> {
    const pages = await this.getAllPages();
    return (
      pages.find(
        (page) => page.folderId === folderId && (includeDraft || page.status === 'published')
      ) || null
    );
  },

  async getResolvedPageByFolderId(
    folderId: string,
    includeDraft = false
  ): Promise<ResolvedEventPage | null> {
    const page = await this.getPageByFolderId(folderId, includeDraft);
    if (!page) return null;
    return this.resolvePage(page);
  },

  async resolvePage(page: EventPage): Promise<ResolvedEventPage> {
    const nodes = await explorerService.getAllNodes();
    return resolveAssets(page, nodes);
  },

  async resolvePages(pages: EventPage[]): Promise<ResolvedEventPage[]> {
    const nodes = await explorerService.getAllNodes();
    return pages.map((page) => resolveAssets(page, nodes));
  },

  async upsertPage(input: EventPageInput): Promise<{ page: EventPage; isNew: boolean }> {
    return mutateEventPages((pages) => {
      const existingById = input.id ? pages[input.id] : undefined;
      const existingByFolder = Object.values(pages).find((page) => page.folderId === input.folderId);

      // Reject create (no id) when folder already has a page
      if (!input.id && existingByFolder) {
        throw new Error('This folder already has an event page');
      }

      if (existingByFolder && existingById && existingByFolder.id !== existingById.id) {
        throw new Error('This folder already has an event page');
      }

      const existing = existingById || existingByFolder;
      const page = normalizeInput(input, existing);
      pages[page.id] = page;
      return { pages, result: { page, isNew: !existing } };
    });
  },

  async deletePage(id: string): Promise<EventPage> {
    return mutateEventPages((pages) => {
      const existing = pages[id];
      if (!existing) {
        throw new Error('Event page not found');
      }

      delete pages[id];
      return { pages, result: existing };
    });
  },

  async pruneDeletedExplorerReferences(deletedNodeIds: string[]): Promise<{
    deletedPageIds: string[];
    updatedPageIds: string[];
  }> {
    const deletedIds = new Set(deletedNodeIds);
    if (deletedIds.size === 0) {
      return { deletedPageIds: [], updatedPageIds: [] };
    }

    return mutateEventPages((pages) => {
      const deletedPageIds: string[] = [];
      const updatedPageIds: string[] = [];

      for (const page of Object.values(pages)) {
        if (deletedIds.has(page.folderId)) {
          delete pages[page.id];
          deletedPageIds.push(page.id);
          continue;
        }

        const nextGalleryFileIds = page.galleryFileIds.filter((fileId) => !deletedIds.has(fileId));
        const nextSections = page.sections.map((section) => ({
          ...section,
          imageFileIds: section.imageFileIds.filter((fileId) => !deletedIds.has(fileId)),
        }));
        const nextCoverFileId =
          page.coverFileId && deletedIds.has(page.coverFileId) ? '' : page.coverFileId;

        const changed =
          nextCoverFileId !== page.coverFileId ||
          nextGalleryFileIds.length !== page.galleryFileIds.length ||
          nextSections.some(
            (section, index) => section.imageFileIds.length !== page.sections[index].imageFileIds.length
          );

        if (changed) {
          pages[page.id] = {
            ...page,
            coverFileId: nextCoverFileId,
            galleryFileIds: nextGalleryFileIds,
            sections: nextSections,
            updatedAt: new Date().toISOString(),
          };
          updatedPageIds.push(page.id);
        }
      }

      return {
        pages,
        result: {
          deletedPageIds,
          updatedPageIds,
        },
      };
    });
  },
};
