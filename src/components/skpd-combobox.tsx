import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "#/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { useSkpdList } from "#/hooks/use-master";
import { cn } from "#/lib/utils";

interface SkpdComboboxProps {
	value: string;
	onChange: (value: string) => void;
	/** Show "Semua SKPD" option (value="") for filter use cases */
	showAll?: boolean;
	placeholder?: string;
	className?: string;
}

export function SkpdCombobox({
	value,
	onChange,
	showAll = false,
	placeholder = "Pilih SKPD...",
	className,
}: SkpdComboboxProps) {
	const [open, setOpen] = useState(false);
	const { data: skpdList } = useSkpdList();

	const selected = skpdList?.find((s) => String(s.skpd_id) === value);
	const displayLabel =
		value && selected
			? selected.skpd_nama
			: showAll && !value
				? "Semua SKPD"
				: null;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn("justify-between font-normal", className)}
				>
					<span className="truncate">{displayLabel ?? placeholder}</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-[--radix-popover-trigger-width] p-0"
				align="start"
			>
				<Command>
					<CommandInput placeholder="Cari SKPD..." />
					<CommandList>
						<CommandEmpty>SKPD tidak ditemukan</CommandEmpty>
						<CommandGroup>
							{showAll && (
								<CommandItem
									value="Semua SKPD"
									onSelect={() => {
										onChange("");
										setOpen(false);
									}}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											!value ? "opacity-100" : "opacity-0",
										)}
									/>
									Semua SKPD
								</CommandItem>
							)}
							{skpdList?.map((s) => (
								<CommandItem
									key={s.skpd_id}
									value={s.skpd_nama}
									onSelect={() => {
										onChange(String(s.skpd_id));
										setOpen(false);
									}}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											value === String(s.skpd_id) ? "opacity-100" : "opacity-0",
										)}
									/>
									{s.skpd_nama}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
