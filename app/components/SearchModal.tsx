// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import React, { useEffect, useRef, useState } from "react";
import { useEmails } from "~/queries/emails";
import { formatListDate } from "shared/dates";
import { useNavigate } from "react-router";
import { useUIStore } from "~/hooks/useUIStore";

interface SearchModalProps {
	isOpen: boolean;
	onClose: () => void;
	mailboxId: string;
}

export default function SearchModal({ isOpen, onClose, mailboxId }: SearchModalProps) {
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const navigate = useNavigate();
	const { setSelectedThreadId } = useUIStore();

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(query);
		}, 300);
		return () => clearTimeout(timer);
	}, [query]);

	// Auto-focus input when modal opens
	useEffect(() => {
		if (isOpen) {
			setQuery("");
			setDebouncedQuery("");
			setTimeout(() => {
				inputRef.current?.focus();
			}, 50);
		}
	}, [isOpen]);

	const { data: emailData, isFetching, error } = useEmails(
		mailboxId,
		{ q: debouncedQuery, limit: "10" },
		{ enabled: isOpen && debouncedQuery.trim().length > 0 }
	);

	const emails = emailData?.emails || [];

	if (!isOpen) return null;

	const handleResultClick = (emailId: string) => {
		setSelectedThreadId(emailId);
		navigate(`/mailbox/${mailboxId}/emails/inbox`); // navigate to inbox to show the thread
		onClose();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			onClose();
		}
	};

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50 backdrop-blur-sm"
			onClick={handleOverlayClick}
		>
			<div
				className="w-full max-w-2xl bg-sh-bg-panel border border-sh-border rounded-lg shadow-2xl flex flex-col overflow-hidden"
				role="dialog"
				aria-modal="true"
			>
				{/* Search Input Area */}
				<div className="flex items-center px-4 py-3 border-b border-sh-border">
					<MagnifyingGlassIcon size={20} className="text-sh-text-muted shrink-0 mr-3" />
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Search emails, senders, or subjects..."
						className="flex-1 bg-transparent border-none outline-none text-[15px] text-sh-text-white placeholder-sh-search-placeholder"
					/>
					<button
						type="button"
						onClick={onClose}
						className="p-1 text-sh-text-muted hover:text-sh-text-white rounded-[2px] transition-colors"
						aria-label="Close search"
					>
						<XIcon size={16} />
					</button>
				</div>

				{/* Results Area */}
				{debouncedQuery.trim().length > 0 && (
					<div className="max-h-[60vh] overflow-y-auto no-scrollbar">
						{error ? (
							<div className="px-4 py-6 text-center text-[13px] text-red-500">
								Failed to fetch search results. Please try again.
							</div>
						) : isFetching ? (
							<div className="px-4 py-6 text-center text-[13px] text-sh-text-muted">
								Searching...
							</div>
						) : emails.length > 0 ? (
							<div className="py-2">
								{emails.map((email) => {
									const senderStr = email.sender || "";
									const match = senderStr.match(/(.*)<(.*)>/);
									const displayName = match ? (match[1].trim() || match[2].trim()) : senderStr.split("@")[0];
									
									return (
										<div
											key={email.id}
											role="button"
											tabIndex={0}
											onClick={() => handleResultClick(email.id)}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													handleResultClick(email.id);
												}
											}}
											className="flex items-center justify-between px-4 py-3 hover:bg-sh-bg-hover cursor-pointer transition-colors border-l-[3px] border-l-transparent focus:outline-none focus:bg-sh-bg-hover"
										>
											<div className="flex-1 min-w-0 mr-4">
												<div className="flex items-baseline mb-0.5">
													<span className="text-[13px] font-semibold text-sh-text-white truncate max-w-[40%] mr-2">
														{displayName.replace(/^"|"$/g, "").trim()}
													</span>
													<span className="text-[13px] text-sh-text-read truncate flex-1">
														{email.subject || "(No Subject)"}
													</span>
												</div>
												{email.snippet && (
													<div className="text-[12px] text-sh-text-muted truncate">
														{email.snippet}
													</div>
												)}
											</div>
											<span className="text-[12px] text-sh-text-muted shrink-0">
												{formatListDate(email.date)}
											</span>
										</div>
									);
								})}
							</div>
						) : (
							<div className="px-4 py-6 text-center text-[13px] text-sh-text-muted">
								No results found for "{debouncedQuery}"
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
