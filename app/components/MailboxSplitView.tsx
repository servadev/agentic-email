// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import type { ReactNode } from "react";
import ComposePanel from "~/components/ComposePanel";
import EmailPanel from "~/components/EmailPanel";
import SenderCard from "~/components/SenderCard";
import { useUIStore } from "~/hooks/useUIStore";

interface MailboxSplitViewProps {
	leftPane: ReactNode;
	centerPane: ReactNode;
	rightPane: ReactNode | null;
}

export default function MailboxSplitView({
	leftPane,
	centerPane,
	rightPane,
}: MailboxSplitViewProps) {
	// On mobile, the panel is open if something is selected or composing.
	const { selectedContact, selectedEmailId, isComposing, isSenderCardOpen } = useUIStore();
	const isMobilePanelOpen = selectedContact !== null || selectedEmailId !== null || isComposing;

	return (
		<div className="flex h-full bg-sh-bg-dark text-sh-text-white">
			{/* Left Pane: Contact List */}
			<div
				className={`flex flex-col min-w-0 shrink-0 border-r border-sh-border ${
					isMobilePanelOpen
						? "hidden md:flex md:w-64"
						: "flex w-full md:w-64"
				}`}
			>
				{leftPane}
			</div>

			{/* Centre Pane: Thread List or Content */}
			<div className={`flex-1 flex-col min-w-0 overflow-hidden ${
				isMobilePanelOpen 
					? (isSenderCardOpen && rightPane ? "hidden md:flex" : "flex") 
					: "hidden md:flex"
			} w-full md:w-auto`}>
				{centerPane}
			</div>

			{/* Right Pane: Context or Sender */}
			{rightPane && (
				<>
					<div className="hidden md:block w-[1px] bg-sh-border cursor-col-resize hover:bg-sh-accent transition-colors shrink-0" />
					<div
						className={`flex flex-col min-w-0 shrink-0 ${isSenderCardOpen ? "flex" : "hidden md:flex"} w-full md:w-72 bg-transparent`}
					>
						{rightPane}
					</div>
				</>
			)}
		</div>
	);
}
