import { useEffect } from "react";
import logger from "../../utils/logger";

export const SHAKA_EVENTS = [
	"error",
	"adaptation",
	"trackschanged",
	"variantchanged",
	"streaming",
	"abrstatuschanged",
	"buffering",
	"emsg",
	"loading",
	"textchanged",
	"timelineregionadded",
	"timelineregionenter",
	"timelineregionexit",
	"trackadded",
	"trackremoved",
	"drmsessionupdate",
	"manifestparsed",
	"manifestloaded",
	"licenseexpired",
	"expirationupdated",
	"texttrackvisibility",
	"closedcaptionsenabled",
	"caststatuschanged",
];

export function useShakaEventLogger(player: shaka.Player | undefined) {
	useEffect(() => {
		if (!player) return;

		const eventHandlers: Array<{ name: string; fn: EventListener }> = [];
		SHAKA_EVENTS.forEach((eventName) => {
			const handler = (evt: Event) => {
				const detail = (evt as CustomEvent).detail;
				logger.debug("Shaka Event", eventName, detail);
			};
			player.addEventListener(eventName, handler);
			eventHandlers.push({ name: eventName, fn: handler });
		});

		// Error handler
		const errorHandler = (evt: Event) => {
			const detail = (evt as CustomEvent).detail as shaka.util.Error;

			if (detail && typeof detail.code === "number") {
				logger.error("ShakaError", "Code:", detail.code, "Severity:", detail.severity, detail);
			} else {
				logger.error("ShakaError", "Unknown error", evt);
			}
		};
		player.addEventListener("error", errorHandler);
		eventHandlers.push({ name: "error", fn: errorHandler });

		return () => {
			eventHandlers.forEach(({ name, fn }) => {
				player.removeEventListener(name, fn);
			});
		};
	}, [player]);
}
