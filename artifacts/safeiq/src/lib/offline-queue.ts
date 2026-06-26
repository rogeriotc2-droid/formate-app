import { createSubmission, getTemplate, updateTemplate } from "@workspace/api-client-react";

const QUEUE_KEY = "formate:offline-submissions";
const QUEUE_EVENT = "formate:queue-changed";

export interface QueuedCustomField {
  key: string;
  label: string;
  type: string;
  sticky?: boolean;
  required?: boolean;
}

export interface QueuedSubmission {
  id: string;
  queuedAt: string;
  templateName: string;
  siteName: string;
  customFields?: QueuedCustomField[];
  payload: {
    templateId: number;
    siteId: number;
    submittedBy: string;
    status: "submitted";
    values: Record<string, string>;
    notes?: string;
    latitude?: number;
    longitude?: number;
    clientTimestamp?: string;
  };
}

export function getQueue(): QueuedSubmission[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function enqueueSubmission(
  payload: QueuedSubmission["payload"],
  meta: { templateName: string; siteName: string; customFields?: QueuedCustomField[] },
): void {
  const item: QueuedSubmission = {
    id: crypto.randomUUID(),
    queuedAt: new Date().toISOString(),
    templateName: meta.templateName,
    siteName: meta.siteName,
    customFields: meta.customFields?.length ? meta.customFields : undefined,
    payload,
  };
  const queue = getQueue();
  queue.push(item);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent(QUEUE_EVENT));
}

function removeFromQueue(id: string): void {
  const queue = getQueue().filter((item) => item.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent(QUEUE_EVENT));
}

export async function drainQueue(): Promise<number> {
  const queue = getQueue();
  if (queue.length === 0) return 0;
  let drained = 0;
  for (const item of queue) {
    try {
      if (item.customFields?.length) {
        const template = await getTemplate(item.payload.templateId);
        const existing = (template.fields as QueuedCustomField[] | undefined) ?? [];
        const existingKeys = new Set(existing.map((f) => f.key));
        const toAdd = item.customFields.filter((f) => !existingKeys.has(f.key));
        if (toAdd.length > 0) {
          await updateTemplate(item.payload.templateId, {
            fields: [...existing, ...toAdd] as never,
          });
        }
      }
      await createSubmission(item.payload);
      removeFromQueue(item.id);
      drained++;
    } catch {
      break;
    }
  }
  return drained;
}
