// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Button, Pagination, Tooltip } from "@cloudflare/kumo";
import {
	ArchiveIcon,
	ArrowBendUpLeftIcon,
	ArrowsClockwiseIcon,
	EnvelopeOpenIcon,
	EnvelopeSimpleIcon,
	FileIcon,
	PaperPlaneTiltIcon,
	PencilSimpleIcon,
	StarIcon,
	TrashIcon,
	TrayIcon,
} from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { Folders } from "shared/folders";
import { formatListDate } from "shared/dates";
import MailboxSplitView from "~/components/MailboxSplitView";
import ComposePanel from "~/components/ComposePanel";
import EmailPanel from "~/components/EmailPanel";
import SenderCard from "~/components/SenderCard";
import { getSnippetText, parseSenderInfo } from "~/lib/utils";
import {
	useDeleteEmail,
	useEmails,
	useMarkThreadRead,
	useUpdateEmail,
} from "~/queries/emails";
import { useFolders } from "~/queries/folders";
import { queryKeys } from "~/queries/keys";
import { useUIStore } from "~/hooks/useUIStore";
import type { Email } from "~/types";

const PAGE_SIZE = 25;

const FOLDER_EMPTY_STATES: Record<
	string,
	{
		icon: React.ReactNode;
		title: string;
		description: string;
		showCompose?: boolean;
	}
> = {
	[Folders.INBOX]: {
		icon: <TrayIcon size={48} weight="thin" className="text-sh-text-muted" />,
		title: "Your inbox is empty",
		description:
			"New emails will appear here when they arrive. Send an email to get the conversation started.",
		showCompose: true,
	},
	[Folders.SENT]: {
		icon: (
			<PaperPlaneTiltIcon size={48} weight="thin" className="text-sh-text-muted" />
		),
		title: "No sent emails",
		description: "Emails you send will show up here.",
		showCompose: true,
	},
	[Folders.DRAFT]: {
		icon: <FileIcon size={48} weight="thin" className="text-sh-text-muted" />,
		title: "No drafts",
		description: "Emails you're still working on will be saved here.",
		showCompose: true,
	},
	[Folders.ARCHIVE]: {
		icon: <ArchiveIcon size={48} weight="thin" className="text-sh-text-muted" />,
		title: "Archive is empty",
		description:
			"Move emails here to keep your inbox clean without deleting them.",
	},
	[Folders.TRASH]: {
		icon: <TrashIcon size={48} weight="thin" className="text-sh-text-muted" />,
		title: "Trash is empty",
		description:
			"Deleted emails will appear here. You can restore them or permanently delete them.",
	},
};

function EmailListSkeleton() {
	return (
		<div className="animate-pulse space-y-1 p-2">
			{Array.from({ length: 8 }).map((_, i) => (
				<div key={i} className="flex items-center gap-3 px-3 py-3">
					<div className="w-4 h-4 rounded-[2px] bg-sh-bg-hover" />
					<div className="w-5 h-5 rounded-[2px] bg-sh-bg-hover" />
					<div className="flex-1 space-y-2">
						<div className="flex items-center gap-2">
							<div className="h-3 w-24 rounded-[2px] bg-sh-bg-hover" />
							<div className="h-3 w-4 rounded-[2px] bg-sh-bg-hover" />
							<div className="h-3 flex-1 rounded-[2px] bg-sh-bg-hover" />
							<div className="h-3 w-12 rounded-[2px] bg-sh-bg-hover" />
						</div>
						<div className="h-2.5 w-3/4 rounded-[2px] bg-sh-bg-hover" />
					</div>
				</div>
			))}
		</div>
	);
}

function FolderEmptyState({
	folder,
	onCompose,
}: {
	folder?: string;
	onCompose: () => void;
}) {
	const config = (folder && FOLDER_EMPTY_STATES[folder]) || {
		icon: (
			<EnvelopeSimpleIcon size={48} weight="thin" className="text-sh-text-muted" />
		),
		title: "No emails",
		description: "This folder is empty.",
	};

	return (
		<div className="flex flex-col items-center justify-center py-24 px-6 text-center">
			<div className="mb-4">{config.icon}</div>
			<h3 className="text-[13px] font-semibold text-sh-text-white mb-1.5">
				{config.title}
			</h3>
			<p className="text-[12px] text-sh-text-muted max-w-xs mb-5">
				{config.description}
			</p>
			{"showCompose" in config && config.showCompose && (
				<button
					type="button"
					onClick={onCompose}
					className="flex items-center gap-1.5 bg-sh-accent hover:bg-opacity-90 text-sh-text-white px-3 py-1 rounded-[2px] text-[12px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sh-accent"
				>
					<PencilSimpleIcon size={14} />
					<span>Compose</span>
				</button>
			)}
		</div>
	);
}

function useContactThreadIds(
	selectedContact: string | null,
	selectedEmailId: string | null,
	allEmails: Email[],
	folder: string | undefined
) {
	return useMemo(() => {
		if (!selectedContact || !selectedEmailId) return undefined;
		
		return Array.from(new Set(allEmails.filter(e => {
			const normalizedContact = selectedContact.toLowerCase();
			let contactStr = e.sender;
			if (folder === Folders.SENT || e.folder_id === Folders.SENT) {
				const recipients = e.recipient ? e.recipient.split(",") : [];
				if (recipients.length > 0) contactStr = recipients[0].trim();
			}
			const { emailAddress } = parseSenderInfo(contactStr);
			const eAddress = emailAddress || contactStr.split("@")[0] || "";
			if (eAddress.toLowerCase() !== normalizedContact) return false;
			
			const selectedEmail = allEmails.find(se => se.id === selectedEmailId);
			if (!selectedEmail) return false;
			
			let subject = e.subject || "";
			subject = subject.replace(/^((re|fwd|fw|aw):\s*)+/ig, "").trim();
			const groupKey = subject.toLowerCase() || "(no subject)";
			
			let selSubject = selectedEmail.subject || "";
			selSubject = selSubject.replace(/^((re|fwd|fw|aw):\s*)+/ig, "").trim();
			const selGroupKey = selSubject.toLowerCase() || "(no subject)";
			
			return groupKey === selGroupKey && !!e.thread_id;
		}).map(e => e.thread_id!)));
	}, [selectedContact, selectedEmailId, allEmails, folder]);
}

export default function EmailListRoute() {
	const { mailboxId, folder } = useParams<{
		mailboxId: string;
		folder: string;
	}>();
	const {
		selectedContact,
		setSelectedContact,
		selectedEmailId,
		selectedThreadId,
		isComposing,
		setSelectedThreadId,
		closePanel,
		startCompose,
	} = useUIStore();
	const [page, setPage] = useState(1);

	const queryClient = useQueryClient();
	const updateEmail = useUpdateEmail();
	const markThreadRead = useMarkThreadRead();
	const deleteEmail = useDeleteEmail();

	const params = useMemo(
		() => ({
			folder: folder || "",
			page: String(page),
			limit: String(PAGE_SIZE),
		}),
		[folder, page],
	);

	const {
		data: emailData,
		isFetching: isRefreshing,
	} = useEmails(mailboxId, params, { refetchInterval: 10_000 });

	const emails = emailData?.emails ?? [];
	const totalCount = emailData?.totalCount ?? 0;

	// Also fetch emails from Sent folder to ensure we have context for threads we replied to
	const sentParams = useMemo(() => ({ folder: Folders.SENT, limit: "100" }), []);
	const { data: sentEmailData } = useEmails(mailboxId, sentParams, { 
		enabled: folder !== Folders.SENT, // Don't fetch twice if we're already in Sent
		refetchInterval: 10_000 
	});
	
	const allEmails = useMemo(() => {
		if (folder === Folders.SENT) return emails;
		
		const sentEmails = sentEmailData?.emails ?? [];
		// Combine and deduplicate by ID just in case
		const combined = [...emails];
		const existingIds = new Set(emails.map(e => e.id));
		
		for (const se of sentEmails) {
			if (!existingIds.has(se.id)) {
				combined.push(se);
				existingIds.add(se.id);
			}
		}
		return combined;
	}, [emails, sentEmailData, folder]);

	const { data: folders = [] } = useFolders(mailboxId);

	const folderName = useMemo(() => {
		const found = folders.find((f) => f.id === folder);
		if (found) return found.name;
		return folder ? folder.charAt(0).toUpperCase() + folder.slice(1) : "Inbox";
	}, [folders, folder]);

	const customThreadIds = useContactThreadIds(selectedContact, selectedEmailId, allEmails, folder);

	// Track folder identity to detect folder changes vs page changes
	const prevFolderRef = useRef<string | undefined>(undefined);

	useEffect(() => {
		const folderChanged = prevFolderRef.current !== `${mailboxId}/${folder}`;
		prevFolderRef.current = `${mailboxId}/${folder}`;

		if (folderChanged) {
			closePanel();
			setPage(1);
		}
	}, [mailboxId, folder, closePanel]);

	const toggleStar = (e: React.MouseEvent, email: Email) => {
		e.preventDefault();
		e.stopPropagation();
		if (mailboxId)
			updateEmail.mutate({
				mailboxId,
				id: email.id,
				data: { starred: !email.starred },
			});
	};

	const handleDelete = (e: React.MouseEvent, emailId: string) => {
		e.preventDefault();
		e.stopPropagation();
		if (mailboxId) {
			const confirmed = window.confirm("Are you sure you want to delete this email?");
			if (!confirmed) return;
			deleteEmail.mutate({ mailboxId, id: emailId });
			if (selectedEmailId === emailId) closePanel();
		}
	};

	const handleRefresh = () => {
		if (mailboxId) {
			queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] });
			queryClient.invalidateQueries({
				queryKey: queryKeys.folders.list(mailboxId),
			});
		}
	};

	// Thread-aware helpers
	const hasUnread = (email: Email): boolean => {
		if (email.thread_unread_count !== undefined) {
			return email.thread_unread_count > 0;
		}
		return !email.read;
	};

	const handleRowClick = (email: Email) => {
		setSelectedThreadId(email.id);
		if (mailboxId && hasUnread(email)) {
			if (email.thread_id && email.thread_count && email.thread_count > 1) {
				markThreadRead.mutate({
					mailboxId,
					threadId: email.thread_id,
				});
			} else {
				updateEmail.mutate({
					mailboxId,
					id: email.id,
					data: { read: true },
				});
			}
		}
	};

	// Group emails into contacts
	const contacts = useMemo(() => {
		const map = new Map<string, { emailAddress: string; displayName: string; latestEmail: Email; threadCount: number; unreadCount: number }>();
		
		allEmails.forEach(email => {
			// Check if the contact is the sender OR the recipient (for sent emails)
			// If it's a sent email (we are the sender), group it by the recipient instead
			let contactStr = email.sender;
			if (folder === Folders.SENT || email.folder_id === Folders.SENT) {
				// Use the first recipient as the contact for grouping sent emails
				const recipients = email.recipient ? email.recipient.split(",") : [];
				if (recipients.length > 0) {
					contactStr = recipients[0].trim();
				}
			}

			const { displayName, emailAddress } = parseSenderInfo(contactStr);
			
			// Normalize email address to lowercase early on
			const normalizedEmailAddress = emailAddress.toLowerCase();
			const contactId = normalizedEmailAddress;

			const existing = map.get(contactId);
			if (!existing) {
				map.set(contactId, {
					emailAddress: normalizedEmailAddress,
					displayName,
					latestEmail: email,
					threadCount: 1,
					unreadCount: hasUnread(email) ? 1 : 0
				});
			} else {
				existing.threadCount += 1;
				existing.unreadCount += (hasUnread(email) ? 1 : 0);
				if (new Date(email.date).getTime() > new Date(existing.latestEmail.date).getTime()) {
					existing.latestEmail = email;
				}
			}
		});

		return Array.from(map.values()).sort((a, b) => new Date(b.latestEmail.date).getTime() - new Date(a.latestEmail.date).getTime());
	}, [allEmails, folder]);

	const leftPane = (
		<div className="flex flex-col h-full bg-sh-bg-dark">
			<div className="flex-1 overflow-y-auto no-scrollbar">
				{isRefreshing && emails.length === 0 ? (
					<EmailListSkeleton />
				) : contacts.length > 0 ? (
					<div>
						{contacts.map((contact) => {
							const isSelected = selectedContact === contact.emailAddress;
							const snippet = getSnippetText(contact.latestEmail.snippet);
							const unread = contact.unreadCount > 0;
							
							return (
								<div
									key={contact.emailAddress}
									role="button"
									tabIndex={0}
									onClick={() => setSelectedContact(contact.emailAddress)}
									onKeyDown={(e: React.KeyboardEvent) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											setSelectedContact(contact.emailAddress);
										}
									}}
									className={`group relative flex flex-col justify-center w-full text-left cursor-pointer transition-colors h-[48px] pr-4 ${
										isSelected ? "bg-sh-bg-selected" : "hover:bg-sh-bg-hover"
									} ${isSelected || unread ? "border-l-[3px] border-l-sh-accent pl-[29px]" : "border-l-[3px] border-l-transparent pl-[29px]"}`}
								>
									<span
										className={`truncate text-[15px] font-bold ${
											unread || isSelected ? "text-sh-text-white" : "text-sh-text-read"
										}`}
									>
										{contact.displayName}
									</span>
								</div>
							);
						})}
					</div>
				) : (
					<FolderEmptyState
						folder={folder}
						onCompose={() => startCompose()}
					/>
				)}
			</div>
			{totalCount > PAGE_SIZE && (
				<div className="flex justify-center py-3 border-t border-sh-border shrink-0">
					<Pagination
						page={page}
						setPage={setPage}
						perPage={PAGE_SIZE}
						totalCount={totalCount}
					/>
				</div>
			)}
		</div>
	);

	let centerPane: React.ReactNode;
	if (isComposing && !selectedEmailId) {
		centerPane = <ComposePanel />;
	} else if (isComposing && selectedEmailId) {
		centerPane = (
			<div className="relative flex flex-col h-full overflow-hidden">
				<div className="flex-1 overflow-y-auto min-h-0">
					<EmailPanel emailId={selectedEmailId} customThreadIds={customThreadIds} />
				</div>
				{/* Overlay compose panel taking up most of the height for full editing capability */}
				<div className="absolute bottom-0 left-0 right-0 h-[70%] flex flex-col shadow-[0_-10px_50px_rgba(0,0,0,0.6)] z-20 rounded-t-[8px] border-t border-x border-sh-border overflow-hidden bg-gradient-to-br from-[#1a1b33] via-[#1a1226] to-[#2d152a] backdrop-blur-xl">
					<ComposePanel />
				</div>
			</div>
		);
	} else if (selectedEmailId) {
		centerPane = <EmailPanel emailId={selectedEmailId} customThreadIds={customThreadIds} />;
	} else if (selectedContact) {
		const normalizedSelectedContact = selectedContact.toLowerCase();
		
		// Map to store grouped threads, keyed by a normalized thread identifier (either thread_id or normalized subject)
		const groupedThreadsMap = new Map<string, Email>();

		allEmails.forEach(e => {
			let contactStr = e.sender;
			if (folder === Folders.SENT || e.folder_id === Folders.SENT) {
				const recipients = e.recipient ? e.recipient.split(",") : [];
				if (recipients.length > 0) {
					contactStr = recipients[0].trim();
				}
			}

			const { emailAddress } = parseSenderInfo(contactStr);
			const eAddress = emailAddress || contactStr.split("@")[0] || "";
			
			if (eAddress.toLowerCase() === normalizedSelectedContact) {
				// We group purely by normalized subject to ensure replies always stay together in the contact view,
				// because the backend's thread_id can sometimes be inconsistent across sent/received boundaries.
				let subject = e.subject || "";
				// Strip out any amount of Re:, Fwd:, etc., even multiple ones like "Re: Fwd: Re: Lunch"
				subject = subject.replace(/^((re|fwd|fw|aw):\s*)+/ig, "").trim();
				// If the subject is empty after stripping, just use "(no subject)"
				const groupKey = subject.toLowerCase() || "(no subject)";

				const existing = groupedThreadsMap.get(groupKey);
				if (!existing) {
					groupedThreadsMap.set(groupKey, e);
				} else {
					// Keep the most recent email for the thread display
					if (new Date(e.date).getTime() > new Date(existing.date).getTime()) {
						groupedThreadsMap.set(groupKey, e);
					}
				}
			}
		});

		// Convert map values to array and sort by most recent
		const contactThreads = Array.from(groupedThreadsMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

		centerPane = (
			<div className="flex flex-col h-full bg-transparent">
				<div className="px-6 py-4 border-b border-sh-border flex items-center justify-between shrink-0">
					<h2 className="text-[14px] font-semibold text-sh-text-white truncate">Conversations with {contacts.find(c => c.emailAddress === normalizedSelectedContact)?.displayName || selectedContact}</h2>
				</div>
				<div className="flex-1 overflow-y-auto no-scrollbar">
					{contactThreads.map(email => {
						const isSelected = selectedEmailId === email.id;
						const snippet = getSnippetText(email.snippet);
						const unread = hasUnread(email);
						return (
							<div
								key={email.id}
								role="button"
								tabIndex={0}
								onClick={() => handleRowClick(email)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										handleRowClick(email);
									}
								}}
								className={`group relative flex items-center justify-between w-full text-left cursor-pointer transition-colors h-[48px] px-6 ${
									isSelected ? "bg-sh-bg-selected" : "hover:bg-sh-bg-hover"
								}`}
							>
								<div className="flex-1 min-w-0 flex items-baseline mr-4">
									<span className={`truncate text-[15px] font-bold ${unread ? "text-sh-text-white" : "text-sh-text-read"} shrink-0 max-w-[40%]`}>
										{email.subject || "(No Subject)"}
									</span>
									{snippet && (
										<span className="truncate text-[14px] text-sh-text-muted flex-1 ml-2">
											<span className="mr-2 text-sh-text-muted/50">—</span>
											{snippet}
										</span>
									)}
								</div>
								<span className="text-[12px] text-sh-text-muted shrink-0">
									{formatListDate(email.date)}
								</span>
							</div>
						);
					})}
				</div>
			</div>
		);
	} else {
		centerPane = (
			<div className="flex items-center justify-center h-full text-sh-text-muted text-[13px]">
				Select a contact
			</div>
		);
	}

	let rightPane: React.ReactNode | null = null;
	if (selectedContact) {
		rightPane = <SenderCard contactEmail={selectedContact} />;
	}

	return (
		<MailboxSplitView
			leftPane={leftPane}
			centerPane={centerPane}
			rightPane={rightPane}
		/>
	);
}
