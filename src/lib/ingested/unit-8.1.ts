import unit81Manifest from "@/data/ingested/unit-8.1.json";
import { unitFromManifest, type IngestedUnitManifest } from "@/lib/ingest-manifest";

export const unit81 = unitFromManifest(unit81Manifest as IngestedUnitManifest);
