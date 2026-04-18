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
		<div className="flex h-full bg-sh-bg-dark text-sh-text-white relative overflow-hidden">
			{/* Left Pane: Thread List (Takes up all available space until panel opens) */}
			<div
				className={`flex flex-col min-w-0 shrink-0 flex-1 ${
					isMobilePanelOpen
						? "hidden md:flex"
						: "flex w-full"
				}`}
			>
				{children}
			</div>
			
			{/* Resize Handle between list and email view (always visible on desktop if panel is open) */}
			{isMobilePanelOpen && (
				<div className="hidden md:block w-[1px] bg-sh-border cursor-col-resize hover:bg-sh-accent transition-colors shrink-0" />
			)}

			{/* Centre Pane: Email Thread Content (Fixed wide panel on the right) */}
			<div className={`flex-col min-w-0 overflow-hidden ${
				isMobilePanelOpen 
					? (isSenderCardOpen && selectedEmailId ? "hidden md:flex" : "flex") 
					: "hidden"
			} w-full md:w-[600px] xl:w-[700px] shrink-0 bg-sh-bg-dark border-l border-sh-border`}>
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
				) : null}
			</div>

			{/* Resize Handle between email view and sender card */}
			{selectedEmailId && isSenderCardOpen && (
				<div className="hidden md:block w-[1px] bg-sh-border cursor-col-resize hover:bg-sh-accent transition-colors shrink-0" />
			)}

			{/* Right Pane: Sender Card */}
			{selectedEmailId && isSenderCardOpen && (
				<div
					className={`flex flex-col min-w-0 shrink-0 ${isSenderCardOpen ? "flex" : "hidden md:flex"} w-full md:w-72 bg-sh-bg-panel border-l border-sh-border`}
				>
					<SenderCard emailId={selectedEmailId} />
				</div>
			)}
		</div>
	);
}
