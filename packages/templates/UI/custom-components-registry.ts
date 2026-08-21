export interface UIComponentRecord {
	name: string;
	category: "atom" | "molecule" | "organism" | "template";
	location: string;
	description: string;
	propsInterface?: string;
	subComponents?: string[];
	reusableAcross: string[];
}

export const CustomComponentsRegistry: UIComponentRecord[] = [
	// Populated by Designer-Lead during Phase 3
];
