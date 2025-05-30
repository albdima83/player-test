import { useState } from "react";
import { Box, Button, Container, MenuItem, Select, TextField, Typography } from "@mui/material";
import { type DrmType, type Stream } from "../types";
import { drmLicenseServers } from "../config";

export interface StreamSelectorProps {
	onStreamSelected(stream: Stream): void;
}

export function StreamSelector(props: StreamSelectorProps) {
	const [url, setUrl] = useState("");
	const [drmType, setDrmType] = useState<DrmType>("clear");

	const loadStream = () => {
		if (!url || !drmType) {
			return;
		}
		props.onStreamSelected({ drmType, url, licenseUrl: drmLicenseServers[drmType] });
	};

	return (
		<Container maxWidth="md" sx={{ mt: 5 }}>
			<Typography variant="h6" gutterBottom>
				Select the stream
			</Typography>

			<Box display="flex" flexDirection="column" gap={2} mb={4}>
				<TextField
					fullWidth
					label="URL"
					variant="outlined"
					value={url}
					onChange={(e) => setUrl(e.target.value)}
				/>
				<Select value={drmType} onChange={(e) => setDrmType(e.target.value as DrmType)} fullWidth>
					<MenuItem value="clear">No DRM</MenuItem>
					<MenuItem value="widevine">Widevine</MenuItem>
					<MenuItem value="playready">PlayReady</MenuItem>
				</Select>
				<Button variant="contained" color="primary" onClick={loadStream}>
					Play Stream
				</Button>
			</Box>
		</Container>
	);
}
