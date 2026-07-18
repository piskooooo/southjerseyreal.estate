import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Plus,
  RotateCcw,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import {
  managedContentSeeds,
  validateManagedContentForPublish,
  type ManagedContent,
  type ManagedContentRecord,
} from "../content/siteEditor";
import {
  publishSitePage,
  removeSiteContentImages,
  revertSiteDraft,
  saveSiteDraft,
  SITE_CONTENT_IMAGE_ACCEPT,
  uploadSiteContentImage,
} from "./siteContentStore";
import { requestSiteRebuild } from "./siteRebuildStore";

const multilineKeys = new Set([
  "bio",
  "body",
  "bottomline",
  "copy",
  "description",
  "introduction",
  "intro",
  "message",
  "note",
  "paragraph",
  "primary",
  "quote",
  "secondary",
  "summary",
  "supporttext",
  "takeaway",
  "text",
]);

const blockTags = ["H1", "H2", "H3", "H4", "P", "A", "BUTTON", "LABEL"];

function fieldLabel(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function pageLabel(pageKey: string) {
  if (pageKey === "__sitewide__") return "Sitewide content";
  if (pageKey === "/") return "Home";
  return pageKey
    .replace(/^\//, "")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isInternalField(key: string, path: Array<string | number>) {
  return ["id", "kind", "storagePath", "thumbnail", "thumbnailPath"].includes(key)
    || key === "path"
    || (key === "title" && path.join(".") === "page");
}

function shouldUseTextarea(key: string, value: string) {
  const normalized = key.toLowerCase();
  return value.length > 120 || [...multilineKeys].some((name) => (
    normalized === name || normalized.endsWith(name)
  ));
}

function updateAtPath(value: unknown, path: Array<string | number>, nextValue: unknown): unknown {
  if (!path.length) return nextValue;
  const [key, ...rest] = path;
  if (Array.isArray(value)) {
    const clone = [...value];
    const index = Number(key);
    clone[index] = updateAtPath(value[index], rest, nextValue);
    return clone;
  }
  const current = isObject(value) ? value[String(key)] : undefined;
  return {
    ...(isObject(value) ? value : {}),
    [String(key)]: updateAtPath(current, rest, nextValue),
  };
}

function templateAtPath(value: unknown, path: Array<string | number>) {
  return path.reduce<unknown>((current, key) => {
    if (Array.isArray(current)) {
      const requested = current[Number(key)];
      return requested === undefined ? current[0] : requested;
    }
    return isObject(current) ? current[String(key)] : undefined;
  }, value);
}

const emptyImageTemplate = {
  src: "",
  alt: "",
  storagePath: "",
  thumbnail: "",
  thumbnailPath: "",
};

function collectImagePaths(value: unknown, paths = new Set<string>()) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectImagePaths(item, paths));
    return paths;
  }
  if (!isObject(value)) return paths;
  Object.entries(value).forEach(([key, child]) => {
    if (["storagePath", "thumbnailPath"].includes(key) && typeof child === "string" && child) {
      paths.add(child);
    } else {
      collectImagePaths(child, paths);
    }
  });
  return paths;
}

function pathsNoLongerReferenced(candidates: Set<string>, ...values: unknown[]) {
  const referenced = new Set<string>();
  values.forEach((value) => collectImagePaths(value, referenced));
  return [...candidates].filter((path) => !referenced.has(path));
}

function blankLike(value: unknown, key = ""): unknown {
  if (key === "id") return `item-${crypto.randomUUID()}`;
  if (key === "tag") return "P";
  if (typeof value === "string") return "";
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  if (Array.isArray(value)) return [];
  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, child]) => [childKey, blankLike(child, childKey)]),
    );
  }
  return "";
}

function itemName(item: unknown, index: number, fallback: string) {
  if (!isObject(item)) return `${fallback} ${index + 1}`;
  for (const key of ["heading", "title", "name", "label", "text"]) {
    if (typeof item[key] === "string" && item[key]) return String(item[key]);
  }
  if (Array.isArray(item.blocks)) {
    const first = item.blocks.find((block) => isObject(block) && typeof block.text === "string");
    if (isObject(first)) return String(first.text);
  }
  return `${fallback} ${index + 1}`;
}

function replaceRecord(
  onChange: Dispatch<SetStateAction<ManagedContentRecord[]>>,
  next: ManagedContentRecord,
) {
  onChange((current) => current.map((record) => (
    record.pageKey === next.pageKey ? next : record
  )));
}

function PrimitiveField({
  fieldKey,
  value,
  path,
  disabled,
  onUpdate,
}: {
  fieldKey: string;
  value: unknown;
  path: Array<string | number>;
  disabled: boolean;
  onUpdate: (path: Array<string | number>, value: unknown) => void;
}) {
  const id = `site-content-${path.join("-")}`;
  const label = fieldLabel(fieldKey);

  if (fieldKey === "tag" && typeof value === "string") {
    return (
      <label htmlFor={id}>
        Content type
        <select id={id} value={value} onChange={(event) => onUpdate(path, event.target.value)} disabled={disabled}>
          {blockTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
        </select>
      </label>
    );
  }

  if (typeof value === "boolean") {
    return (
      <label className="admin-document-checkbox" htmlFor={id}>
        <input id={id} type="checkbox" checked={value} onChange={(event) => onUpdate(path, event.target.checked)} disabled={disabled} />
        <span>{label}</span>
      </label>
    );
  }

  if (typeof value === "number") {
    return (
      <label htmlFor={id}>
        {label}
        <input id={id} type="number" value={value} onChange={(event) => onUpdate(path, Number(event.target.value))} disabled={disabled} />
      </label>
    );
  }

  const text = value == null ? "" : String(value);
  if (shouldUseTextarea(fieldKey, text)) {
    return (
      <label className="full" htmlFor={id}>
        {label}
        <textarea id={id} rows={Math.min(12, Math.max(4, Math.ceil(text.length / 90)))} value={text} onChange={(event) => onUpdate(path, event.target.value)} disabled={disabled} />
      </label>
    );
  }

  return (
    <label className={fieldKey.toLowerCase().includes("href") || fieldKey.toLowerCase().includes("url") ? "full" : "wide"} htmlFor={id}>
      {label}
      <input id={id} type="text" value={text} onChange={(event) => onUpdate(path, event.target.value)} disabled={disabled} />
    </label>
  );
}

function ImageField({
  objectValue,
  objectPath,
  disabled,
  onUpload,
  onRemove,
}: {
  objectValue: Record<string, unknown>;
  objectPath: Array<string | number>;
  disabled: boolean;
  onUpload: (path: Array<string | number>, value: Record<string, unknown>, file?: File) => Promise<void>;
  onRemove: (path: Array<string | number>, value: Record<string, unknown>) => Promise<void>;
}) {
  const id = `site-image-${objectPath.join("-")}`;
  const src = String(objectValue.src || "");
  const preview = String(objectValue.thumbnail || src);
  return (
    <section className="admin-document-image">
      <div>
        <h3>Image</h3>
        <p>JPG, PNG, WebP, or AVIF. Public and lightweight editor copies are created automatically.</p>
      </div>
      {preview
        ? <img src={preview} alt="" decoding="async" />
        : <div className="admin-document-image-empty"><ImagePlus /><span>No image added</span></div>}
      <div className="admin-document-image-actions">
        <label className={`admin-upload ${disabled ? "disabled" : ""}`} htmlFor={id}>
          <ImagePlus size={16} /> {src ? "Replace image" : "Upload image"}
          <input
            id={id}
            type="file"
            accept={SITE_CONTENT_IMAGE_ACCEPT}
            disabled={disabled}
            onChange={async (event) => {
              const input = event.currentTarget;
              await onUpload(objectPath, objectValue, input.files?.[0]);
              input.value = "";
            }}
          />
        </label>
        {src ? <button type="button" onClick={() => onRemove(objectPath, objectValue)} disabled={disabled}><Trash2 size={15} /> Remove</button> : null}
      </div>
    </section>
  );
}

type RecursiveProps = {
  value: unknown;
  path: Array<string | number>;
  disabled: boolean;
  onUpdate: (path: Array<string | number>, value: unknown) => void;
  onImageUpload: (path: Array<string | number>, value: Record<string, unknown>, file?: File) => Promise<void>;
  onImageRemove: (path: Array<string | number>, value: Record<string, unknown>) => Promise<void>;
  templateRoot: ManagedContent;
  depth?: number;
};

function ArrayField({
  fieldKey,
  value,
  path,
  disabled,
  onUpdate,
  onImageUpload,
  onImageRemove,
  templateRoot,
  depth = 0,
}: Omit<RecursiveProps, "value"> & { fieldKey: string; value: unknown[] }) {
  const fixedSectionTopology = path.join(".") === "page.sections";
  const templateValue = templateAtPath(templateRoot, path);
  const template = value[0]
    ?? (Array.isArray(templateValue) ? templateValue[0] : undefined)
    ?? (fieldKey === "images" ? emptyImageTemplate : undefined);
  const addItem = () => {
    onUpdate(path, [...value, template === undefined ? "" : blankLike(template)]);
  };
  const removeItem = (index: number) => {
    onUpdate(path, value.filter((_, itemIndex) => itemIndex !== index));
  };
  const moveItem = (index: number, direction: number) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onUpdate(path, next);
  };

  return (
    <section className="admin-document-array">
      <div className="admin-document-section-heading">
        <div>
          <h3>{fieldLabel(fieldKey)}</h3>
          <p>{value.length} {value.length === 1 ? "item" : "items"}. {fixedSectionTopology ? "The page layout order is fixed." : "Use the arrows to change the public order."}</p>
        </div>
        {!fixedSectionTopology && template !== undefined ? (
          <button type="button" onClick={addItem} disabled={disabled || value.length >= 100}><Plus size={15} /> Add</button>
        ) : null}
      </div>
      <div className="admin-document-array-list">
        {value.map((item, index) => (
          <div className="admin-document-array-item" key={`${path.join("-")}-${index}`}>
            <div className="admin-document-array-item-head">
              <strong>{itemName(item, index, fieldLabel(fieldKey))}</strong>
              <div role="group" aria-label={`Reorder ${fieldLabel(fieldKey)} item ${index + 1}`}>
                <button type="button" onClick={() => moveItem(index, -1)} disabled={disabled || fixedSectionTopology || index === 0} aria-label="Move item up"><ChevronUp size={16} /></button>
                <button type="button" onClick={() => moveItem(index, 1)} disabled={disabled || fixedSectionTopology || index === value.length - 1} aria-label="Move item down"><ChevronDown size={16} /></button>
                {!fixedSectionTopology ? <button type="button" onClick={() => removeItem(index)} disabled={disabled} aria-label="Remove item"><Trash2 size={15} /></button> : null}
              </div>
            </div>
            {Array.isArray(item) ? (
              <ArrayField fieldKey={`${fieldKey} item`} value={item} path={[...path, index]} disabled={disabled} onUpdate={onUpdate} onImageUpload={onImageUpload} onImageRemove={onImageRemove} templateRoot={templateRoot} depth={depth + 1} />
            ) : isObject(item) ? (
              <ObjectFields value={item} path={[...path, index]} disabled={disabled} onUpdate={onUpdate} onImageUpload={onImageUpload} onImageRemove={onImageRemove} templateRoot={templateRoot} depth={depth + 1} />
            ) : (
              <PrimitiveField fieldKey={`${fieldKey} item`} value={item} path={[...path, index]} disabled={disabled} onUpdate={onUpdate} />
            )}
          </div>
        ))}
        {!value.length ? <p className="admin-document-empty">No items added.</p> : null}
      </div>
    </section>
  );
}

function ObjectFields({
  value,
  path,
  disabled,
  onUpdate,
  onImageUpload,
  onImageRemove,
  templateRoot,
  depth = 0,
}: RecursiveProps) {
  if (!isObject(value)) return null;
  return (
    <div className={`admin-document-fields depth-${Math.min(depth, 3)}`}>
      {Object.entries(value).map(([key, child]) => {
        if (isInternalField(key, path)) return null;
        const childPath = [...path, key];
        if (key === "src" && typeof child === "string") {
          return <ImageField key={key} objectValue={value} objectPath={path} disabled={disabled} onUpload={onImageUpload} onRemove={onImageRemove} />;
        }
        if (Array.isArray(child)) {
          return <ArrayField key={key} fieldKey={key} value={child} path={childPath} disabled={disabled} onUpdate={onUpdate} onImageUpload={onImageUpload} onImageRemove={onImageRemove} templateRoot={templateRoot} depth={depth} />;
        }
        if (isObject(child)) {
          return (
            <section className="admin-document-object" key={key}>
              <div className="admin-document-section-heading"><div><h3>{fieldLabel(key)}</h3></div></div>
              <ObjectFields value={child} path={childPath} disabled={disabled} onUpdate={onUpdate} onImageUpload={onImageUpload} onImageRemove={onImageRemove} templateRoot={templateRoot} depth={depth + 1} />
            </section>
          );
        }
        return <PrimitiveField key={key} fieldKey={key} value={child} path={childPath} disabled={disabled} onUpdate={onUpdate} />;
      })}
    </div>
  );
}

export function PageDocumentEditor({
  record,
  onChange,
  setNotice,
  onBusyChange,
}: {
  record: ManagedContentRecord;
  onChange: Dispatch<SetStateAction<ManagedContentRecord[]>>;
  setNotice: Dispatch<SetStateAction<string>>;
  onBusyChange: (busy: boolean) => void;
}) {
  const [busy, setBusyState] = useState(false);
  const busyRef = useRef(false);
  const draftJson = useMemo(() => JSON.stringify(record.draft), [record.draft]);
  const savedJson = useMemo(() => JSON.stringify(record.savedDraft), [record.savedDraft]);
  const publishedJson = useMemo(() => JSON.stringify(record.published), [record.published]);
  const dirty = draftJson !== savedJson;
  const unpublished = draftJson !== publishedJson;
  const template = managedContentSeeds.get(record.pageKey) as ManagedContent;

  useEffect(() => () => {
    if (busyRef.current) onBusyChange(false);
  }, [onBusyChange]);

  const setBusy = (next: boolean) => {
    busyRef.current = next;
    setBusyState(next);
    onBusyChange(next);
  };

  const cleanupUnusedImages = async (paths: string[]) => {
    if (!paths.length) return;
    try {
      await removeSiteContentImages(paths);
    } catch {
      setNotice((current) => `${current} The content change succeeded, but an unused image file could not be cleaned up automatically.`);
    }
  };

  const update = (path: Array<string | number>, nextValue: unknown) => {
    onChange((current) => current.map((item) => item.pageKey === record.pageKey
      ? { ...item, draft: updateAtPath(item.draft, path, nextValue) as ManagedContent }
      : item));
  };

  const uploadPageImage = async (
    objectPath: Array<string | number>,
    objectValue: Record<string, unknown>,
    file?: File,
  ) => {
    if (busyRef.current || !file) return;
    let uploaded: Awaited<ReturnType<typeof uploadSiteContentImage>> | undefined;
    let saved = false;
    setBusy(true);
    setNotice("Preparing page image upload...");
    try {
      uploaded = await uploadSiteContentImage(record.pageKey, file, objectPath.join("-"));
      const nextObject = { ...objectValue, ...uploaded };
      const nextDraft = updateAtPath(record.draft, objectPath, nextObject) as ManagedContent;
      const nextRecord = await saveSiteDraft(
        record.pageKey,
        nextDraft,
        record.updatedAt,
        record.exists,
      );
      saved = true;
      replaceRecord(onChange, nextRecord);
      setNotice("Image uploaded and the private draft was saved. Publish when the page is ready.");
      const oldPaths = collectImagePaths(objectValue);
      const cleanup = pathsNoLongerReferenced(oldPaths, nextRecord.draft, nextRecord.published);
      await cleanupUnusedImages(cleanup);
    } catch (error) {
      if (uploaded && !saved) {
        await removeSiteContentImages([uploaded.storagePath, uploaded.thumbnailPath]).catch(() => undefined);
      }
      setNotice(error instanceof Error ? error.message : "The image could not be uploaded.");
    } finally {
      setBusy(false);
    }
  };

  const removePageImage = async (
    objectPath: Array<string | number>,
    objectValue: Record<string, unknown>,
  ) => {
    if (busyRef.current) return;
    if (!window.confirm("Remove this image from the page draft?")) return;
    const nextObject = {
      ...objectValue,
      src: "",
      storagePath: "",
      thumbnail: "",
      thumbnailPath: "",
    };
    setBusy(true);
    setNotice("Removing page image...");
    try {
      const nextDraft = updateAtPath(record.draft, objectPath, nextObject) as ManagedContent;
      const nextRecord = await saveSiteDraft(record.pageKey, nextDraft, record.updatedAt, record.exists);
      replaceRecord(onChange, nextRecord);
      setNotice("Image removed from the draft. Publish to update the public page.");
      const oldPaths = collectImagePaths(objectValue);
      const cleanup = pathsNoLongerReferenced(oldPaths, nextRecord.draft, nextRecord.published);
      await cleanupUnusedImages(cleanup);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The image could not be removed.");
    } finally {
      setBusy(false);
    }
  };

  const saveDraft = async () => {
    if (busyRef.current) return null;
    setBusy(true);
    setNotice("Saving page draft...");
    try {
      const previousPaths = collectImagePaths(record.savedDraft);
      const next = await saveSiteDraft(record.pageKey, record.draft, record.updatedAt, record.exists);
      replaceRecord(onChange, next);
      setNotice(`${pageLabel(record.pageKey)} draft saved. Public visitors cannot see these changes yet.`);
      const cleanup = pathsNoLongerReferenced(previousPaths, next.draft, next.published);
      await cleanupUnusedImages(cleanup);
      return next;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The draft could not be saved.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (busyRef.current) return;
    try {
      validateManagedContentForPublish(record.pageKey, record.draft);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Check the page links and image descriptions before publishing.");
      return;
    }
    setBusy(true);
    setNotice("Publishing website changes...");
    try {
      const cleanupCandidates = collectImagePaths(record.published);
      let saved = record;
      if (dirty || !record.exists) {
        saved = await saveSiteDraft(record.pageKey, record.draft, record.updatedAt, record.exists);
        replaceRecord(onChange, saved);
      }
      const next = await publishSitePage(record.pageKey, saved.updatedAt);
      replaceRecord(onChange, next);
      setNotice(`${pageLabel(record.pageKey)} changes are published. The crawler metadata rebuild has been queued.`);
      requestSiteRebuild().catch((error: Error) => {
        setNotice((current) => `${current} ${error.message}`);
      });
      const cleanup = pathsNoLongerReferenced(cleanupCandidates, next.draft, next.published);
      await cleanupUnusedImages(cleanup);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The page could not be published.");
    } finally {
      setBusy(false);
    }
  };

  const revert = async () => {
    if (busyRef.current) return;
    if (!window.confirm(`Discard all unpublished changes to ${pageLabel(record.pageKey)}?`)) return;
    setBusy(true);
    setNotice("Discarding unpublished changes...");
    try {
      const cleanupCandidates = collectImagePaths(record.draft);
      const next = await revertSiteDraft(record.pageKey, record.updatedAt);
      replaceRecord(onChange, next);
      setNotice(`${pageLabel(record.pageKey)} was reset to its current published version.`);
      const cleanup = pathsNoLongerReferenced(cleanupCandidates, next.draft, next.published);
      await cleanupUnusedImages(cleanup);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The draft could not be reset.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-editor admin-document-editor">
      <div className="admin-editor-title">
        <div><p>Editing page content</p><h2>{pageLabel(record.pageKey)}</h2></div>
        <span className={`admin-visibility-status ${dirty || unpublished ? "is-draft" : "is-published"}`}>
          {dirty ? "Unsaved changes" : unpublished ? "Saved draft — not published" : "Published"}
        </span>
      </div>
      <p className="admin-document-help">Save keeps a private draft. Publish makes the current draft visible and queues an SEO rebuild.</p>
      <ObjectFields value={record.draft} path={[]} disabled={busy} onUpdate={update} onImageUpload={uploadPageImage} onImageRemove={removePageImage} templateRoot={template} />
      <footer className="admin-actions">
        <button type="button" className="danger" onClick={revert} disabled={busy || (!dirty && !unpublished)}><RotateCcw size={17} /> Discard unpublished changes</button>
        <div className="admin-save-actions">
          <button type="button" className="draft" onClick={saveDraft} disabled={busy || !dirty}><Save size={17} /> {busy ? "Working..." : "Save draft"}</button>
          <button type="button" className="save" onClick={publish} disabled={busy || (!dirty && !unpublished && record.exists)}><Send size={17} /> {busy ? "Working..." : "Publish page"}</button>
        </div>
      </footer>
    </section>
  );
}
