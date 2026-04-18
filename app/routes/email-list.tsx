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
import { getSnippetText } from "~/lib/utils";
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

export default function EmailListRoute() {
	const { mailboxId, folder } = useParams<{
		mailboxId: string;
		folder: string;
	}>();
	const {
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
	} = useEmails(mailboxId, params, { refetchInterval: 30_000 });

	const emails = emailData?.emails ?? [];
	const totalCount = emailData?.totalCount ?? 0;

	const { data: folders = [] } = useFolders(mailboxId);

	const folderName = useMemo(() => {
		const found = folders.find((f) => f.id === folder);
		if (found) return found.name;
		return folder ? folder.charAt(0).toUpperCase() + folder.slice(1) : "Inbox";
	}, [folders, folder]);

	const isPanelOpen = selectedEmailId !== null || isComposing;

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

	const formatParticipants = (email: Email): string => {
		const target = folder === "sent" ? email.recipient : email.sender;
		if (!target) return "";

		return target
			.split(",")
			.map((part) => {
				const match = part.match(/(.*)<(.*)>/);
				if (match && match[1].trim()) {
					return match[1].replace(/^"|"$/g, "").trim();
				}
				return part.split("@")[0].trim();
			})
			.filter(Boolean)
			.filter((name, idx, arr) => arr.indexOf(name) === idx)
			.join(", ");
	};

	return (
		<MailboxSplitView
			selectedEmailId={selectedEmailId}
			isComposing={isComposing}
		>
				{/* Email rows */}
				<div className="flex-1 overflow-y-auto no-scrollbar">
				{isRefreshing && emails.length === 0 ? (
					<EmailListSkeleton />
				) : emails.length > 0 ? (
						<div>
							{emails.map((email) => {
								const isSelected = selectedEmailId === email.id;
								const snippet = getSnippetText(email.snippet);
								const unread = hasUnread(email);
								
								return (
									<div
										key={email.id}
										role="button"
										tabIndex={0}
										onClick={() => handleRowClick(email)}
										onKeyDown={(e: React.KeyboardEvent) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												handleRowClick(email);
											}
										}}
										className={`group relative flex items-center w-full text-left cursor-pointer transition-colors border-b border-sh-border-thin h-[48px] px-3 ${
											isSelected ? "bg-sh-bg-selected" : "hover:bg-sh-bg-hover"
										} ${unread ? "border-l-[3px] border-l-sh-accent pl-[9px]" : "border-l-[3px] border-l-transparent pl-[9px]"}`}
									>
										{/* Star (revealed on hover or if already starred) */}
										<button
											type="button"
											className={`shrink-0 p-1 mr-2 bg-transparent border-0 cursor-pointer transition-opacity ${email.starred ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
											onClick={(e: React.MouseEvent) => {
												e.stopPropagation();
												toggleStar(e, email);
											}}
										>
											<StarIcon
												size={16}
												weight={email.starred ? "fill" : "regular"}
												className={
													email.starred
														? "text-[#eab308]"
														: "text-sh-text-muted hover:text-[#eab308]"
												}
											/>
										</button>

										{/* Content */}
										<div className="min-w-0 flex-1 flex items-baseline gap-2">
											<span
												className={`truncate w-32 shrink-0 text-[13px] ${
													unread ? "font-semibold text-sh-text-white" : "text-sh-text-read"
												}`}
											>
												{formatParticipants(email)}
											</span>
											
											<div className="flex-1 min-w-0 flex items-baseline gap-2 truncate">
												<span
													className={`truncate text-[13px] ${
														unread ? "text-sh-text-white" : "text-sh-text-read"
													}`}
												>
													{email.subject}
												</span>
												{snippet && (
													<span className="truncate text-[12px] text-sh-text-muted">
														{snippet}
													</span>
												)}
											</div>
										</div>

										{/* Hover actions */}
										<div className="hidden group-hover:flex items-center shrink-0 ml-2">
											<Tooltip content={email.read ? "Mark unread" : "Mark read"} asChild>
												<button
													className="p-1 text-sh-text-muted hover:text-sh-text-white transition-colors"
													onClick={(e: React.MouseEvent) => {
														e.stopPropagation();
														if (mailboxId)
															updateEmail.mutate({
																mailboxId,
																id: email.id,
																data: { read: !email.read },
															});
													}}
													aria-label={email.read ? "Mark unread" : "Mark read"}
												>
													{email.read ? <EnvelopeSimpleIcon size={14} /> : <EnvelopeOpenIcon size={14} />}
												</button>
											</Tooltip>
											<Tooltip content="Delete" asChild>
												<button
													className="p-1 text-sh-text-muted hover:text-sh-text-white transition-colors"
													onClick={(e: React.MouseEvent) => handleDelete(e, email.id)}
													aria-label="Delete"
												>
													<TrashIcon size={14} />
												</button>
											</Tooltip>
										</div>
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

				{/* Pagination */}
				{totalCount > PAGE_SIZE && (
					<div className="flex justify-center py-3 border-t border-kumo-line shrink-0">
						<Pagination
							page={page}
							setPage={setPage}
							perPage={PAGE_SIZE}
							totalCount={totalCount}
						/>
					</div>
				)}
		</MailboxSplitView>
	);
}
