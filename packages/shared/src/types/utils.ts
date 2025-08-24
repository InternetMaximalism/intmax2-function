import { FIRESTORE_DOCUMENT_EVENTS, FIRESTORE_DOCUMENTS } from "../constants";

export type CustomError = {
  code: string;
  message: string;
};

export type AsyncLocalStorageStore = {
  requestId: string;
};

export type Address = string;

export const FIRESTORE_DOCUMENT_TYPES = {
  ...FIRESTORE_DOCUMENTS,
  ...FIRESTORE_DOCUMENT_EVENTS,
};

export type FirestoreDocumentKey =
  (typeof FIRESTORE_DOCUMENT_TYPES)[keyof typeof FIRESTORE_DOCUMENT_TYPES];

export type DiscordMessageType = "INFO" | "WARN" | "FATAL";
