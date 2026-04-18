// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import type { ReactNode } from "react";
import ComposePanel from "~/components/ComposePanel";
import EmailPanel from "~/components/EmailPanel";
import SenderCard from "~/components/SenderCard";
import { useUIStore } from "~/hooks/useUIStore";

interface MailboxSplitViewProps {
	selectedEmailId: string | null;
	isComposing: boolean;
	children: ReactNode;
}

export default function MailboxSplitView({
	selectedEmailId,
	isComposing,
	children,
}: MailboxSplitViewProps) {
	// On mobile, the panel is open if something is selected or composing.
	// On desktop, the layout is fixed: List, Content, Sender (if selected).
	const isMobilePanelOpen = selectedEmailId !== null || isComposing;
	const { isSenderCardOpen } = useUIStore();

	return (
		<div className="flex h-full bg-sh-bg-dark text-sh-text-white">
			{/* Left Pane: Thread List */}
			<div
				className={`flex flex-col min-w-0 shrink-0 ${
					isMobilePanelOpen
						? "hidden md:flex md:w-64"
						: "flex w-full md:w-64"
				}`}
			>
				{children}
			</div>
			
			{/* Resize Handle between list and email view (always visible on desktop) */}
			<div className="hidden md:block w-[1px] bg-sh-border cursor-col-resize hover:bg-sh-accent transition-colors shrink-0" />

			{/* Centre Pane: Email Thread Content */}
			<div className={`flex-1 flex-col min-w-0 overflow-hidden ${
				isMobilePanelOpen 
					? (isSenderCardOpen && selectedEmailId ? "hidden md:flex" : "flex") 
					: "hidden md:flex"
			} w-full md:w-auto`}>
				{isComposing && !selectedEmailId ? (
					<ComposePanel />
				) : isComposing && selectedEmailId ? (
					<div className="flex flex-col h-full overflow-y-auto">
						<ComposePanel />
						<div className="border-t border-sh-border">
							<EmailPanel emailId={selectedEmailId} />
						</div>
					</div>
				) : selectedEmailId ? (
					<EmailPanel emailId={selectedEmailId} />
				) : (
					<div className="flex items-center justify-center h-full text-sh-text-muted text-[13px]">
						Select a conversation
					</div>
				)}
			</div>

			{/* Resize Handle between email view and sender card */}
			{selectedEmailId && (
				<div className="hidden md:block w-[1px] bg-sh-border cursor-col-resize hover:bg-sh-accent transition-colors shrink-0" />
			)}

			{/* Right Pane: Sender Card */}
			{selectedEmailId && (
				<div
					className={`flex flex-col min-w-0 shrink-0 ${isSenderCardOpen ? "flex" : "hidden md:flex"} w-full md:w-72 bg-sh-bg-panel`}
				>
					<SenderCard emailId={selectedEmailId} />
				</div>
			)}
		</div>
	);
}
