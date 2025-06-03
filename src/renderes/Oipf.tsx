/// <reference types="hbbtv-typings" />

import { useEffect, useLayoutEffect, useRef } from "react";
import { PlayerProps } from "./types";
import logger from "../utils/logger";
import { type DrmType } from "src/types";

const DrmSystemsIds: Record<DrmType, string> = {
	//playready: "urn:dvb:casystemid:19219",
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

type EventHandler = () => void;

interface AVComponent {
	id: number;
	type: number;
	language?: string;
	codec?: string;
	// Additional fields can be added as needed
}

interface AVComponentCollection {
	components: AVComponent[];
}

interface DRMMessageResult {
	readonly msgID: string;
	readonly resultMsg: string;
	readonly resultCode: number;
}

interface DRMMessageResultEvent extends Event {
	readonly msgID: string;
	readonly resultMsg: string;
	readonly resultCode: number;
}

interface DRMSystemStatusChangeEvent extends Event {
	readonly DRMSystemID: string;
}

interface DRMSystemMessageEvent extends Event {
	readonly msg: string;
	readonly DRMSystemID: string;
}

interface DRMRightsErrorEvent extends Event {
	rightsIssuerURL: string;
	errorCode: number;
	drmSystemID: string;
	contentID: string;
	systemSpecificData: string;
}
interface OIPDrmAgentObject extends OIPF.DrmAgentObject {
	/**
	 * Send message to the DRM agent, using a message type as defined by the DRM system
	 * Returns a unique ID to identify the message, to be passed as the ‘msgID’ argument for the callback function registered through onDRMMessageResult.
	 * This is an asynchronous method. Applications will be notified of the results of the operation via events dispatched to onDRMMessageResult and corresponding DOM events.
	 * @param msgType
	 * @param msg
	 * @param drmSystemID
	 * @returns @string
	 */
	sendDRMMessage(msgType: string, msg: string, drmSystemID: string): string;
	/**
	 * Returns the status of the indicated DRM system, as defined below:
	 * READY: The DRM system is fully initialised and ready.
	 * UNKNOWN: Unknown DRM system.
	 * INITIALISING: The DRM system is initialising and not ready to start communicating with the application.
	 * ERROR: There is a problem with the DRM system. It may be possible to communicate with it to obtain more information.
	 * @param drmSystemID
	 * @returns @number (0 = READY, 1 = UNKNOWN, 2 = INITIALISING , 3 = ERROR)
	 */
	DRMSystemStatus(drmSystemID: string): number;

	/**
	 * Checks the local availability of a valid license for playing a protected content item.
	 * he function returns true if there is a valid license available locally that may allow playing the content. For example the actual playing may be blocked due to other constraints (e.g. video/audio output restrictions on selected output).
	 * The DRMPrivateData may be retrieved by the application via a means out of scope of this specification (e.g. retrieved from Service Platform, or from a manifest file).
	 * For already downloaded content, the private data may be retrieved via the getDRMPrivateData() method of the Download class. In case the download is triggered through a Content Access Download Descriptor, the private data may be retrieved from the drmControl property.
	 * @param drmPrivateData
	 * @param drmSystemID
	 * @retun @boolean
	 */
	canRecordContent(drmPrivateData: string, drmSystemID: string): boolean;

	onDRMMessageResult: (msgID: string, resultMsg: string, resultCode: number) => void;
	/**
	 * The function that is called when the underlying DRM system has a message to report to the current HTML document
	 */
	onDRMSystemStatusChange: ((ev: DRMSystemStatusChangeEvent) => void) | null;
	/**
	 * The function that is called when the status of a DRM system changes
	 */
	onDRMSystemMessage: ((ev: DRMSystemMessageEvent) => void) | null;
	/**
	 *
	 */
	onDRMRightsError: ((ev: DRMRightsErrorEvent) => void) | null;

	// addEventListener overloads
	addEventListener(
		type: "DRMMessageResult",
		listener: (ev: DRMMessageResultEvent) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	addEventListener(
		type: "DRMSystemStatusChange",
		listener: (ev: DRMSystemStatusChangeEvent) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	addEventListener(
		type: "DRMSystemMessage",
		listener: (ev: DRMSystemMessageEvent) => void,
		options?: boolean | AddEventListenerOptions,
	): void;

	addEventListener(
		type: "DRMRightsError",
		listener: (ev: DRMRightsErrorEvent) => void,
		options?: boolean | AddEventListenerOptions,
	): void;

	// Custom addEventListener for generic events
	addEventListener(event: string, listener: EventListenerOrEventListenerObject): void;
}

interface OIPVideoMpegObject extends HTMLObjectElement {
	// Properties
	data: string; // Contains media URL, see DRM section for additional parameters
	playPosition: number; // Read-only, in milliseconds
	playTime: number; // Read-only, in milliseconds
	playState: number; // Read-only
	error: number; // Read-only
	source: string;
	speed: number; // Read-only; Trickplay with fractional values not recommended
	fullScreen: boolean; // Read-only
	type: "video/mpeg" | "application/dash+xml"; // MIME type, must match base interface
	currentRepresentation: number; // Read-only; bitrate in bps
	maxRepresentation: number; // Read-only; bitrate in bps
	minRepresentation: number; // Read-only; bitrate in bps

	// Event Handlers
	onFullScreenChange?: EventHandler;
	onPlayStateChange?: EventHandler;
	onPlaySpeedChanged?: EventHandler;
	onPlayPositionChanged?: EventHandler;

	// Methods
	play(speed: number): boolean; // Value between 0 (paused) and N (1 = normal speed)
	stop(): boolean;
	seek(pos: number): boolean; // Value in seconds, can be fractional (e.g. 2.1)
	setFullScreen(fullscreen: boolean): void;
	getComponents(componentType: number): AVComponentCollection;
	getCurrentActiveComponents(componentType: number): AVComponentCollection;
	selectComponent(component: AVComponent): void;
	unselectComponent(componentType: number): void;
	play(): void;
	stop(): void;

	getChannelConfig?: () => any;
	bindToCurrentChannel?: () => void;
}

// Constants for component types
const COMPONENT_TYPE_VIDEO = 0;
const COMPONENT_TYPE_AUDIO = 1;
const COMPONENT_TYPE_SUBTITLE = 2;

function createOipfVideo(container: HTMLDivElement): OIPVideoMpegObject {
	let oipfVideoObj = document.getElementById("oipfVideo");
	if (oipfVideoObj) {
		return oipfVideoObj as OIPVideoMpegObject;
	}

	if ("oipfObjectFactory" in window && typeof window.oipfObjectFactory.createVideoMpegObject === "function") {
		oipfVideoObj = window.oipfObjectFactory.createVideoMpegObject() as unknown as OIPVideoMpegObject;
	} else {
		oipfVideoObj = document.createElement("object") as unknown as OIPVideoMpegObject;
		//@ts-ignore
		oipfVideoObj.type = "application/dash+xml";
		oipfVideoObj.id = "oipfVideo";
	}
	oipfVideoObj.style.position = "absolute";
	oipfVideoObj.style.top = "0px";
	oipfVideoObj.style.left = "0px";
	oipfVideoObj.style.bottom = "0px";
	oipfVideoObj.style.right = "0px";
	logger.debug(TAG, "create oipfVideoObj: ", oipfVideoObj);
	container.appendChild(oipfVideoObj);
	return oipfVideoObj as OIPVideoMpegObject;
}

function createDrmAgent(): OIPDrmAgentObject {
	let drmObj = document.getElementById("oipfDrmAgent");
	if (drmObj) {
		return drmObj as OIPDrmAgentObject;
	}

	drmObj = document.createElement("object") as unknown as OIPDrmAgentObject;
	//@ts-ignore
	drmObj.type = "application/oipfDrmAgent";
	drmObj.id = "oipfDrmAgent";
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

function getPlayreadyMessage(licenseUrl: string, customData?: string) {
	return `<?xml version="1.0" encoding="utf-8"?>\n<PlayReadyInitiator xmlns="http://schemas.microsoft.com/DRM/2007/03/protocols/">\n<LicenseServerUriOverride>\n<LA_URL>${encodeURIComponent(licenseUrl)}</LA_URL>\n</LicenseServerUriOverride>\n<SetCustomData><CustomData></CustomData></SetCustomData>\n</PlayReadyInitiator>`;
}

function getMarlinMessage(licenseUrl: string) {
	return `<Marlin xmlns="http://marlin-drm.com/epub">
            <Version>1.1</Version>
            <RightsURL>
                <RightsIssuer>
                    <URL>${licenseUrl}</URL>
            </RightsIssuer></RightsURL>
        </Marlin>`;
}

export function getMessageFromDRM(drmType: DrmType, licenseUrl: string, customData?: string) {
	switch (drmType) {
		case "playready": {
			return getPlayreadyMessage(licenseUrl, customData);
		}

		case "marlin": {
			return getMarlinMessage(licenseUrl);
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

		const onDRMRightsError = (evt: DRMRightsErrorEvent): void => {
			logger.error(TAG, "onDRMRightsError DRM Rights Error!");
			logger.debug(TAG, "DRM System ID:", evt.drmSystemID);
			logger.debug(TAG, "Content ID:", evt.contentID);
			logger.debug(TAG, "Rights Issuer URL:", evt.rightsIssuerURL);
			logger.debug(TAG, "Error Code:", evt.errorCode);
			logger.debug(TAG, "System Specific Data:", evt.systemSpecificData);
		};

		const onDRMMessageResult = (msgID: string, resultMsg: string, resultCode: number): void => {
			logger.debug(TAG, `onDRMMessage msgID:[${msgID}] resultMsg:[${resultMsg}] resultCode:[${resultCode}]`);
			switch (resultCode) {
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

				video.setAttribute("data", url); // + (licenseUrl ? "?la_url=" + encodeURIComponent(licenseUrl) : ""));
				video.setAttribute("type", type);

				if (drmAgent && drmType && drmType !== "clear" && licenseUrl) {
					const messageType = DrmSystemsMessageType[drmType];
					const drmSystemsId = DrmSystemsIds[drmType];
					logger.debug(TAG, `Is DRM messageType: [${messageType}] [${drmType}] [${drmSystemsId}]`);
					logger.debug(TAG, `DRMSystemStatus: [${drmAgent.DRMSystemStatus(drmSystemsId)}]`);

					if (messageType) {
						const message = getMessageFromDRM(drmType, licenseUrl);
						drmAgent.onDRMMessageResult = onDRMMessageResult;
						drmAgent.onDRMRightsError = onDRMRightsError;
						logger.debug(TAG, `sendDRMMessage: [${messageType}] [${message}] [${drmSystemsId}]`);
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
