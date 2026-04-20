import React, { useState, useRef, KeyboardEvent } from "react";
import { XIcon } from "@phosphor-icons/react";
import { useParams } from "react-router";
import { useContacts } from "~/queries/contacts";
import { parseSenderInfo } from "~/lib/utils";

interface EmailInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	id?: string;
	required?: boolean;
}

export default function EmailInput({ value, onChange, placeholder, className, id, required }: EmailInputProps) {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const { data: contactsData = [] } = useContacts(mailboxId);
	
	const [inputValue, setInputValue] = useState("");
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);

	const tags = (value || "").split(",").map(t => t.trim()).filter(Boolean);

	const suggestions = contactsData.filter(c => {
		if (!inputValue.trim()) return false;
		const search = inputValue.toLowerCase();
		return (
			(c.displayName?.toLowerCase().includes(search)) || 
			((c.emailAddress || c.id).toLowerCase().includes(search))
		);
	});

	const handleAddTag = (tag: string) => {
		if (!tag.trim()) return;
		const newTags = [...tags, tag.trim()];
		onChange(newTags.join(", "));
		setInputValue("");
		setShowSuggestions(false);
		setSelectedIndex(0);
	};

	const handleRemoveTag = (indexToRemove: number) => {
		const newTags = tags.filter((_, i) => i !== indexToRemove);
		onChange(newTags.join(", "));
	};

	const handleEditTag = (indexToEdit: number) => {
		const tagToEdit = tags[indexToEdit];
		handleRemoveTag(indexToEdit);
		setInputValue(tagToEdit);
		inputRef.current?.focus();
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			if (showSuggestions && suggestions.length > 0) {
				const contact = suggestions[selectedIndex] || suggestions[0];
				handleAddTag(`${contact.displayName} <${contact.emailAddress || contact.id}>`);
			} else if (inputValue.trim()) {
				const { emailAddress } = parseSenderInfo(inputValue.trim());
				const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress);
				if (isValidEmail) {
					handleAddTag(inputValue);
				}
			}
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			if (showSuggestions && suggestions.length > 0) {
				setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
			}
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			if (showSuggestions && suggestions.length > 0) {
				setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
			}
		} else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
			e.preventDefault();
			handleEditTag(tags.length - 1);
		} else if (e.key === "Escape") {
			setShowSuggestions(false);
			setSelectedIndex(0);
		}
	};

	return (
		<div 
			className={`relative flex items-center flex-wrap gap-1.5 cursor-text ${className}`}
			onClick={() => inputRef.current?.focus()}
		>
			{tags.map((tag, index) => {
				const { displayName, emailAddress } = parseSenderInfo(tag);
				const contact = contactsData.find(c => c.id === emailAddress.toLowerCase());
				
				const display = contact?.displayName || displayName || emailAddress;
				const avatar = contact?.avatarUrl;

				return (
					<div 
						key={index} 
						className="flex items-center gap-1.5 px-2 py-1 bg-[#252525] border border-sh-border-thin rounded-[4px] cursor-pointer hover:bg-sh-bg-hover transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							handleEditTag(index);
						}}
						title={emailAddress}
					>
						{avatar ? (
							<img src={avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
						) : contact ? (
							<div className="w-4 h-4 rounded-full bg-sh-accent flex items-center justify-center text-[9px] font-bold text-white shrink-0">
								{display.charAt(0).toUpperCase()}
							</div>
						) : null}
						<span className="text-[13px] text-sh-text-white">{display}</span>
						<button
							type="button"
							className="text-sh-text-muted hover:text-sh-text-white focus:outline-none flex items-center justify-center ml-0.5 p-0.5 rounded-[2px] hover:bg-white/10"
							onClick={(e) => {
								e.stopPropagation();
								handleRemoveTag(index);
							}}
						>
							<XIcon size={12} weight="bold" />
						</button>
					</div>
				);
			})}

			<input
				ref={inputRef}
				id={id}
				type="text"
				value={inputValue}
				onChange={(e) => {
					setInputValue(e.target.value);
					setShowSuggestions(true);
					setSelectedIndex(0);
				}}
				onKeyDown={handleKeyDown}
				onFocus={() => {
					if (inputValue) setShowSuggestions(true);
				}}
				onBlur={() => {
					setTimeout(() => {
						setShowSuggestions(false);
						const trimmed = inputValue.trim();
						if (trimmed) {
							const { emailAddress } = parseSenderInfo(trimmed);
							const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress);
							if (isValidEmail) {
								handleAddTag(trimmed);
							}
						}
					}, 200);
				}}
				placeholder={tags.length === 0 ? placeholder : ""}
				className="flex-1 min-w-[120px] bg-transparent outline-none text-[13px] text-sh-text-white placeholder:text-sh-search-placeholder"
				required={required && tags.length === 0}
			/>

			{showSuggestions && suggestions.length > 0 && (
				<div className="absolute top-[calc(100%+4px)] left-0 min-w-[250px] bg-sh-bg-panel border border-sh-border rounded-[4px] shadow-xl z-50 overflow-hidden py-1">
					{suggestions.map((contact, i) => (
						<div
							key={contact.id}
							className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
								i === selectedIndex ? "bg-sh-bg-hover" : "hover:bg-sh-bg-hover"
							}`}
							onMouseEnter={() => setSelectedIndex(i)}
							onMouseDown={(e) => {
								e.preventDefault();
								handleAddTag(`${contact.displayName} <${contact.emailAddress || contact.id}>`);
							}}
						>
							{contact.avatarUrl ? (
								<img src={contact.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
							) : (
								<div className="w-6 h-6 rounded-full bg-sh-accent flex items-center justify-center text-[10px] font-bold text-white shrink-0">
									{(contact.displayName || contact.emailAddress || contact.id).charAt(0).toUpperCase()}
								</div>
							)}
							<div className="flex flex-col min-w-0">
								<span className="text-[13px] font-medium text-sh-text-white truncate">
									{contact.displayName}
								</span>
								<span className="text-[11px] text-sh-text-muted truncate">
									{contact.emailAddress || contact.id}
								</span>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
