export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";
export interface LogMessage {
	timestamp: string;
	tag: string;
	level: LogLevel;
	message: string;
	args: unknown[];
}

const LOG_LEVEL_ORDERS: Array<LogLevel> = ["debug", "info", "warn", "error", "fatal", "trace"];

const MAP_CONSOLE_FN: Record<LogLevel, typeof console.log> = {
	debug: console.debug || console.log,
	info: console.info || console.log,
	warn: console.warn || console.log,
	error: console.error || console.log,
	fatal: console.error || console.log,
	trace: console.trace || console.log,
};

/**
 * Simple AdsLogger to formatted log and use speiecific console function if it is supported
 */
class Logger {
	private enable: boolean;
	private level: LogLevel;
	private listeners: Set<(msg: LogMessage) => void> = new Set();

	constructor(config: { enable?: boolean; level?: LogLevel }) {
		const debugLocalStorage =
			"localStorage" in globalThis
				? Boolean(globalThis.localStorage?.getItem("playerTestDebug") || false)
				: false;
		this.enable = config.enable || debugLocalStorage;
		this.level = debugLocalStorage ? "debug" : config.level || "info";
	}

	public debug(tag: string, message: string, ...args: unknown[]) {
		this.log("debug", tag, message, ...args);
	}

	public info(tag: string, message: string, ...args: unknown[]) {
		this.log("info", tag, message, ...args);
	}

	public warn(tag: string, message: string, ...args: unknown[]) {
		this.log("warn", tag, message, ...args);
	}

	public error(tag: string, message: string, ...args: unknown[]) {
		this.log("error", tag, message, ...args);
	}

	public setLogLevel(level: LogLevel) {
		this.level = level;
	}

	public setEnable(enable: boolean) {
		this.enable = enable;
	}

	public subscribe(listener: (msg: LogMessage) => void) {
		this.listeners?.add(listener);
	}

	public unsubscribe(listener: (msg: LogMessage) => void) {
		this.listeners?.delete(listener);
	}

	private emit(msg: LogMessage) {
		this.listeners?.forEach((listener) => listener(msg));
	}

	private log(level: LogLevel, tag: string, message: string, ...args: unknown[]) {
		if (!this.enable) {
			return;
		}
		if (LOG_LEVEL_ORDERS.indexOf(level) >= LOG_LEVEL_ORDERS.indexOf(this.level)) {
			const timestamp = new Date().toISOString();
			const fn = MAP_CONSOLE_FN[level] ?? console.log;
			const logMessage: LogMessage = {
				timestamp,
				tag,
				level,
				message,
				args,
			};
			fn(`[${timestamp}]  [${tag}] [${level}]`, message, ...args);
			this.emit(logMessage);
		}
	}
}

const logger = new Logger({
	enable: true,
	level: "debug",
});

export default logger;
