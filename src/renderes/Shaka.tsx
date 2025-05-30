import { useEffect, useRef, useState } from "react";
import { PlayerProps } from "./types";
import shaka from "shaka-player/dist/shaka-player.compiled";
import { useShakaEventLogger } from "./hooks/useShakaEventLogger";
import logger from "../utils/logger";

export function ShakaPlayer(props: PlayerProps) {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const [player, setPlayer] = useState<shaka.Player | undefined>(undefined);

	useShakaEventLogger(player);

	useEffect(() => {
		if (!shaka || !videoRef.current) return;

		const loadVideo = async () => {
			try {
				shaka.polyfill.installAll();

				if (!shaka.Player.isBrowserSupported()) {
					console.error("Browser not supported");
					return;
				}

				const video = videoRef.current;
				if (!video) return;
				const { url, licenseUrl, drmType } = props.stream || {};

				if (!url) {
					return;
				}
				//unload previous shaka if loaded
				player?.detach();
				player?.unload();
				const playerInstance = new shaka.Player();
				await playerInstance.attach(video);
				setPlayer(playerInstance);

				if (drmType !== "clear" && licenseUrl) {
					const drmKey = drmType === "widevine" ? "com.widevine.alpha" : "com.microsoft.playready";
					playerInstance.configure({
						drm: {
							servers: {
								[drmKey]: licenseUrl,
							},
						},
					});
				} else {
					playerInstance.configure({ drm: { servers: {} } });
				}

				await playerInstance.load(url);
				logger.debug("SHAKA", "Video loaded");
			} catch (err) {
				logger.error("SHAKA", "Error loading video", err);
			}
		};

		loadVideo();

		return () => {
			(async () => {
				if (player) {
					try {
						await player.detach();
						await player.unload();
						await player.destroy();
					} catch (error) {
						console.warn("Error during player cleanup", error);
					}
					setPlayer(undefined);
				}
			})();
		};
	}, [props]);

	useEffect(() => {
		return () => {
			player?.detach();
			player?.unload();
			player?.destroy();
			setPlayer(undefined);
		};
	}, []);

	return <video ref={videoRef} width="100%" controls autoPlay />;
}
