// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Loader } from "@cloudflare/kumo";
import { PlugsIcon, RobotIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import MCPPanel from "./MCPPanel";
import { useUIStore } from "~/hooks/useUIStore";

function LazyAgentPanel() {
	const [AgentChat, setAgentChat] = useState<React.ComponentType | null>(
		null,
	);
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		import("~/components/AgentPanel").then((mod) => {
			setAgentChat(() => mod.default);
		}).catch((err) => {
			console.error("Failed to load AgentPanel:", err);
			setLoadError("Failed to load agent panel");
		});
	}, []);

	if (loadError) {
		return (
			<div className="flex items-center justify-center h-full">
				<span className="text-xs text-kumo-error">{loadError}</span>
			</div>
		);
	}
	if (!AgentChat) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-2">
				<Loader size="base" />
				<span className="text-xs text-kumo-subtle">Loading agent...</span>
			</div>
		);
	}
	return <AgentChat />;
}

export default function AgentSidebar() {
	const [activeTab, setActiveTab] = useState<"agent" | "mcp">("agent");
	const { toggleAgentPanel } = useUIStore();

	return (
		<div className="flex flex-col h-full bg-sh-bg-panel">
			{/* Slim Header */}
			<div className="flex items-center justify-between px-4 h-[32px] border-b border-sh-border shrink-0">
				<div className="flex items-center gap-4">
					<button
						type="button"
						onClick={() => setActiveTab("agent")}
						className={`text-[11px] tracking-wider uppercase font-semibold transition-colors ${
							activeTab === "agent"
								? "text-sh-text-white"
								: "text-sh-text-muted hover:text-sh-text-read"
						}`}
					>
						Agent
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("mcp")}
						className={`text-[11px] tracking-wider uppercase font-semibold transition-colors ${
							activeTab === "mcp"
								? "text-sh-text-white"
								: "text-sh-text-muted hover:text-sh-text-read"
						}`}
					>
						MCP
					</button>
				</div>
				<button
					type="button"
					onClick={() => toggleAgentPanel()}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							toggleAgentPanel();
						}
					}}
					className="p-1 text-sh-text-muted hover:text-sh-text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sh-accent rounded-[2px]"
					aria-label="Close panel"
				>
					<XIcon size={14} />
				</button>
			</div>

			{/* Tab content */}
			<div className="flex-1 min-h-0 overflow-hidden">
				<div className={activeTab === "agent" ? "h-full" : "hidden"}>
					<LazyAgentPanel />
				</div>
				{activeTab === "mcp" && <MCPPanel />}
			</div>
		</div>
	);
}
