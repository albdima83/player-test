export type DrmType = "widevine" | "playready" | "fairplay" | "marlin" | "clear";

export interface Stream {
	url: string;
	drmType: DrmType;
	licenseUrl: string;
}
