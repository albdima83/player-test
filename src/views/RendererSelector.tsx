import { Container, MenuItem, Select, Typography } from "@mui/material";
import { PlayerRendererSelectorComponents } from "../config";

export interface RendererSelectorProps {
	renderer: keyof typeof PlayerRendererSelectorComponents;
	onRendererSelected(renderer: keyof typeof PlayerRendererSelectorComponents): void;
}

const RenderKeys = Object.keys(PlayerRendererSelectorComponents);

export function RendererSelector(props: RendererSelectorProps) {
	return (
		<Container maxWidth="md" sx={{ mt: 5 }}>
			<Typography variant="h6" gutterBottom>
				Select the Render
			</Typography>

			<Select value={props.renderer} onChange={(e) => props.onRendererSelected(e.target.value)} fullWidth>
				{RenderKeys.map((key) => (
					<MenuItem key={key} value={key}>
						{key.toUpperCase()}
					</MenuItem>
				))}
			</Select>
		</Container>
	);
}
