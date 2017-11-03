import { ILogger } from './ILogger';
import { ILogEntry } from '../core/ILogEntry';
import { ILocalStorageLoggerConfiguration } from './ILocalStorageLoggerConfiguration';
import { LimitedSizeQueue } from '../queue/LimitedSizeQueue';
/**
 * Logger that logs to a queue in local storage. Will overwrite oldest entries
 * when desired size is exceeded.
 */
var /**
 * Logger that logs to a queue in local storage. Will overwrite oldest entries
 * when desired size is exceeded.
 */
LocalStorageLogger = /** @class */ (function () {
    /**
     * Constructs a new local storage logger.
     * @param config The configuration defining the unique queue name, desired size etc.
     * @param _nextLogger The next logger in the "log chain"
     */
    function LocalStorageLogger(config, _nextLogger) {
        this._nextLogger = _nextLogger;
        this._queue = new LimitedSizeQueue({
            keyPrefix: config.logName,
            maxSizeInBytes: config.maxLogSizeInBytes
        });
    }
    /**
     * Logs an entry to local storage.
     */
    /**
       * Logs an entry to local storage.
       */
    LocalStorageLogger.prototype.log = /**
       * Logs an entry to local storage.
       */
    function (entry) {
        try {
            this._queue.enqueue(entry);
        }
        catch (error) {
            console.error('Failed to log to local storage.', error);
        }
        finally {
            this._nextLogger.log(entry);
        }
    };
    /**
     * Returns all log entries that are still held in local storage.
     */
    /**
       * Returns all log entries that are still held in local storage.
       */
    LocalStorageLogger.prototype.allEntries = /**
       * Returns all log entries that are still held in local storage.
       */
    function () {
        var entries = new Array();
        this._queue.iterate(function (entry) { return entries.push(entry); });
        return entries;
    };
    return LocalStorageLogger;
}());
/**
 * Logger that logs to a queue in local storage. Will overwrite oldest entries
 * when desired size is exceeded.
 */
export { LocalStorageLogger };
//# sourceMappingURL=LocalStorageLogger.js.map