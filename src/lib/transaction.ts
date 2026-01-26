/**
 * Transaction Utility for Rollback Support
 * Tracks operations and provides rollback capability
 */

export interface Operation {
    type: 'file_create' | 'file_delete' | 'file_move' | 'data_update' | 'github_commit';
    description: string;
    rollback: () => Promise<void>;
    metadata?: Record<string, any>;
}

export class Transaction {
    private operations: Operation[] = [];
    private committed = false;
    private rolledBack = false;

    /**
     * Add an operation to the transaction
     */
    addOperation(operation: Operation): void {
        if (this.committed || this.rolledBack) {
            throw new Error('Cannot add operations to a completed transaction');
        }
        this.operations.push(operation);
    }

    /**
     * Execute a function within transaction context
     * Automatically rolls back on error
     */
    async execute<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
        try {
            const result = await fn(this);
            await this.commit();
            return result;
        } catch (error) {
            await this.rollback();
            throw error;
        }
    }

    /**
     * Commit the transaction (mark as successful)
     */
    async commit(): Promise<void> {
        if (this.committed) {
            console.warn('[Transaction] Already committed');
            return;
        }
        if (this.rolledBack) {
            throw new Error('Cannot commit a rolled back transaction');
        }

        this.committed = true;
        console.log(`[Transaction] ✅ Committed ${this.operations.length} operations`);
    }

    /**
     * Rollback all operations in reverse order
     */
    async rollback(): Promise<void> {
        if (this.rolledBack) {
            console.warn('[Transaction] Already rolled back');
            return;
        }
        if (this.committed) {
            console.warn('[Transaction] Cannot rollback committed transaction');
            return;
        }

        console.warn(`[Transaction] ⚠️ Rolling back ${this.operations.length} operations...`);
        this.rolledBack = true;

        // Rollback in reverse order (LIFO)
        const errors: Error[] = [];

        for (let i = this.operations.length - 1; i >= 0; i--) {
            const op = this.operations[i];
            try {
                console.log(`[Transaction] Rolling back: ${op.description}`);
                await op.rollback();
            } catch (error) {
                console.error(`[Transaction] Rollback failed for: ${op.description}`, error);
                errors.push(error instanceof Error ? error : new Error(String(error)));
            }
        }

        if (errors.length > 0) {
            console.error(`[Transaction] ❌ Rollback completed with ${errors.length} errors`);
            throw new Error(`Rollback partially failed: ${errors.map(e => e.message).join(', ')}`);
        }

        console.log('[Transaction] ✅ Rollback completed successfully');
    }

    /**
     * Get transaction status
     */
    getStatus(): 'pending' | 'committed' | 'rolled_back' {
        if (this.committed) return 'committed';
        if (this.rolledBack) return 'rolled_back';
        return 'pending';
    }

    /**
     * Get operation count
     */
    getOperationCount(): number {
        return this.operations.length;
    }
}

/**
 * Helper: Create file operation with rollback
 */
export function createFileOperation(
    filePath: string,
    content: any,
    deleteOnRollback: boolean = true
): Operation {
    return {
        type: 'file_create',
        description: `Create file: ${filePath}`,
        metadata: { filePath },
        rollback: async () => {
            if (deleteOnRollback) {
                const fs = await import('fs').then(m => m.promises);
                try {
                    await fs.unlink(filePath);
                    console.log(`[Rollback] Deleted file: ${filePath}`);
                } catch (error) {
                    console.warn(`[Rollback] Could not delete file: ${filePath}`, error);
                }
            }
        }
    };
}

/**
 * Helper: Create GitHub commit operation with rollback
 */
export function createGitHubOperation(
    description: string,
    revertFn: () => Promise<void>
): Operation {
    return {
        type: 'github_commit',
        description,
        rollback: revertFn
    };
}

/**
 * Helper: Create data update operation with rollback
 */
export function createDataOperation(
    description: string,
    originalData: any,
    restoreFn: (data: any) => Promise<void>
): Operation {
    return {
        type: 'data_update',
        description,
        metadata: { originalData },
        rollback: async () => {
            await restoreFn(originalData);
        }
    };
}
