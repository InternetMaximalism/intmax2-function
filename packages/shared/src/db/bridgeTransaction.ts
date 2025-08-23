import type { CollectionReference, Query } from "@google-cloud/firestore";
import { FIRESTORE_COLLECTIONS, FIRESTORE_MAX_BATCH_SIZE } from "../constants";
import { AppError, ErrorCode, logger } from "../lib";
import {
  type BridgeTransactionData,
  type BridgeTransactionFilter,
  type BridgeTransactionInput,
  BridgeTransactionStatus,
  type BridgeTransactionUpdateInput,
} from "../types";
import { db } from "./firestore";

export class BridgeTransaction {
  private static instance: BridgeTransaction | null = null;
  private readonly db = db;
  private readonly collection: CollectionReference;
  protected readonly defaultOrderField = "__name__";
  protected readonly defaultOrderDirection = "asc";

  constructor() {
    this.collection = db.collection(FIRESTORE_COLLECTIONS.BRIDGE_TRANSACTIONS);
  }

  public static getInstance() {
    if (!BridgeTransaction.instance) {
      BridgeTransaction.instance = new BridgeTransaction();
    }
    return BridgeTransaction.instance;
  }

  async saveBridgeTransactionsBatch(inputs: BridgeTransactionInput[]) {
    const batches = [];
    const now = new Date();

    try {
      for (let i = 0; i < inputs.length; i += FIRESTORE_MAX_BATCH_SIZE) {
        const batch = this.db.batch();
        const batchInputs = inputs.slice(i, i + FIRESTORE_MAX_BATCH_SIZE);

        for (const { guid, ...rest } of batchInputs) {
          const ref = this.collection.doc(guid);

          batch.set(
            ref,
            {
              ...rest,
              status: BridgeTransactionStatus.QUEUED,
              updatedAt: now,
              createdAt: now,
            },
            { merge: false },
          );
        }

        batches.push(batch.commit());
      }

      await Promise.all(batches);

      return {
        count: inputs.length,
      };
    } catch (error) {
      logger.error(error);
      throw new AppError(
        500,
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to save tokenMaps: ${(error as Error).message}`,
      );
    }
  }

  async updateBridgeTransaction(guid: string, updateData: Partial<BridgeTransactionUpdateInput>) {
    const now = new Date();
    try {
      const { guid: _, ...dataToUpdate } = updateData as any;
      const ref = this.collection.doc(guid);

      await ref.update({
        ...dataToUpdate,
        updatedAt: now,
      });

      return {
        guid,
        success: true,
      };
    } catch (error) {
      logger.error(error);
      throw new AppError(
        500,
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to update bridge transaction ${guid}: ${(error as Error).message}`,
      );
    }
  }

  private async list(buildQuery?: (query: Query) => Query) {
    try {
      let query = this.collection.orderBy(
        this.defaultOrderField as string,
        this.defaultOrderDirection,
      );

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
          return { ...doc.data(), guid: doc.id } as BridgeTransactionData;
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
      logger.error(error);
      throw new AppError(
        500,
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to list ${(error as Error).message}`,
      );
    }
  }

  async fetchBridgeTransactions(filter?: BridgeTransactionFilter) {
    return this.list((query) => {
      let modified = query;
      if (filter?.statuses && filter.statuses.length > 0) {
        modified = modified.where("status", "in", filter.statuses);
      }
      return modified;
    });
  }

  async fetchAllBridgeTransactions() {
    return this.list();
  }
}
