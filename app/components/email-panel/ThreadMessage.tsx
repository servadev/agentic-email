// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Badge, Button, Tooltip } from "@cloudflare/kumo";
import {
	CaretDownIcon,
	CaretUpIcon,
	CodeIcon,
	PaperPlaneTiltIcon,
	PencilSimpleIcon,
	TrashIcon,
	ArrowBendUpLeftIcon,
} from "@phosphor-icons/react";
import EmailAttachmentList from "~/components/EmailAttachmentList";
import EmailIframe from "~/components/EmailIframe";
import {
	formatDetailDate,
	formatShortDate,
	rewriteInlineImages,
	stripHtml,
} from "~/lib/utils";
import type { Email, ContactData } from "~/types";
import { useParams } from "react-router";
import { useContacts } from "~/queries/contacts";

interface ThreadMessageProps {
	email: Email;
	mailboxId?: string;
	mailboxEmail?: string;
	isLast: boolean;
	isDraft?: boolean;
	isSending?: boolean;
	isExpanded: boolean;
	onToggleExpand: () => void;
	onSendDraft?: () => void;
	onEditDraft?: () => void;
	onDeleteDraft?: () => void;
	onReply?: () => void;
	onViewSource?: () => void;
	onPreviewImage?: (url: string, filename: string) => void;
}

function Avatar({ isDraft, isSelf, sender, contact }: { isDraft?: boolean; isSelf: boolean; sender: string; contact?: ContactData }) {
	if (contact?.avatarUrl && !isDraft) {
		return (
			<img src={contact.avatarUrl} alt={contact.displayName || sender || 'Contact avatar'} className="h-8 w-8 shrink-0 rounded-[2px] object-cover" />
		);
	}
	
	return (
		<div
			className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] text-[12px] font-bold ${
				isDraft
					? "bg-sh-bg-hover text-sh-text-muted"
					: isSelf
						? "bg-sh-accent text-sh-text-white"
						: "bg-sh-bg-hover text-sh-text-white"
			}`}
		>
			{isDraft ? "D" : sender.charAt(0).toUpperCase()}
		</div>
	);
}

export default function ThreadMessage({
	email,
	mailboxId,
	mailboxEmail,
	isLast,
	isDraft,
	isSending,
	isExpanded,
	onToggleExpand,
	onSendDraft,
	onEditDraft,
	onDeleteDraft,
	onReply,
	onViewSource,
	onPreviewImage,
}: ThreadMessageProps) {
	const { data: contactsData = [] } = useContacts(mailboxId);
	
	const isSelf = email.sender === mailboxEmail;
	const contact = contactsData.find(c => c.id === (isSelf ? mailboxEmail : email.sender)?.toLowerCase());
	const containerClassName = `${!isLast ? "border-b border-sh-border" : ""} ${isDraft ? "border-l-2 border-l-sh-accent bg-sh-accent/5" : ""}`;
	const senderLabel = isDraft ? "Draft reply" : isSelf ? "You" : (contact?.displayName || email.sender);

	if (!isExpanded) {
		return (
			<div className={containerClassName}>
				<button
					type="button"
					onClick={onToggleExpand}
					className="w-full flex items-center gap-3 px-4 py-3 hover:bg-sh-bg-hover rounded-[2px] text-left focus:outline-none focus:ring-2 focus:ring-sh-accent transition-colors"
				>
					<Avatar isDraft={isDraft} isSelf={isSelf} sender={email.sender} contact={contact} />
					<div className="flex-1 min-w-0">
						<div className="flex items-center justify-between">
							<span className="text-[13px] font-medium text-sh-text-white truncate">
								{senderLabel}
							</span>
							<span className="text-[12px] text-sh-text-muted shrink-0">
								{formatDetailDate(email.date)}
							</span>
						</div>
						<p className="text-[12px] text-sh-text-muted truncate">
							{stripHtml(email.body || "").slice(0, 80)}
						</p>
					</div>
					<CaretDownIcon size={14} className="text-sh-text-muted shrink-0" />
				</button>
			</div>
		);
	}

	const iconBtnClass = "p-1 text-sh-text-muted hover:text-sh-text-white hover:bg-sh-bg-hover transition-colors rounded-[2px] focus:outline-none focus:ring-2 focus:ring-sh-accent flex items-center justify-center";

	return (
		<div className={`group/thread-msg ${containerClassName}`}>
			<div className="px-4 py-4 md:px-6">
				<div className="flex items-center justify-between gap-3 mb-3">
					<div className="flex items-center gap-2.5 min-w-0">
						<button
							type="button"
							onClick={onToggleExpand}
							className="shrink-0 focus:outline-none focus:ring-2 focus:ring-sh-accent rounded-[2px]"
							aria-label="Collapse message"
						>
							<div className="cursor-pointer hover:opacity-80 transition-opacity">
								<Avatar isDraft={isDraft} isSelf={isSelf} sender={email.sender} contact={contact} />
							</div>
						</button>
						<div className="min-w-0">
							<div className="flex items-center gap-2">
								<span className="text-[13px] font-medium text-sh-text-white truncate">
									{senderLabel}
								</span>
								{isDraft && <span className="text-[10px] uppercase tracking-wider font-bold border border-sh-border-thin px-1.5 py-0.5 rounded text-sh-text-muted">Draft</span>}
							</div>
							<div className="text-[12px] text-sh-text-muted">To: {email.recipient}</div>
						</div>
					</div>
					<div className="flex items-center gap-1 shrink-0">
						<span className="text-[12px] text-sh-text-muted mr-2">
							{formatShortDate(email.date)}
						</span>
						{onReply && (
							<Tooltip content="Reply" side="bottom" asChild>
								<button type="button" onClick={onReply} aria-label="Reply" className={iconBtnClass}>
									<ArrowBendUpLeftIcon size={14} />
								</button>
							</Tooltip>
						)}
						{onViewSource && (
							<Tooltip content="View source" side="bottom" asChild>
								<button type="button" onClick={onViewSource} aria-label="View source" className={iconBtnClass}>
									<CodeIcon size={14} />
								</button>
							</Tooltip>
						)}
						<button
							type="button"
							onClick={onToggleExpand}
							className={iconBtnClass}
							aria-label="Collapse message"
						>
							<CaretUpIcon size={14} />
						</button>
					</div>
				</div>

				<div className="md:ml-[42px]">
					<EmailIframe
						body={rewriteInlineImages(
							email.body || "",
							mailboxId || "",
							email.id,
							email.attachments,
						)}
						autoSize
					/>
				</div>

				{isDraft && (onSendDraft || onEditDraft || onDeleteDraft) && (
					<div className="flex gap-2 mt-3 md:ml-[42px]">
						{onSendDraft && (
							<button
								type="button"
								onClick={onSendDraft}
								disabled={isSending}
								className="flex items-center gap-1.5 bg-sh-accent hover:bg-opacity-90 text-sh-text-white px-3 py-1 rounded-[2px] text-[12px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sh-accent disabled:opacity-50"
							>
								<PaperPlaneTiltIcon size={14} />
								{isSending ? "Sending..." : "Send"}
							</button>
						)}
						{onEditDraft && (
							<button
								type="button"
								onClick={onEditDraft}
								disabled={isSending}
								className="flex items-center gap-1.5 bg-sh-bg-hover text-sh-text-white px-3 py-1 rounded-[2px] text-[12px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sh-accent"
							>
								<PencilSimpleIcon size={14} />
								Edit
							</button>
						)}
						{onDeleteDraft && (
							<button
								type="button"
								onClick={onDeleteDraft}
								disabled={isSending}
								className="flex items-center gap-1.5 hover:bg-red-500/20 text-red-500 hover:text-red-400 px-3 py-1 rounded-[2px] text-[12px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
							>
								<TrashIcon size={14} />
								Delete
							</button>
						)}
					</div>
				)}
			</div>

			<EmailAttachmentList
				mailboxId={mailboxId}
				emailId={email.id}
				attachments={email.attachments}
				onPreviewImage={onPreviewImage}
				className="px-4 py-3 md:px-6 md:ml-[42px]"
			/>
		</div>
	);
}
