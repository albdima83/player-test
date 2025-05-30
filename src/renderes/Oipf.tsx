/// <reference types="hbbtv-typings" />

import { useEffect, useLayoutEffect, useRef } from "react";
import { PlayerProps } from "./types";
import logger from "../utils/logger";
import { type DrmType } from "src/types";

const DrmSystemsIds: Record<DrmType, string> = {
	playready: "com.microsoft.playready",
	widevine: "urn:dvb:casystemid:19156",
	marlin: "urn:dvb:casystemid:19188",
	fairplay: "",
	clear: "",
} as const;

const DrmSystemsMessageType: Record<DrmType, string> = {
	playready: "application/vnd.ms-playready.initiator+xml",
	widevine: "urn:dvb:casystemid:19156",
	marlin: "application/vnd.marlin.drm.actiontoken+xml",
	fairplay: "",
	clear: "",
} as const;

interface DrmRightsErrorEvent {
	rightsIssuerURL: string;
	errorCode: number;
	drmSystemID: string;
	contentID: string;
	systemSpecificData: string;
}

interface DrmMessage {
	msgID: string;
	resultMsg: string;
	resultCode: number;
}

interface OIPDrmAgentObject extends OIPF.DrmAgentObject {
	// onDRMRightsError: (error: DrmRightsErrorEvent) => void;
	// onDRMMessage: (msgID: string, resultMsg: string, resultCode: number) => void;
	sendDRMMessage(msgType: string, msg: string, drmSystemID: string): string;

	addEventListener(event: "drmmessageresult", listener: (evt: DrmMessage) => void): void;
	addEventListener(event: "drmrightsError", listener: (evt: DrmRightsErrorEvent) => void): void;

	// Custom addEventListener for generic events
	addEventListener(event: string, listener: EventListenerOrEventListenerObject): void;
}

interface OIPVideoMpegObject extends OIPF.VideoMpegObject {
	data: string;
	play(): void;
	stop(): void;
	source: string;
	onPlayStateChange: (state: number) => void;
	fullScreen?: boolean;
	getChannelConfig?: () => any;
	bindToCurrentChannel?: () => void;
	setFullScreen?: (fullscreen: boolean) => void;
	onDRMRightsError: (error: DrmRightsErrorEvent) => void;
	onDRMMessage: (msgID: string, resultMsg: string, resultCode: number) => void;
}

function createOipfVideo(container: HTMLDivElement): OIPVideoMpegObject {
	const video = window.oipfObjectFactory.createVideoMpegObject() as OIPVideoMpegObject;
	video.style.position = "absolute";
	video.style.inset = "0px";
	video.style.left = "0px";
	video.style.top = "0px";
	video.style.right = "0px";
	video.style.bottom = "0px";
	video.style.zIndex = "1";
	container.appendChild(video);
	return video;
}

function createDrmAgent(): OIPDrmAgentObject {
	let drmObj = document.getElementById("drmAgent");
	if (drmObj) {
		return drmObj as OIPDrmAgentObject;
	}

	drmObj = document.createElement("object") as unknown as OIPDrmAgentObject;
	//@ts-ignore
	drmObj.type = "application/oipfDrmAgent";
	drmObj.id = "drmAgent";
	drmObj.style.width = "0px";
	drmObj.style.height = "0px";
	logger.debug(TAG, "create drmObj: ", drmObj);
	document.body.appendChild(drmObj);
	return drmObj as OIPDrmAgentObject;
}

function getTypeFromSource(url: string) {
	if (url.indexOf(".mpd") > -1) {
		return "application/dash+xml";
	}
	if (url.indexOf(".m3u8") > -1) {
		return "application/vnd.apple.mpegurl";
	}
	if (url.indexOf("ism") > -1) {
		return "application/vnd.ms-sstr+xml";
	}
	return "video/mp4";
}

export function getPlayReadyMessage(licenseUrl: string, customData?: string) {
	return `<?xml version="1.0" encoding="utf-8"?>
        <PlayReadyInitiator xmlns="http://schemas.microsoft.com/DRM/2007/03/protocols/">
            <LicenseServerUriOverride>
             <LA_URL>${licenseUrl}</LA_URL>
            </LicenseServerUriOverride>
            <SetCustomData>
                <CustomData>${customData || ""}</CustomData>
            </SetCustomData>
        </PlayReadyInitiator>`;
}

export function getWidevineMessage(licenseUrl: string, customData?: string) {
	return `<?xml version="1.0" encoding="utf-8"?>
        <PlayReadyInitiator xmlns="http://schemas.microsoft.com/DRM/2007/03/protocols/">
            <LicenseServerUriOverride>
             <LA_URL>${encodeURIComponent(licenseUrl)}</LA_URL>
            </LicenseServerUriOverride>
            <SetCustomData>
                <CustomData>${customData || ""}</CustomData>
            </SetCustomData>
        </PlayReadyInitiator>`;
}

export function getMessageFromDRM(drmType: DrmType, licenseUrl: string, customData?: string) {
	switch (drmType) {
		case "playready": {
			return getPlayReadyMessage(licenseUrl, customData);
		}

		default: {
			return "";
		}
	}
}

const TAG = "OipfPlayer";

export function OipfPlayer(props: PlayerProps) {
	const containterVideoRef = useRef<HTMLDivElement | null>(null);
	const drmAgentObject = useRef<OIPDrmAgentObject | undefined>(undefined);
	const videoMpegObject = useRef<OIPVideoMpegObject | undefined>(undefined);

	useLayoutEffect(() => {
		if (!containterVideoRef.current) {
			return;
		}
		const drmAgent = createDrmAgent();
		const video = createOipfVideo(containterVideoRef.current);

		logger.debug(TAG, "drmAgent created: ", drmAgent);
		logger.debug(TAG, "video created: ", video);

		videoMpegObject.current = video;
		drmAgentObject.current = drmAgent;
	}, []);

	useEffect(() => {
		if (!containterVideoRef.current) return;

		const onDRMRightsError = (evt: DrmRightsErrorEvent): void => {
			logger.error(TAG, "onDRMRightsError DRM Rights Error!");
			logger.debug(TAG, "DRM System ID:", evt.drmSystemID);
			logger.debug(TAG, "Content ID:", evt.contentID);
			logger.debug(TAG, "Rights Issuer URL:", evt.rightsIssuerURL);
			logger.debug(TAG, "Error Code:", evt.errorCode);
			logger.debug(TAG, "System Specific Data:", evt.systemSpecificData);
		};

		const onDRMMessage = (evt: DrmMessage): void => {
			logger.debug(
				TAG,
				`onDRMMessage msgID:[${evt.msgID}] resultMsg:[${evt.resultMsg}] resultCode:[${evt.resultCode}]`,
			);
			switch (evt.resultCode) {
				case 0: {
					logger.debug(TAG, "Successful The action(s) requested by sendDRMMessage()");
					break;
				}
				case 1: {
					logger.debug(TAG, "Unknown error sendDRMMessage() failed because an unspecified");
					break;
				}
				case 2: {
					logger.debug(
						TAG,
						"Cannot process request sendDRMMessage() failed because the DRM agent was unable to complete the request.",
					);
					break;
				}
				case 3: {
					logger.debug(
						TAG,
						"Unknown MIME type sendDRMMessage() failed, because the specified Mime Type is unknown for the specified DRM system indicated in the DRMSystemId.",
					);
					break;
				}
				case 4: {
					logger.debug(
						TAG,
						"User consent neededsendDRMMessage() failed because user consent is needed for that action.",
					);
					break;
				}
				case 5: {
					logger.debug(
						TAG,
						"Unknown DRM system sendDRMMessage() failed, because the specified DRM System in DRMSystemId is unknown.",
					);
					break;
				}
				case 6: {
					logger.debug(
						TAG,
						"Wrong format sendDRMMessage() failed, because the message in msg has the wrong format",
					);
					break;
				}
			}
		};

		const loadVideo = async () => {
			try {
				const video = videoMpegObject.current;
				const drmAgent = drmAgentObject.current;
				if (!video) return;
				const { url, licenseUrl, drmType } = props.stream || {};

				if (!url) {
					return;
				}
				const type = getTypeFromSource(url);

				logger.debug(
					TAG,
					`Load video url: [${url}] drmType:[${drmType}] type:[${type}] licenseUrl:[${licenseUrl}] []`,
				);

				video.setAttribute("data", url);
				video.setAttribute("type", type);

				if (drmAgent && drmType && drmType !== "clear" && licenseUrl) {
					const messageType = DrmSystemsMessageType[drmType];
					const drmSystemsId = DrmSystemsIds[drmType];
					logger.debug(TAG, `Is DRM messageType: [${messageType}] [${drmAgent}]`);

					if (messageType) {
						const message = getMessageFromDRM(drmType, licenseUrl);
						drmAgent.addEventListener("drmmessageresult", onDRMMessage);
						drmAgent.addEventListener("drmrightsError", onDRMRightsError);
						logger.debug(TAG, `sendDRMMessage: [${messageType}] [${message}] []`);
						drmAgent.sendDRMMessage(messageType, message, drmSystemsId);
					}
				}
				//video.setFullScreen?.(true);
				video.onPlayStateChange = function () {
					//@ts-ignore
					logger.debug(TAG, `Video state: [${video.playState}]`);
				};
				video.play();
				logger.debug(TAG, "Video loaded");
			} catch (err) {
				logger.error(TAG, "Error loading video", err);
			}
		};

		loadVideo();

		return () => {};
	}, [props]);

	useEffect(() => {
		return () => {};
	}, []);

	return <div ref={containterVideoRef} style={{ width: "100%", height: "100%", backgroundColor: "red" }} />;
}
