// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Loader, Pagination, Tooltip } from "@cloudflare/kumo";
import { ArrowLeftIcon, MagnifyingGlassIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import MailboxSplitView from "~/components/MailboxSplitView";
import ComposePanel from "~/components/ComposePanel";
import EmailPanel from "~/components/EmailPanel";
import { formatListDate, getSnippetText } from "~/lib/utils";
import { useUpdateEmail } from "~/queries/emails";
import { useSearchEmails, SEARCH_PAGE_SIZE } from "~/queries/search";
import { useUIStore } from "~/hooks/useUIStore";
import type { Email } from "~/types";

function highlightTerms(text: string, query: string): ReactNode {
	if (!query || !text) return text;
	const freeText = query.replace(/\b(?:from|to|subject|in|is|has|before|after):"[^"]*"/gi, "").replace(/\b(?:from|to|subject|in|is|has|before|after):\S+/gi, "").trim();
	if (!freeText) return text;
	try {
		const escaped = freeText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const regex = new RegExp(`(${escaped})`, "gi");
		const parts = text.split(regex);
		if (parts.length === 1) return text;
		const lowerEscaped = escaped.toLowerCase();
		return parts.map((part, i) => part.toLowerCase() === lowerEscaped ? <mark key={i} className="bg-sh-accent/20 text-sh-text-white rounded-[2px] px-0.5">{part}</mark> : part);
	} catch { return text; }
}

export default function SearchResultsRoute() {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { selectedEmailId, selectedThreadId, isComposing, setSelectedThreadId, closePanel } = useUIStore();
	const updateEmail = useUpdateEmail();
	const urlQuery = searchParams.get("q") || "";
	const [page, setPage] = useState(1);
	const searchKey = useMemo(
		() => `${mailboxId ?? ""}::${urlQuery}`,
		[mailboxId, urlQuery],
	);
	const prevSearchKeyRef = useRef(searchKey);
	const searchChanged = prevSearchKeyRef.current !== searchKey;
	const currentPage = searchChanged ? 1 : page;

	useEffect(() => {
		if (!searchChanged) {
			return;
		}

		prevSearchKeyRef.current = searchKey;
		setPage(1);
		closePanel();
	}, [closePanel, searchChanged, searchKey]);

	const { data: searchData, isLoading } = useSearchEmails(
		mailboxId,
		urlQuery,
		currentPage,
	);
	const results = searchData?.results ?? [];
	const totalCount = searchData?.totalCount ?? 0;
	const isPanelOpen = selectedEmailId !== null || isComposing;

	const handleRowClick = (email: Email) => { setSelectedThreadId(email.id); if (!email.read && mailboxId) updateEmail.mutate({ mailboxId, id: email.id, data: { read: true } }); };
	const folderDisplayName = (name: string | null | undefined): string => { if (!name) return ""; const map: Record<string, string> = { inbox: "Inbox", sent: "Sent", draft: "Drafts", archive: "Archive", trash: "Trash" }; return map[name.toLowerCase()] || name; };

	return (
		<MailboxSplitView
			leftPane={
				<div className="flex flex-col h-full bg-sh-bg-dark">
					<div className="flex items-center gap-2 px-3 py-3 border-b border-sh-border shrink-0 h-[48px]">
						<Tooltip content="Back to inbox" side="bottom" asChild>
							<button 
								type="button"
								className="p-1.5 text-sh-text-muted hover:text-sh-text-white hover:bg-sh-bg-hover transition-colors rounded-[2px] focus:outline-none focus:ring-2 focus:ring-sh-accent"
								onClick={() => navigate(`/mailbox/${mailboxId}/emails/inbox`)} 
								aria-label="Back to inbox"
							>
								<ArrowLeftIcon size={18} />
							</button>
						</Tooltip>
						<div className="min-w-0 flex-1 flex items-baseline gap-2">
							<h1 className="text-[13px] font-semibold text-sh-text-white truncate">Search Results</h1>
							{!isLoading && <span className="text-[12px] text-sh-text-muted truncate">{totalCount} result{totalCount !== 1 ? "s" : ""}{urlQuery ? ` for "${urlQuery}"` : ""}</span>}
						</div>
					</div>
					<div className="flex-1 overflow-y-auto no-scrollbar">
						{isLoading ? <div className="flex justify-center py-16"><Loader size="lg" /></div> : results.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-24 px-6 text-center">
								<div className="mb-4"><MagnifyingGlassIcon size={48} weight="thin" className="text-sh-text-muted" /></div>
								<h3 className="text-[13px] font-semibold text-sh-text-white mb-1.5">No results found</h3>
								<p className="text-[12px] text-sh-text-muted max-w-xs">{urlQuery ? `Nothing matched "${urlQuery}". Try different keywords or check your spelling.` : "Enter a search term to find emails by subject, sender, or content."}</p>
								{urlQuery && <p className="text-[11px] text-sh-text-muted mt-3 max-w-sm">Tip: Use operators like <code className="bg-sh-bg-hover px-1 rounded-[2px]">from:name</code>, <code className="bg-sh-bg-hover px-1 rounded-[2px]">is:unread</code>, <code className="bg-sh-bg-hover px-1 rounded-[2px]">has:attachment</code>, <code className="bg-sh-bg-hover px-1 rounded-[2px]">before:2025-01-01</code></p>}
							</div>
						) : (
							<div>{results.map((email) => {
								const isSelected = selectedEmailId === email.id;
								const snippet = getSnippetText(email.snippet, 120);
								const unread = !email.read;
								const folderName = (email as Email & { folder_name?: string }).folder_name;
								return (
									<div key={email.id} role="button" tabIndex={0} onClick={() => handleRowClick(email)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleRowClick(email); } }} className={`group relative flex items-center w-full text-left cursor-pointer transition-colors border-b border-sh-border-thin h-[48px] px-3 ${isSelected ? "bg-sh-bg-selected" : "hover:bg-sh-bg-hover"} ${unread ? "border-l-[3px] border-l-sh-accent pl-[9px]" : "border-l-[3px] border-l-transparent pl-[9px]"}`}>
										<div className="min-w-0 flex-1 flex items-baseline gap-2">
											<span className={`truncate w-32 shrink-0 text-[13px] ${unread ? "font-semibold text-sh-text-white" : "text-sh-text-read"}`}>{highlightTerms(email.sender.split("@")[0], urlQuery)}</span>
											<div className="flex-1 min-w-0 flex items-baseline gap-2 truncate">
												<span className={`truncate text-[13px] ${unread ? "text-sh-text-white" : "text-sh-text-read"}`}>{highlightTerms(email.subject, urlQuery)}</span>
												{snippet && <span className="truncate text-[12px] text-sh-text-muted">{highlightTerms(snippet, urlQuery)}</span>}
											</div>
											{folderName && <span className="text-[10px] border border-sh-border-thin px-1.5 py-0.5 rounded-[2px] text-sh-text-muted shrink-0 ml-2">{folderDisplayName(folderName)}</span>}
											<span className="text-[11px] text-sh-text-muted shrink-0 ml-2">{formatListDate(email.date)}</span>
										</div>
									</div>
								);
							})}</div>
						)}
					</div>
					{totalCount > SEARCH_PAGE_SIZE && <div className="flex justify-center py-3 border-t border-sh-border shrink-0"><Pagination page={currentPage} setPage={setPage} perPage={SEARCH_PAGE_SIZE} totalCount={totalCount} /></div>}
				</div>
			}
			centerPane={
				<div className="h-full bg-sh-bg-panel flex flex-col relative overflow-hidden">
					{selectedEmailId ? (
						<EmailPanel emailId={selectedEmailId} />
					) : isComposing ? (
						<ComposePanel />
					) : (
						<div className="flex-1 flex flex-col items-center justify-center text-sh-text-muted p-8 text-center">
							<div className="w-12 h-12 mb-4 rounded-full bg-sh-bg-hover flex items-center justify-center">
								<EnvelopeSimpleIcon size={24} weight="regular" />
							</div>
							<p className="text-[13px]">Select an email to view it here.</p>
						</div>
					)}
				</div>
			}
			rightPane={null}
		/>
	);
}
