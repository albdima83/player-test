import { OipfPlayer } from "./renderes/Oipf";
import { ShakaPlayer } from "./renderes/Shaka";
import { PlayerProps } from "./renderes/types";
import { DrmType } from "./types";

export const drmLicenseServers: Record<DrmType, string> = {
	widevine: "https://widevine.entitlement.theplatform.eu/wv/web/ModularDrm/getRawWidevineLicense",
	fairplay: "https://fairplay.entitlement.theplatform.eu/fpls/web/FairPlay?httpError=false&form=json&_",
	playready: "https://playready3.entitlement.eu.theplatform.com/playready/rightsmanager.asmx",
	marlin: "",
	clear: "",
};

export const PlayerRendererSelectorComponents: Record<string, React.ComponentType<PlayerProps>> = {
	shaka: ShakaPlayer,
	oipf: OipfPlayer,
};
