/**
 * Shared DI token for the Unit of Work port.
 * Each module binds its own implementation (MikroOrmUnitOfWork or NoOpUnitOfWork).
 * Handlers inject this symbol and annotate the parameter as UnitOfWorkPort.
 */
export const UNIT_OF_WORK_PORT = Symbol("UnitOfWorkPort");
export const LOGGER_PORT = Symbol("LoggerPort");
