import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatNamaGelar(
	nama: string,
	gelardepan?: string | null,
	gelarbelakang?: string | null,
): string {
	const parts: string[] = [];
	if (gelardepan) parts.push(gelardepan);
	parts.push(nama);
	if (gelarbelakang) parts.push(gelarbelakang);
	return parts.join(" ");
}
