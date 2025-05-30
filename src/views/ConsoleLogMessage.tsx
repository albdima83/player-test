import { Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import logger, { LogMessage } from "../utils/logger";
import Paper from "@mui/material/Paper";

export function formatLogValue(value: unknown): string {
	const seen = new WeakSet();
	try {
		if (typeof value === "string") {
			return value;
		}

		return JSON.stringify(value, function (_key, val) {
			if (typeof val === "object" && val !== null) {
				if (seen.has(val)) return "[Circular]";
				seen.add(val);
			}
			if (typeof val === "function") {
				return `[Function: ${val.name || "anonymous"}]`;
			}
			return val;
		});
	} catch (err) {
		return `[Unserializable: ${(err as Error).message}]`;
	}
}

export function ConsoleLogMessage() {
	const [logs, setLogs] = useState<Array<LogMessage>>([]);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const appendLogs = (log: LogMessage) => {
			setLogs((prevLogs) => [...prevLogs, log]);
		};
		logger.subscribe(appendLogs);
		return () => {
			logger.unsubscribe(appendLogs);
		};
	}, []);

	useEffect(() => {
		if (containerRef.current) {
			containerRef.current.scrollTop = containerRef.current.scrollHeight;
		}
	}, [logs]);

	return (
		<Paper ref={containerRef} sx={{ p: 2, height: "100%", overflow: "auto" }}>
			<Typography variant="h6" gutterBottom>
				Log Messages
			</Typography>
			{logs.length === 0 ? (
				<Typography variant="body2" color="text.secondary">
					No logs yet.
				</Typography>
			) : (
				logs.map((log, idx) => (
					<Typography variant="body2" key={idx}>
						{">"} [{log.level}] [{log.tag}] [{log.message}] [{formatLogValue(log.args)}]
					</Typography>
				))
			)}
		</Paper>
	);
}
