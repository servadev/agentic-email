// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import DOMPurify from "dompurify";
import { useCallback, useEffect, useRef, useState } from "react";

interface EmailIframeProps {
	body: string;
	/** When true, iframe auto-sizes to content height instead of filling parent */
	autoSize?: boolean;
}

/**
 * Renders email HTML inside a sandboxed iframe.
 *
 * Security model:
 * - DOMPurify sanitises the HTML before injection.
 * - The iframe sandbox does NOT include `allow-same-origin`, so even if
 *   DOMPurify has a bypass the attacker's code runs in an opaque origin
 *   with no access to the parent page's cookies, DOM, or API.
 * - Because the iframe is cross-origin we cannot read `contentDocument`
 *   for auto-sizing. Instead, the injected HTML includes a tiny inline
 *   script that posts its body height to the parent via `postMessage`.
 *   The `allow-scripts` flag is required for this, but scripts inside
 *   the opaque-origin sandbox cannot access anything useful.
 * - A strict CSP meta tag blocks external resource loads inside the
 *   iframe as a defense-in-depth layer.
 */
export default function EmailIframe({ body, autoSize }: EmailIframeProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [height, setHeight] = useState(autoSize ? 100 : 0);

	// Listen for height reports from the sandboxed iframe
	const handleMessage = useCallback(
		(event: MessageEvent) => {
			if (!autoSize) return;
			// Only accept messages from our own iframe
			if (event.source !== iframeRef.current?.contentWindow) return;
			if (
				event.data &&
				typeof event.data === "object" &&
				event.data.__emailIframeHeight &&
				typeof event.data.height === "number" &&
				event.data.height > 0
			) {
				setHeight(event.data.height);
			}
		},
		[autoSize],
	);

	useEffect(() => {
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [handleMessage]);

	useEffect(() => {
		const iframe = iframeRef.current;
		if (!iframe || !body) return;

		const cleanBody = DOMPurify.sanitize(body, {
			USE_PROFILES: { html: true },
			FORBID_TAGS: ["style"],
			ADD_ATTR: ["target"],
			FORCE_BODY: true,
		});

		const padding = autoSize ? "0" : "24px";

		// JS injected to find common quote containers and hide them behind a toggle
		const hideQuotesScript = `<script>
			function hideQuotes() {
				// Common selectors for quoted email trails
				var quoteSelectors = [
					'div.gmail_quote',
					'blockquote[type="cite"]',
					'div.moz-cite-prefix',
					'div.yahoo_quoted',
					'div#appendonsend'
				];
				
				var quotes = document.querySelectorAll(quoteSelectors.join(','));
				quotes.forEach(function(quote) {
					if (quote.dataset.collapsed === "true") return; // already processed
					quote.dataset.collapsed = "true";
					
					var wrapper = document.createElement('details');
					var summary = document.createElement('summary');
					summary.innerHTML = '<span class="quote-toggle-dots">•••</span>';
					summary.className = 'quote-summary';
					
					// Insert wrapper before the quote, move quote inside wrapper
					quote.parentNode.insertBefore(wrapper, quote);
					wrapper.appendChild(summary);
					wrapper.appendChild(quote);
				});
			}
			hideQuotes();
			setTimeout(hideQuotes, 100);
		</script>`;

		// Height-reporting script: sends body.scrollHeight to the parent.
		// Runs inside the opaque-origin sandbox so it has zero access to
		// the parent page — it can only postMessage.
		const heightScript = autoSize
			? `<script>
				function reportHeight() {
					var h = document.body.scrollHeight;
					if (h > 0) parent.postMessage({ __emailIframeHeight: true, height: h }, "*");
				}
				reportHeight();
				setTimeout(reportHeight, 50);
				setTimeout(reportHeight, 150);
				setTimeout(reportHeight, 400);
			<\/script>`
			: "";

		// Use srcdoc so the iframe is truly sandboxed (no same-origin access).
		// We can't use doc.write() because that requires allow-same-origin.
		iframe.srcdoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data: cid: https:; script-src 'unsafe-inline';">
<style>
* { box-sizing: border-box; }
html {
	background: transparent !important;
}
body {
	font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	font-size: 13px;
	line-height: 1.4;
	color: #ffffff;
	background: transparent !important;
	padding: ${padding};
	margin: 0;
	word-wrap: break-word;
	overflow-wrap: break-word;
	${autoSize ? "overflow: hidden;" : ""}
}
[style*="position: fixed"], [style*="position:fixed"], [style*="position: absolute"], [style*="position:absolute"] {
	position: relative !important;
}
a { color: #e8500a; }
img { max-width: 100%; height: auto; }
blockquote {
	border-left: 3px solid #333333;
	padding-left: 1em;
	margin-left: 0;
	color: #888888;
}
pre {
	background: #1e1e1e;
	padding: 12px;
	border-radius: 2px;
	overflow-x: auto;
	font-size: 12px;
	color: #aaaaaa;
}
table { border-collapse: collapse; max-width: 100%; }
td, th { padding: 4px 8px; border: 1px solid #333333; }
p { margin: 4px 0; }
h1, h2, h3 { margin: 8px 0 4px; color: #ffffff; }
ul, ol { padding-left: 20px; margin: 4px 0; }

details { margin-top: 12px; }
summary.quote-summary { 
	cursor: pointer; 
	list-style: none; 
	display: inline-flex;
	align-items: center;
	padding: 2px 6px;
	border-radius: 4px;
	background: rgba(255, 255, 255, 0.08);
	transition: background 0.15s ease;
	font-size: 11px;
	color: #aaaaaa;
}
summary.quote-summary::-webkit-details-marker { display: none; }
summary.quote-summary:hover { background: rgba(255, 255, 255, 0.15); }
.quote-toggle-dots { letter-spacing: 2px; line-height: 1; margin-bottom: 2px; }

</style>
</head>
<body>${cleanBody}${hideQuotesScript}${heightScript}</body>
</html>`;
	}, [body, autoSize]);

	return (
		<iframe
			ref={iframeRef}
			className="block w-full border-0 bg-transparent"
			style={autoSize ? { height: `${height}px` } : { height: "100%" }}
			sandbox="allow-scripts allow-popups allow-top-navigation-by-user-activation"
			title="Email content"
			allowTransparency={true}
		/>
	);
}
