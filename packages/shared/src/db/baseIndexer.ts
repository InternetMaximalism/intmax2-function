import type { DocumentReference, Query } from "@google-cloud/firestore";
import { FIRESTORE_COLLECTIONS, FIRESTORE_MAX_BATCH_SIZE } from "../constants";
import { AppError, ErrorCode, logger } from "../lib";
import type { FirestoreDocumentKey, IndexerFilter, IndexerInfo, IndexerStatus } from "../types";
import { db } from "./firestore";

export class BaseIndexer {
  protected db: FirebaseFirestore.Firestore;
  protected key: FirestoreDocumentKey;
  protected indexerDocRef: DocumentReference;
  // private cache: Map<string, string>;
  // private lastFetchTime: number;
  // private readonly CACHE_EXPIRY = 1000 * 5; // 5 seconds
  protected readonly defaultOrderField = "__name__";
  protected readonly defaultOrderDirection = "asc";

  constructor(doc: FirestoreDocumentKey) {
    this.db = db;
    this.key = doc;
    this.indexerDocRef = db.collection(FIRESTORE_COLLECTIONS.INDEXERS).doc(doc);
    // this.cache = new Map();
    // this.lastFetchTime = 0;
  }

  async upsertIndexersBatch(indexerInfos: IndexerInfo[]) {
    const batch = this.db.batch();
    const now = new Date();

    for (const info of indexerInfos) {
      const addressRef = this.indexerDocRef.collection("addresses").doc(info.address);

      batch.set(
        addressRef,
        {
          ...info,
          updatedAt: now,
        },
        { merge: true },
      );
    }
    try {
      await batch.commit();
      // this.invalidateCache();
    } catch (error) {
      logger.error(
        `Failed to add or update indexers: ${error instanceof Error ? error.message : error}`,
      );
      throw new AppError(500, ErrorCode.INTERNAL_SERVER_ERROR, "Failed to add or update indexers");
    }
  }

  async syncIndexerActiveStates(activeIndexers: string[]) {
    const indexerCollection = this.indexerDocRef.collection("addresses");

    try {
      await this.db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(indexerCollection);
        if (snapshot.empty) {
          logger.info("No indexers found to update active status");
          return;
        }

        snapshot.forEach((doc) => {
          const address = doc.id;
          const isActive = activeIndexers.includes(address);

          transaction.update(doc.ref, {
            active: isActive,
            updatedAt: new Date(),
          });
        });

        logger.info(
          `Updated ${snapshot.size} indexers' active status. Set ${activeIndexers.length} to active.`,
        );
      });

      // this.invalidateCache();
    } catch (error) {
      logger.error(
        `Failed to update indexer active status: ${error instanceof Error ? error.message : error}`,
      );
      throw new AppError(
        500,
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to update indexer active status",
      );
    }
  }

  async updateIndexerStates(indexerStates: IndexerStatus[]) {
    const indexerCollection = this.indexerDocRef.collection("addresses");

    try {
      await this.db.runTransaction(async (transaction) => {
        const addressesToUpdate = indexerStates.map((state) => state.address);

        if (addressesToUpdate.length === 0) {
          logger.info("No indexers to update");
          return;
        }

        const updatePromises = indexerStates.map(async (state) => {
          const docRef = indexerCollection.doc(state.address);
          const docSnapshot = await transaction.get(docRef);

          if (docSnapshot.exists) {
            transaction.update(docRef, {
              active: state.active,
              updatedAt: new Date(),
            });
          } else {
            transaction.set(docRef, {
              active: state.active,
              address: state.address,
              updatedAt: new Date(),
            });
          }
        });

        await Promise.all(updatePromises);

        const activeCount = indexerStates.filter((state) => state.active).length;
        logger.info(
          `Updated ${indexerStates.length} indexers' status. Set ${activeCount} to active.`,
        );
      });

      // this.invalidateCache();
    } catch (error) {
      logger.error(
        `Failed to update indexer states: ${error instanceof Error ? error.message : error}`,
      );
      throw new AppError(500, ErrorCode.INTERNAL_SERVER_ERROR, "Failed to update indexer states");
    }
  }

  async listIndexers(): Promise<IndexerInfo[]> {
    try {
      // const cachedBuilders = this.getCache<IndexerInfo[]>(this.key);
      // if (cachedBuilders) return cachedBuilders;

      const query = this.indexerDocRef.collection("addresses").where("active", "==", true);
      const snapshot = await query.get();
      const indexers = snapshot.docs.map((doc) => {
        const data = doc.data();
        const { updatedAt, active, lastSyncedTime, metadata, ...indexerInfo } = data;
        return indexerInfo as IndexerInfo;
      });
      if (indexers.length === 0) return [];

      // this.setCache(this.key, indexers);

      return indexers;
    } catch (error) {
      logger.error(`Failed to list indexers: ${error instanceof Error ? error.message : error}`);
      throw new AppError(500, ErrorCode.INTERNAL_SERVER_ERROR, "Failed to list indexers");
    }
  }

  private async list(buildQuery?: (query: Query) => Query) {
    try {
      let query: Query = this.indexerDocRef.collection("addresses");

      if (buildQuery) {
        query = buildQuery(query);
      }

      const allItems = [];
      let lastDoc: FirebaseFirestore.DocumentSnapshot | null = null;

      do {
        let batchQuery = query.limit(FIRESTORE_MAX_BATCH_SIZE);
        if (lastDoc) {
          batchQuery = batchQuery.startAfter(lastDoc);
        }

        const snapshot = await batchQuery.get();
        const batchItems = snapshot.docs.map((doc) => {
          return { ...doc.data() } as IndexerInfo;
        });

        allItems.push(...batchItems);
        if (snapshot.size < FIRESTORE_MAX_BATCH_SIZE) {
          lastDoc = null;
        } else {
          lastDoc = snapshot.docs[snapshot.docs.length - 1];
        }
      } while (lastDoc);

      return allItems;
    } catch (error) {
      logger.error(`Failed to list indexers: ${error instanceof Error ? error.message : error}`);
      throw new AppError(
        500,
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to list ${(error as Error).message}`,
      );
    }
  }

  async fetchIndexers(filter?: IndexerFilter) {
    return this.list((query) => {
      let modified = query;
      if (filter?.addresses && filter.addresses.length > 0) {
        modified = modified.where("address", "in", filter.addresses);
      }
      if (filter?.lastSyncedTime) {
        modified = modified.where("lastSyncedTime", ">", filter.lastSyncedTime);
      }
      return modified;
    });
  }

  /*
  private getCache<T>(key: string): T | null {
    const cache = this.cache.get(key);
    if (cache && Date.now() - this.lastFetchTime < this.CACHE_EXPIRY) {
      return JSON.parse(cache) as T;
    }
    return null;
  }

  private setCache(key: string, data: IndexerInfo[]): void {
    this.cache.set(key, JSON.stringify(data));
    this.lastFetchTime = Date.now();
  }

  invalidateCache(): void {
    this.cache.clear();
    this.lastFetchTime = 0;
  }
  */
}
