import { BlobServiceClient } from "@azure/storage-blob";
import { randomUUID } from "crypto";
import { getSetting } from "./settings";

const CONTAINER = process.env.AZURE_STORAGE_CONTAINER || "news-media";

async function getConnectionString(): Promise<string | undefined> {
  // Permite configurar pela tela (Setting) ou por variável de ambiente.
  const fromDb = await getSetting("azureStorageConnection" as any).catch(() => undefined);
  return fromDb || process.env.AZURE_STORAGE_CONNECTION_STRING;
}

export async function isBlobConfigured(): Promise<boolean> {
  return Boolean(await getConnectionString());
}

/**
 * Envia um arquivo (imagem/vídeo) para o Azure Blob Storage e retorna a URL
 * pública. O container é criado com acesso público de leitura (blob).
 */
export async function uploadToBlob(
  buffer: Buffer,
  contentType: string,
  originalName?: string
): Promise<string> {
  const conn = await getConnectionString();
  if (!conn) {
    throw new Error(
      "Azure Blob Storage não configurado. Defina AZURE_STORAGE_CONNECTION_STRING."
    );
  }

  const service = BlobServiceClient.fromConnectionString(conn);
  const container = service.getContainerClient(CONTAINER);
  await container.createIfNotExists({ access: "blob" });

  const ext = originalName?.includes(".")
    ? "." + originalName.split(".").pop()!.toLowerCase()
    : "";
  const blobName = `${Date.now()}-${randomUUID()}${ext}`;
  const block = container.getBlockBlobClient(blobName);

  await block.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  return block.url;
}
