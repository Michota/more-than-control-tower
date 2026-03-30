export interface UnitOfWorkPort {
    commit(): Promise<void>;
}
