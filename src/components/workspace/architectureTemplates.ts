/**
 * architectureTemplates.ts — FlowState template library.
 *
 * A catalog of ready-to-draw architecture graphs, from small starters to large
 * production-scale systems modelled on real companies (Netflix, Spotify, Amazon,
 * WhatsApp, Uber, etc.). Each template is a {nodes, edges} graph consumed by the
 * canvas draw engine's auto-layout, so they render clean and connected.
 *
 * Node `type` must be one of the canvas node types:
 *   client, server, database, cache, queue, gateway, cdn, loadbalancer,
 *   auth, storage, microservice, external_api, firewall, dns
 */

export type TemplateGraph = {
    title?: string;
    nodes: { name: string; type: string; layer?: number }[];
    edges: { from: string; to: string; label?: string }[];
};

export type Template = {
    id: string;
    label: string;
    desc: string;
    category: string;
    scale: "basic" | "large";
    tags: string[];
    graph: TemplateGraph;
};

// Small helper to keep template definitions terse.
const n = (name: string, type: string, layer: number) => ({ name, type, layer });
const e = (from: string, to: string, label?: string) => ({ from, to, label });

export const TEMPLATE_CATEGORIES = [
    "Fundamentals",
    "Streaming & Media",
    "E-Commerce & Retail",
    "Social & Messaging",
    "Mobility & Delivery",
    "Fintech & Payments",
    "Data & AI",
    "SaaS & Productivity",
    "Gaming & Realtime",
] as const;

export const ARCHITECTURE_TEMPLATES: Template[] = [
    // ─────────────────────────────────────────────────────────────────────────
    // FUNDAMENTALS (basic starters)
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: "3tier", label: "3-Tier Web App", category: "Fundamentals", scale: "basic",
        desc: "Classic web / app / database layering behind a load balancer.",
        tags: ["web", "starter", "load balancer", "sql"],
        graph: {
            title: "3-Tier Web App",
            nodes: [n("Users", "client", 0), n("Load Balancer", "loadbalancer", 1), n("Web Server", "server", 2), n("App Server", "server", 2), n("Primary DB", "database", 3)],
            edges: [e("Users", "Load Balancer", "HTTPS"), e("Load Balancer", "Web Server"), e("Web Server", "App Server", "API"), e("App Server", "Primary DB", "SQL")],
        },
    },
    {
        id: "serverless", label: "Serverless API", category: "Fundamentals", scale: "basic",
        desc: "API Gateway + functions + managed data, fully event-driven.",
        tags: ["serverless", "lambda", "api", "starter"],
        graph: {
            title: "Serverless API",
            nodes: [n("Client", "client", 0), n("API Gateway", "gateway", 1), n("Auth", "auth", 1), n("Function", "microservice", 2), n("NoSQL DB", "database", 3), n("Object Storage", "storage", 3)],
            edges: [e("Client", "API Gateway", "HTTPS"), e("API Gateway", "Auth", "verify"), e("API Gateway", "Function", "invoke"), e("Function", "NoSQL DB"), e("Function", "Object Storage")],
        },
    },
    {
        id: "microservices", label: "Microservices", category: "Fundamentals", scale: "basic",
        desc: "Gateway routing to independent services with a message queue.",
        tags: ["microservices", "queue", "starter"],
        graph: {
            title: "Microservices Platform",
            nodes: [n("Client", "client", 0), n("API Gateway", "gateway", 1), n("Orders Service", "microservice", 2), n("Payments Service", "microservice", 2), n("Message Queue", "queue", 2), n("Orders DB", "database", 3), n("Cache", "cache", 3)],
            edges: [e("Client", "API Gateway"), e("API Gateway", "Orders Service"), e("API Gateway", "Payments Service"), e("Orders Service", "Message Queue", "publish"), e("Payments Service", "Message Queue", "subscribe"), e("Orders Service", "Orders DB"), e("Orders Service", "Cache")],
        },
    },
    {
        id: "eventdriven", label: "Event-Driven Pipeline", category: "Fundamentals", scale: "basic",
        desc: "Ingest → queue → processors → storage, decoupled and scalable.",
        tags: ["events", "queue", "pipeline", "starter"],
        graph: {
            title: "Event-Driven Pipeline",
            nodes: [n("Producers", "client", 0), n("Ingest Gateway", "gateway", 1), n("Event Queue", "queue", 2), n("Processor", "microservice", 2), n("Analytics DB", "database", 3), n("Data Lake", "storage", 3)],
            edges: [e("Producers", "Ingest Gateway"), e("Ingest Gateway", "Event Queue", "emit"), e("Event Queue", "Processor", "consume"), e("Processor", "Analytics DB"), e("Processor", "Data Lake")],
        },
    },
    {
        id: "static-spa", label: "Static SPA + CDN", category: "Fundamentals", scale: "basic",
        desc: "Single-page app served from a CDN calling a lightweight API.",
        tags: ["spa", "cdn", "static", "starter"],
        graph: {
            title: "Static SPA + CDN",
            nodes: [n("Browser", "client", 0), n("CDN", "cdn", 1), n("Static Storage", "storage", 2), n("API Gateway", "gateway", 2), n("Backend", "server", 3), n("Database", "database", 4)],
            edges: [e("Browser", "CDN", "assets"), e("CDN", "Static Storage"), e("Browser", "API Gateway", "XHR"), e("API Gateway", "Backend"), e("Backend", "Database")],
        },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // STREAMING & MEDIA
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: "netflix", label: "Netflix-scale Video Streaming", category: "Streaming & Media", scale: "large",
        desc: "Global video streaming with CDN edge, recommendations and encoding pipeline.",
        tags: ["netflix", "video", "streaming", "cdn", "recommendations"],
        graph: {
            title: "Netflix-scale Streaming",
            nodes: [
                n("Smart TV / Mobile / Web", "client", 0),
                n("DNS / GeoDNS", "dns", 1), n("Edge CDN (OpenConnect)", "cdn", 1),
                n("API Gateway", "gateway", 2), n("Auth Service", "auth", 2), n("Load Balancer", "loadbalancer", 2),
                n("Playback Service", "microservice", 3), n("Recommendation Service", "microservice", 3), n("Catalog Service", "microservice", 3), n("User Service", "microservice", 3), n("Billing Service", "microservice", 3),
                n("Encoding Pipeline", "microservice", 4), n("Event Bus (Kafka)", "queue", 4),
                n("Metadata DB", "database", 5), n("User DB", "database", 5), n("Rec Cache", "cache", 5), n("Video Storage (S3)", "storage", 5), n("Analytics Warehouse", "database", 5),
            ],
            edges: [
                e("Smart TV / Mobile / Web", "DNS / GeoDNS", "resolve"), e("Smart TV / Mobile / Web", "Edge CDN (OpenConnect)", "stream"), e("Smart TV / Mobile / Web", "API Gateway", "API"),
                e("API Gateway", "Auth Service"), e("API Gateway", "Load Balancer"),
                e("Load Balancer", "Playback Service"), e("Load Balancer", "Recommendation Service"), e("Load Balancer", "Catalog Service"), e("Load Balancer", "User Service"), e("Load Balancer", "Billing Service"),
                e("Playback Service", "Video Storage (S3)"), e("Edge CDN (OpenConnect)", "Video Storage (S3)", "origin pull"),
                e("Recommendation Service", "Rec Cache"), e("Recommendation Service", "Analytics Warehouse"),
                e("Catalog Service", "Metadata DB"), e("User Service", "User DB"),
                e("Playback Service", "Event Bus (Kafka)", "events"), e("Event Bus (Kafka)", "Analytics Warehouse"),
                e("Encoding Pipeline", "Video Storage (S3)"), e("Catalog Service", "Encoding Pipeline", "ingest"),
            ],
        },
    },
    {
        id: "spotify", label: "Spotify-scale Audio Streaming", category: "Streaming & Media", scale: "large",
        desc: "Music streaming with playlists, personalization and audio delivery.",
        tags: ["spotify", "audio", "music", "streaming", "playlists"],
        graph: {
            title: "Spotify-scale Audio",
            nodes: [
                n("Mobile / Desktop / Web", "client", 0),
                n("Audio CDN", "cdn", 1), n("API Gateway", "gateway", 1),
                n("Auth Service", "auth", 2), n("Streaming Service", "microservice", 2), n("Playlist Service", "microservice", 2), n("Search Service", "microservice", 2), n("Personalization Service", "microservice", 2), n("Ad Service", "microservice", 2),
                n("Event Stream (Kafka)", "queue", 3),
                n("Track Storage", "storage", 4), n("Metadata DB", "database", 4), n("Playlist DB", "database", 4), n("Search Index", "database", 4), n("Feature Store", "cache", 4), n("Analytics Lake", "storage", 4),
            ],
            edges: [
                e("Mobile / Desktop / Web", "Audio CDN", "stream"), e("Mobile / Desktop / Web", "API Gateway", "API"),
                e("API Gateway", "Auth Service"), e("API Gateway", "Streaming Service"), e("API Gateway", "Playlist Service"), e("API Gateway", "Search Service"), e("API Gateway", "Personalization Service"), e("API Gateway", "Ad Service"),
                e("Streaming Service", "Track Storage"), e("Audio CDN", "Track Storage", "origin"),
                e("Playlist Service", "Playlist DB"), e("Search Service", "Search Index"),
                e("Personalization Service", "Feature Store"), e("Streaming Service", "Event Stream (Kafka)", "plays"),
                e("Event Stream (Kafka)", "Analytics Lake"), e("Personalization Service", "Analytics Lake"), e("Streaming Service", "Metadata DB"),
            ],
        },
    },
    {
        id: "youtube", label: "YouTube-scale UGC Video", category: "Streaming & Media", scale: "large",
        desc: "User-uploaded video with transcoding, moderation, and global delivery.",
        tags: ["youtube", "video", "ugc", "transcoding", "upload"],
        graph: {
            title: "YouTube-scale UGC Video",
            nodes: [
                n("Creators / Viewers", "client", 0),
                n("CDN", "cdn", 1), n("API Gateway", "gateway", 1),
                n("Upload Service", "microservice", 2), n("Video Service", "microservice", 2), n("Search Service", "microservice", 2), n("Comment Service", "microservice", 2), n("Recommendation Service", "microservice", 2),
                n("Transcoding Queue", "queue", 3), n("Moderation Service", "microservice", 3),
                n("Raw Upload Store", "storage", 4), n("Encoded Store", "storage", 4), n("Video Metadata DB", "database", 4), n("Comment DB", "database", 4), n("Search Index", "database", 4), n("View Analytics", "database", 4),
            ],
            edges: [
                e("Creators / Viewers", "CDN", "watch"), e("Creators / Viewers", "API Gateway", "API"),
                e("API Gateway", "Upload Service"), e("API Gateway", "Video Service"), e("API Gateway", "Search Service"), e("API Gateway", "Comment Service"), e("API Gateway", "Recommendation Service"),
                e("Upload Service", "Raw Upload Store"), e("Upload Service", "Transcoding Queue", "enqueue"),
                e("Transcoding Queue", "Moderation Service"), e("Moderation Service", "Encoded Store"),
                e("Video Service", "Encoded Store"), e("CDN", "Encoded Store", "origin"),
                e("Video Service", "Video Metadata DB"), e("Comment Service", "Comment DB"),
                e("Search Service", "Search Index"), e("Recommendation Service", "View Analytics"),
            ],
        },
    },
    {
        id: "twitch", label: "Twitch-scale Live Streaming", category: "Streaming & Media", scale: "large",
        desc: "Low-latency live video ingest, transcoding and chat at scale.",
        tags: ["twitch", "live", "streaming", "chat", "rtmp"],
        graph: {
            title: "Twitch-scale Live",
            nodes: [
                n("Streamers", "client", 0), n("Viewers", "client", 0),
                n("Ingest (RTMP) Edge", "gateway", 1), n("CDN Edge", "cdn", 1), n("Chat Gateway (WS)", "gateway", 1),
                n("Transcode Service", "microservice", 2), n("Stream Manager", "microservice", 2), n("Chat Service", "microservice", 2), n("Auth Service", "auth", 2),
                n("Message Bus", "queue", 3),
                n("Segment Storage", "storage", 4), n("Stream Metadata DB", "database", 4), n("Chat History DB", "database", 4), n("Presence Cache", "cache", 4),
            ],
            edges: [
                e("Streamers", "Ingest (RTMP) Edge", "RTMP"), e("Viewers", "CDN Edge", "HLS"), e("Viewers", "Chat Gateway (WS)", "WebSocket"),
                e("Ingest (RTMP) Edge", "Transcode Service"), e("Transcode Service", "Segment Storage"), e("CDN Edge", "Segment Storage", "origin"),
                e("Transcode Service", "Stream Manager"), e("Stream Manager", "Stream Metadata DB"),
                e("Chat Gateway (WS)", "Chat Service"), e("Chat Service", "Message Bus"), e("Message Bus", "Chat History DB"),
                e("Chat Service", "Presence Cache"), e("Chat Gateway (WS)", "Auth Service"),
            ],
        },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // E-COMMERCE & RETAIL
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: "amazon", label: "Amazon-scale E-Commerce", category: "E-Commerce & Retail", scale: "large",
        desc: "Marketplace with catalog, cart, orders, payments, fulfillment and recommendations.",
        tags: ["amazon", "ecommerce", "marketplace", "orders", "checkout", "cart"],
        graph: {
            title: "Amazon-scale E-Commerce",
            nodes: [
                n("Web / Mobile / Alexa", "client", 0),
                n("CDN", "cdn", 1), n("API Gateway", "gateway", 1), n("WAF / Firewall", "firewall", 1),
                n("Auth Service", "auth", 2), n("Load Balancer", "loadbalancer", 2),
                n("Catalog Service", "microservice", 3), n("Search Service", "microservice", 3), n("Cart Service", "microservice", 3), n("Order Service", "microservice", 3), n("Payment Service", "microservice", 3), n("Recommendation Service", "microservice", 3), n("Fulfillment Service", "microservice", 3), n("Review Service", "microservice", 3),
                n("Order Queue (SQS)", "queue", 4), n("Payment Gateway", "external_api", 4),
                n("Catalog DB", "database", 5), n("Search Index", "database", 5), n("Cart Cache", "cache", 5), n("Order DB", "database", 5), n("Inventory DB", "database", 5), n("Rec Store", "cache", 5), n("Data Warehouse", "database", 5),
            ],
            edges: [
                e("Web / Mobile / Alexa", "CDN"), e("Web / Mobile / Alexa", "WAF / Firewall"), e("WAF / Firewall", "API Gateway"),
                e("API Gateway", "Auth Service"), e("API Gateway", "Load Balancer"),
                e("Load Balancer", "Catalog Service"), e("Load Balancer", "Search Service"), e("Load Balancer", "Cart Service"), e("Load Balancer", "Order Service"), e("Load Balancer", "Recommendation Service"), e("Load Balancer", "Review Service"),
                e("Catalog Service", "Catalog DB"), e("Search Service", "Search Index"), e("Cart Service", "Cart Cache"),
                e("Order Service", "Order DB"), e("Order Service", "Order Queue (SQS)", "place order"), e("Order Queue (SQS)", "Fulfillment Service"),
                e("Order Service", "Payment Service"), e("Payment Service", "Payment Gateway", "charge"),
                e("Fulfillment Service", "Inventory DB"), e("Recommendation Service", "Rec Store"), e("Recommendation Service", "Data Warehouse"), e("Order Service", "Data Warehouse"),
            ],
        },
    },
    {
        id: "shopify", label: "Shopify-scale Multi-tenant Commerce", category: "E-Commerce & Retail", scale: "large",
        desc: "Multi-tenant storefront platform with themes, checkout and app ecosystem.",
        tags: ["shopify", "ecommerce", "multi-tenant", "storefront", "checkout"],
        graph: {
            title: "Shopify-scale Commerce",
            nodes: [
                n("Storefront Visitors", "client", 0), n("Merchant Admin", "client", 0),
                n("CDN", "cdn", 1), n("API Gateway", "gateway", 1),
                n("Auth Service", "auth", 2), n("Storefront Service", "microservice", 2), n("Checkout Service", "microservice", 2), n("Product Service", "microservice", 2), n("Order Service", "microservice", 2), n("App Platform", "microservice", 2),
                n("Webhook Queue", "queue", 3), n("Payment Gateway", "external_api", 3),
                n("Tenant DB (sharded)", "database", 4), n("Product DB", "database", 4), n("Order DB", "database", 4), n("Session Cache", "cache", 4), n("Media Storage", "storage", 4),
            ],
            edges: [
                e("Storefront Visitors", "CDN"), e("CDN", "Storefront Service", "origin"), e("Merchant Admin", "API Gateway"),
                e("API Gateway", "Auth Service"), e("API Gateway", "Storefront Service"), e("API Gateway", "Checkout Service"), e("API Gateway", "Product Service"), e("API Gateway", "Order Service"), e("API Gateway", "App Platform"),
                e("Storefront Service", "Session Cache"), e("Product Service", "Product DB"), e("Product Service", "Media Storage"),
                e("Checkout Service", "Payment Gateway", "charge"), e("Checkout Service", "Order Service"), e("Order Service", "Order DB"),
                e("Order Service", "Webhook Queue", "events"), e("Webhook Queue", "App Platform"), e("Storefront Service", "Tenant DB (sharded)"),
            ],
        },
    },
    {
        id: "doordash-store", label: "Instacart-scale Grocery", category: "E-Commerce & Retail", scale: "large",
        desc: "On-demand grocery with catalog, shopper matching and delivery tracking.",
        tags: ["instacart", "grocery", "delivery", "catalog", "shopper"],
        graph: {
            title: "Instacart-scale Grocery",
            nodes: [
                n("Customers", "client", 0), n("Shoppers App", "client", 0),
                n("API Gateway", "gateway", 1),
                n("Catalog Service", "microservice", 2), n("Cart Service", "microservice", 2), n("Order Service", "microservice", 2), n("Matching Service", "microservice", 2), n("Tracking Service", "microservice", 2), n("Payment Service", "microservice", 2),
                n("Dispatch Queue", "queue", 3), n("Maps API", "external_api", 3), n("Payment Gateway", "external_api", 3),
                n("Catalog DB", "database", 4), n("Order DB", "database", 4), n("Location Cache", "cache", 4), n("Inventory DB", "database", 4),
            ],
            edges: [
                e("Customers", "API Gateway"), e("Shoppers App", "API Gateway"),
                e("API Gateway", "Catalog Service"), e("API Gateway", "Cart Service"), e("API Gateway", "Order Service"), e("API Gateway", "Matching Service"), e("API Gateway", "Tracking Service"), e("API Gateway", "Payment Service"),
                e("Catalog Service", "Catalog DB"), e("Catalog Service", "Inventory DB"), e("Order Service", "Order DB"),
                e("Order Service", "Dispatch Queue", "assign"), e("Dispatch Queue", "Matching Service"),
                e("Matching Service", "Location Cache"), e("Tracking Service", "Maps API"), e("Payment Service", "Payment Gateway"),
            ],
        },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SOCIAL & MESSAGING
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: "whatsapp", label: "WhatsApp-scale Messaging", category: "Social & Messaging", scale: "large",
        desc: "End-to-end encrypted messaging with presence, media and delivery receipts.",
        tags: ["whatsapp", "messaging", "chat", "e2e", "presence", "realtime"],
        graph: {
            title: "WhatsApp-scale Messaging",
            nodes: [
                n("Mobile Clients", "client", 0),
                n("Connection Gateway (WS)", "gateway", 1), n("Load Balancer", "loadbalancer", 1),
                n("Auth Service", "auth", 2), n("Message Service", "microservice", 2), n("Presence Service", "microservice", 2), n("Media Service", "microservice", 2), n("Group Service", "microservice", 2), n("Notification Service", "microservice", 2),
                n("Message Queue", "queue", 3), n("Push (APNs/FCM)", "external_api", 3),
                n("Message Store", "database", 4), n("Presence Cache", "cache", 4), n("Media Storage", "storage", 4), n("Group DB", "database", 4), n("User DB", "database", 4),
            ],
            edges: [
                e("Mobile Clients", "Connection Gateway (WS)", "WebSocket"), e("Connection Gateway (WS)", "Load Balancer"),
                e("Load Balancer", "Auth Service"), e("Load Balancer", "Message Service"), e("Load Balancer", "Presence Service"), e("Load Balancer", "Media Service"), e("Load Balancer", "Group Service"),
                e("Message Service", "Message Queue", "fan-out"), e("Message Queue", "Notification Service"), e("Notification Service", "Push (APNs/FCM)"),
                e("Message Service", "Message Store"), e("Presence Service", "Presence Cache"),
                e("Media Service", "Media Storage"), e("Group Service", "Group DB"), e("Auth Service", "User DB"),
            ],
        },
    },
    {
        id: "twitter", label: "Twitter/X-scale Social Feed", category: "Social & Messaging", scale: "large",
        desc: "Timeline fan-out, tweets, follows and trending at massive read scale.",
        tags: ["twitter", "x", "feed", "timeline", "fanout", "social"],
        graph: {
            title: "Twitter/X-scale Feed",
            nodes: [
                n("Web / Mobile", "client", 0),
                n("CDN", "cdn", 1), n("API Gateway", "gateway", 1),
                n("Auth Service", "auth", 2), n("Tweet Service", "microservice", 2), n("Timeline Service", "microservice", 2), n("Follow Service", "microservice", 2), n("Search Service", "microservice", 2), n("Trending Service", "microservice", 2), n("Media Service", "microservice", 2),
                n("Fan-out Queue", "queue", 3),
                n("Tweet DB", "database", 4), n("Timeline Cache", "cache", 4), n("Social Graph DB", "database", 4), n("Search Index", "database", 4), n("Media Storage", "storage", 4), n("Analytics Lake", "storage", 4),
            ],
            edges: [
                e("Web / Mobile", "CDN"), e("Web / Mobile", "API Gateway"),
                e("API Gateway", "Auth Service"), e("API Gateway", "Tweet Service"), e("API Gateway", "Timeline Service"), e("API Gateway", "Follow Service"), e("API Gateway", "Search Service"), e("API Gateway", "Trending Service"), e("API Gateway", "Media Service"),
                e("Tweet Service", "Tweet DB"), e("Tweet Service", "Fan-out Queue", "fan-out"), e("Fan-out Queue", "Timeline Service"),
                e("Timeline Service", "Timeline Cache"), e("Follow Service", "Social Graph DB"),
                e("Search Service", "Search Index"), e("Trending Service", "Analytics Lake"), e("Media Service", "Media Storage"),
            ],
        },
    },
    {
        id: "instagram", label: "Instagram-scale Photo Sharing", category: "Social & Messaging", scale: "large",
        desc: "Photo/reel sharing with feed ranking, stories and media delivery.",
        tags: ["instagram", "photos", "feed", "stories", "media", "social"],
        graph: {
            title: "Instagram-scale Sharing",
            nodes: [
                n("Mobile / Web", "client", 0),
                n("CDN", "cdn", 1), n("API Gateway", "gateway", 1),
                n("Auth Service", "auth", 2), n("Post Service", "microservice", 2), n("Feed Ranking", "microservice", 2), n("Story Service", "microservice", 2), n("Media Service", "microservice", 2), n("Notification Service", "microservice", 2),
                n("Media Queue", "queue", 3), n("Push Service", "external_api", 3),
                n("Post DB", "database", 4), n("Feed Cache", "cache", 4), n("Graph DB", "database", 4), n("Media Storage", "storage", 4), n("Story Store", "cache", 4),
            ],
            edges: [
                e("Mobile / Web", "CDN"), e("Mobile / Web", "API Gateway"),
                e("API Gateway", "Auth Service"), e("API Gateway", "Post Service"), e("API Gateway", "Feed Ranking"), e("API Gateway", "Story Service"), e("API Gateway", "Media Service"),
                e("Post Service", "Post DB"), e("Post Service", "Media Queue"), e("Media Queue", "Media Service"), e("Media Service", "Media Storage"), e("CDN", "Media Storage", "origin"),
                e("Feed Ranking", "Feed Cache"), e("Feed Ranking", "Graph DB"), e("Story Service", "Story Store"),
                e("Post Service", "Notification Service"), e("Notification Service", "Push Service"),
            ],
        },
    },
    {
        id: "slack", label: "Slack-scale Team Chat", category: "Social & Messaging", scale: "large",
        desc: "Workspace messaging with channels, real-time sync, search and integrations.",
        tags: ["slack", "chat", "workspace", "channels", "realtime", "search"],
        graph: {
            title: "Slack-scale Team Chat",
            nodes: [
                n("Desktop / Mobile / Web", "client", 0),
                n("WebSocket Gateway", "gateway", 1), n("API Gateway", "gateway", 1),
                n("Auth Service", "auth", 2), n("Message Service", "microservice", 2), n("Channel Service", "microservice", 2), n("Search Service", "microservice", 2), n("Integration Service", "microservice", 2), n("Notification Service", "microservice", 2),
                n("Event Bus", "queue", 3),
                n("Message DB", "database", 4), n("Channel DB", "database", 4), n("Search Index", "database", 4), n("Presence Cache", "cache", 4), n("File Storage", "storage", 4),
            ],
            edges: [
                e("Desktop / Mobile / Web", "WebSocket Gateway", "realtime"), e("Desktop / Mobile / Web", "API Gateway", "REST"),
                e("WebSocket Gateway", "Message Service"), e("API Gateway", "Auth Service"), e("API Gateway", "Channel Service"), e("API Gateway", "Search Service"), e("API Gateway", "Integration Service"),
                e("Message Service", "Message DB"), e("Message Service", "Event Bus"), e("Event Bus", "Notification Service"), e("Event Bus", "Search Service"),
                e("Channel Service", "Channel DB"), e("Search Service", "Search Index"), e("Message Service", "Presence Cache"), e("Message Service", "File Storage"),
            ],
        },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // MOBILITY & DELIVERY
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: "uber", label: "Uber-scale Ride Hailing", category: "Mobility & Delivery", scale: "large",
        desc: "Real-time driver matching, geo-dispatch, pricing and trip tracking.",
        tags: ["uber", "ride", "geo", "matching", "dispatch", "maps"],
        graph: {
            title: "Uber-scale Ride Hailing",
            nodes: [
                n("Rider App", "client", 0), n("Driver App", "client", 0),
                n("API Gateway", "gateway", 1), n("Location Gateway (WS)", "gateway", 1),
                n("Auth Service", "auth", 2), n("Matching Service", "microservice", 2), n("Pricing Service", "microservice", 2), n("Trip Service", "microservice", 2), n("Dispatch Service", "microservice", 2), n("Payment Service", "microservice", 2),
                n("Geo Index (QuadTree)", "cache", 3), n("Event Stream (Kafka)", "queue", 3), n("Maps API", "external_api", 3), n("Payment Gateway", "external_api", 3),
                n("Trip DB", "database", 4), n("Driver Location Store", "cache", 4), n("Surge Model Store", "database", 4), n("Analytics Lake", "storage", 4),
            ],
            edges: [
                e("Rider App", "API Gateway"), e("Driver App", "Location Gateway (WS)", "GPS"), e("Rider App", "Location Gateway (WS)"),
                e("API Gateway", "Auth Service"), e("API Gateway", "Matching Service"), e("API Gateway", "Pricing Service"), e("API Gateway", "Trip Service"), e("API Gateway", "Payment Service"),
                e("Location Gateway (WS)", "Driver Location Store"), e("Matching Service", "Geo Index (QuadTree)"), e("Matching Service", "Dispatch Service"),
                e("Pricing Service", "Surge Model Store"), e("Trip Service", "Trip DB"), e("Trip Service", "Maps API"),
                e("Payment Service", "Payment Gateway"), e("Trip Service", "Event Stream (Kafka)"), e("Event Stream (Kafka)", "Analytics Lake"),
            ],
        },
    },
    {
        id: "doordash", label: "DoorDash-scale Food Delivery", category: "Mobility & Delivery", scale: "large",
        desc: "Three-sided marketplace: customers, restaurants and couriers with live dispatch.",
        tags: ["doordash", "food", "delivery", "marketplace", "dispatch", "courier"],
        graph: {
            title: "DoorDash-scale Delivery",
            nodes: [
                n("Customer App", "client", 0), n("Merchant Tablet", "client", 0), n("Dasher App", "client", 0),
                n("API Gateway", "gateway", 1),
                n("Auth Service", "auth", 2), n("Menu Service", "microservice", 2), n("Order Service", "microservice", 2), n("Assignment Service", "microservice", 2), n("Tracking Service", "microservice", 2), n("Payment Service", "microservice", 2), n("Pricing Service", "microservice", 2),
                n("Dispatch Queue", "queue", 3), n("Maps / ETA API", "external_api", 3), n("Payment Gateway", "external_api", 3),
                n("Order DB", "database", 4), n("Menu DB", "database", 4), n("Location Cache", "cache", 4), n("Analytics Warehouse", "database", 4),
            ],
            edges: [
                e("Customer App", "API Gateway"), e("Merchant Tablet", "API Gateway"), e("Dasher App", "API Gateway"),
                e("API Gateway", "Auth Service"), e("API Gateway", "Menu Service"), e("API Gateway", "Order Service"), e("API Gateway", "Assignment Service"), e("API Gateway", "Tracking Service"), e("API Gateway", "Payment Service"), e("API Gateway", "Pricing Service"),
                e("Menu Service", "Menu DB"), e("Order Service", "Order DB"), e("Order Service", "Dispatch Queue", "route"), e("Dispatch Queue", "Assignment Service"),
                e("Assignment Service", "Location Cache"), e("Tracking Service", "Maps / ETA API"), e("Payment Service", "Payment Gateway"),
                e("Order Service", "Analytics Warehouse"), e("Pricing Service", "Analytics Warehouse"),
            ],
        },
    },
    {
        id: "airbnb", label: "Airbnb-scale Marketplace", category: "Mobility & Delivery", scale: "large",
        desc: "Two-sided booking marketplace with search, availability, payments and messaging.",
        tags: ["airbnb", "booking", "marketplace", "search", "availability"],
        graph: {
            title: "Airbnb-scale Marketplace",
            nodes: [
                n("Guests / Hosts", "client", 0),
                n("CDN", "cdn", 1), n("API Gateway", "gateway", 1),
                n("Auth Service", "auth", 2), n("Search Service", "microservice", 2), n("Listing Service", "microservice", 2), n("Booking Service", "microservice", 2), n("Pricing Service", "microservice", 2), n("Messaging Service", "microservice", 2), n("Payment Service", "microservice", 2),
                n("Booking Queue", "queue", 3), n("Payment Gateway", "external_api", 3), n("Maps API", "external_api", 3),
                n("Listing DB", "database", 4), n("Search Index", "database", 4), n("Booking DB", "database", 4), n("Availability Cache", "cache", 4), n("Media Storage", "storage", 4),
            ],
            edges: [
                e("Guests / Hosts", "CDN"), e("Guests / Hosts", "API Gateway"),
                e("API Gateway", "Auth Service"), e("API Gateway", "Search Service"), e("API Gateway", "Listing Service"), e("API Gateway", "Booking Service"), e("API Gateway", "Pricing Service"), e("API Gateway", "Messaging Service"), e("API Gateway", "Payment Service"),
                e("Search Service", "Search Index"), e("Search Service", "Maps API"), e("Listing Service", "Listing DB"), e("Listing Service", "Media Storage"),
                e("Booking Service", "Booking DB"), e("Booking Service", "Availability Cache"), e("Booking Service", "Booking Queue"),
                e("Payment Service", "Payment Gateway"), e("Booking Queue", "Payment Service"),
            ],
        },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // FINTECH & PAYMENTS
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: "stripe", label: "Stripe-scale Payments", category: "Fintech & Payments", scale: "large",
        desc: "Payment processing with idempotency, ledger, webhooks and fraud checks.",
        tags: ["stripe", "payments", "ledger", "fraud", "webhooks", "fintech"],
        graph: {
            title: "Stripe-scale Payments",
            nodes: [
                n("Merchant Servers", "client", 0), n("Checkout SDK", "client", 0),
                n("API Gateway", "gateway", 1), n("WAF / Firewall", "firewall", 1),
                n("Auth / API Keys", "auth", 2), n("Payment Service", "microservice", 2), n("Ledger Service", "microservice", 2), n("Fraud Service", "microservice", 2), n("Webhook Service", "microservice", 2), n("Payout Service", "microservice", 2),
                n("Event Queue", "queue", 3), n("Card Networks", "external_api", 3), n("Bank Rails", "external_api", 3),
                n("Ledger DB", "database", 4), n("Idempotency Store", "cache", 4), n("Fraud Model Store", "database", 4), n("Audit Log", "storage", 4),
            ],
            edges: [
                e("Merchant Servers", "WAF / Firewall"), e("Checkout SDK", "WAF / Firewall"), e("WAF / Firewall", "API Gateway"),
                e("API Gateway", "Auth / API Keys"), e("API Gateway", "Payment Service"),
                e("Payment Service", "Idempotency Store"), e("Payment Service", "Fraud Service"), e("Fraud Service", "Fraud Model Store"),
                e("Payment Service", "Card Networks", "authorize"), e("Payment Service", "Ledger Service"), e("Ledger Service", "Ledger DB"),
                e("Payment Service", "Event Queue"), e("Event Queue", "Webhook Service"), e("Webhook Service", "Merchant Servers", "callbacks"),
                e("Payout Service", "Bank Rails"), e("Ledger Service", "Payout Service"), e("Ledger Service", "Audit Log"),
            ],
        },
    },
    {
        id: "neobank", label: "Neobank-scale Digital Banking", category: "Fintech & Payments", scale: "large",
        desc: "Mobile-first bank with accounts, cards, transfers and KYC compliance.",
        tags: ["bank", "fintech", "accounts", "cards", "kyc", "transfers"],
        graph: {
            title: "Neobank Digital Banking",
            nodes: [
                n("Mobile App", "client", 0),
                n("API Gateway", "gateway", 1), n("WAF / Firewall", "firewall", 1),
                n("Auth / MFA", "auth", 2), n("Account Service", "microservice", 2), n("Card Service", "microservice", 2), n("Transfer Service", "microservice", 2), n("KYC Service", "microservice", 2), n("Notification Service", "microservice", 2),
                n("Ledger Queue", "queue", 3), n("Card Processor", "external_api", 3), n("KYC Provider", "external_api", 3), n("Payment Rails", "external_api", 3),
                n("Account DB", "database", 4), n("Ledger DB", "database", 4), n("Transaction Cache", "cache", 4), n("Compliance Store", "storage", 4),
            ],
            edges: [
                e("Mobile App", "WAF / Firewall"), e("WAF / Firewall", "API Gateway"),
                e("API Gateway", "Auth / MFA"), e("API Gateway", "Account Service"), e("API Gateway", "Card Service"), e("API Gateway", "Transfer Service"), e("API Gateway", "KYC Service"),
                e("Account Service", "Account DB"), e("Card Service", "Card Processor"), e("Transfer Service", "Payment Rails"),
                e("Transfer Service", "Ledger Queue"), e("Ledger Queue", "Ledger DB"), e("KYC Service", "KYC Provider"), e("KYC Service", "Compliance Store"),
                e("Account Service", "Transaction Cache"), e("Transfer Service", "Notification Service"),
            ],
        },
    },
    {
        id: "trading", label: "Trading-scale Exchange", category: "Fintech & Payments", scale: "large",
        desc: "Low-latency order matching engine with market data and risk controls.",
        tags: ["trading", "exchange", "matching engine", "market data", "low latency"],
        graph: {
            title: "Trading Exchange",
            nodes: [
                n("Trader Clients", "client", 0), n("Market Data Feed", "client", 0),
                n("FIX / API Gateway", "gateway", 1),
                n("Auth Service", "auth", 2), n("Order Service", "microservice", 2), n("Matching Engine", "microservice", 2), n("Risk Service", "microservice", 2), n("Market Data Service", "microservice", 2), n("Settlement Service", "microservice", 2),
                n("Event Log (Kafka)", "queue", 3),
                n("Order Book (in-mem)", "cache", 4), n("Trade DB", "database", 4), n("Position DB", "database", 4), n("Market Data Cache", "cache", 4), n("Cold Archive", "storage", 4),
            ],
            edges: [
                e("Trader Clients", "FIX / API Gateway", "orders"), e("Market Data Feed", "Market Data Service", "ticks"),
                e("FIX / API Gateway", "Auth Service"), e("FIX / API Gateway", "Order Service"),
                e("Order Service", "Risk Service"), e("Risk Service", "Position DB"), e("Order Service", "Matching Engine"), e("Matching Engine", "Order Book (in-mem)"),
                e("Matching Engine", "Event Log (Kafka)", "fills"), e("Event Log (Kafka)", "Settlement Service"), e("Settlement Service", "Trade DB"),
                e("Market Data Service", "Market Data Cache"), e("Event Log (Kafka)", "Cold Archive"),
            ],
        },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // DATA & AI
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: "ml-platform", label: "ML Platform (Training + Serving)", category: "Data & AI", scale: "large",
        desc: "End-to-end ML: feature pipeline, training, model registry and online serving.",
        tags: ["ml", "ai", "training", "inference", "feature store", "mlops"],
        graph: {
            title: "ML Platform",
            nodes: [
                n("Apps / Clients", "client", 0),
                n("Inference Gateway", "gateway", 1),
                n("Model Serving", "microservice", 2), n("Feature Service", "microservice", 2), n("Training Orchestrator", "microservice", 2), n("Data Ingestion", "microservice", 2),
                n("Streaming Bus (Kafka)", "queue", 3), n("Training Cluster (GPU)", "server", 3),
                n("Feature Store", "cache", 4), n("Model Registry", "storage", 4), n("Data Lake", "storage", 4), n("Vector DB", "database", 4), n("Metrics DB", "database", 4),
            ],
            edges: [
                e("Apps / Clients", "Inference Gateway"), e("Inference Gateway", "Model Serving"),
                e("Model Serving", "Model Registry", "load"), e("Model Serving", "Feature Store"), e("Model Serving", "Vector DB"),
                e("Feature Service", "Feature Store"), e("Data Ingestion", "Streaming Bus (Kafka)"), e("Streaming Bus (Kafka)", "Data Lake"),
                e("Feature Service", "Data Lake"), e("Training Orchestrator", "Training Cluster (GPU)"), e("Training Cluster (GPU)", "Data Lake", "read"),
                e("Training Cluster (GPU)", "Model Registry", "publish"), e("Model Serving", "Metrics DB"),
            ],
        },
    },
    {
        id: "rag-llm", label: "RAG / LLM Application", category: "Data & AI", scale: "large",
        desc: "Retrieval-augmented generation with embeddings, vector search and an LLM.",
        tags: ["llm", "rag", "genai", "embeddings", "vector", "chatbot"],
        graph: {
            title: "RAG / LLM Application",
            nodes: [
                n("User", "client", 0),
                n("API Gateway", "gateway", 1),
                n("Auth Service", "auth", 2), n("Orchestrator", "microservice", 2), n("Embedding Service", "microservice", 2), n("Ingestion Service", "microservice", 2),
                n("LLM Provider", "external_api", 3), n("Reranker", "microservice", 3),
                n("Vector DB", "database", 4), n("Document Store", "storage", 4), n("Prompt Cache", "cache", 4), n("Chat History DB", "database", 4),
            ],
            edges: [
                e("User", "API Gateway"), e("API Gateway", "Auth Service"), e("API Gateway", "Orchestrator"),
                e("Orchestrator", "Embedding Service"), e("Embedding Service", "Vector DB", "search"), e("Orchestrator", "Reranker"),
                e("Orchestrator", "LLM Provider", "generate"), e("Orchestrator", "Prompt Cache"), e("Orchestrator", "Chat History DB"),
                e("Ingestion Service", "Document Store"), e("Ingestion Service", "Embedding Service"), e("Embedding Service", "Document Store", "read"),
            ],
        },
    },
    {
        id: "data-lakehouse", label: "Big Data Lakehouse", category: "Data & AI", scale: "large",
        desc: "Batch + streaming ingestion into a lakehouse with BI and ML consumers.",
        tags: ["data", "lakehouse", "etl", "spark", "warehouse", "analytics"],
        graph: {
            title: "Big Data Lakehouse",
            nodes: [
                n("Source Systems", "client", 0), n("Event Producers", "client", 0),
                n("Ingestion Gateway", "gateway", 1),
                n("Batch ETL", "microservice", 2), n("Stream Processor", "microservice", 2), n("CDC Connector", "microservice", 2),
                n("Streaming Bus (Kafka)", "queue", 3), n("Query Engine (Spark)", "server", 3),
                n("Raw Zone (Bronze)", "storage", 4), n("Curated Zone (Silver)", "storage", 4), n("Serving Zone (Gold)", "database", 4), n("BI / Dashboards", "external_api", 4),
            ],
            edges: [
                e("Source Systems", "Ingestion Gateway"), e("Event Producers", "Streaming Bus (Kafka)"),
                e("Ingestion Gateway", "Batch ETL"), e("Streaming Bus (Kafka)", "Stream Processor"), e("Source Systems", "CDC Connector"),
                e("Batch ETL", "Raw Zone (Bronze)"), e("CDC Connector", "Raw Zone (Bronze)"), e("Stream Processor", "Raw Zone (Bronze)"),
                e("Query Engine (Spark)", "Raw Zone (Bronze)", "read"), e("Query Engine (Spark)", "Curated Zone (Silver)", "write"),
                e("Curated Zone (Silver)", "Serving Zone (Gold)"), e("Serving Zone (Gold)", "BI / Dashboards"),
            ],
        },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SAAS & PRODUCTIVITY
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: "google-docs", label: "Google Docs-scale Collaboration", category: "SaaS & Productivity", scale: "large",
        desc: "Real-time collaborative editing with operational transforms and presence.",
        tags: ["google docs", "collaboration", "realtime", "ot", "crdt", "editing"],
        graph: {
            title: "Collaborative Docs",
            nodes: [
                n("Editors (Browsers)", "client", 0),
                n("WebSocket Gateway", "gateway", 1), n("API Gateway", "gateway", 1),
                n("Auth Service", "auth", 2), n("Collaboration Service (OT)", "microservice", 2), n("Document Service", "microservice", 2), n("Presence Service", "microservice", 2), n("Export Service", "microservice", 2),
                n("Op Log Queue", "queue", 3),
                n("Document DB", "database", 4), n("Op Log Store", "database", 4), n("Presence Cache", "cache", 4), n("Snapshot Storage", "storage", 4),
            ],
            edges: [
                e("Editors (Browsers)", "WebSocket Gateway", "edits"), e("Editors (Browsers)", "API Gateway"),
                e("WebSocket Gateway", "Collaboration Service (OT)"), e("API Gateway", "Auth Service"), e("API Gateway", "Document Service"), e("API Gateway", "Export Service"),
                e("Collaboration Service (OT)", "Op Log Queue"), e("Op Log Queue", "Op Log Store"), e("Collaboration Service (OT)", "Presence Service"), e("Presence Service", "Presence Cache"),
                e("Document Service", "Document DB"), e("Document Service", "Snapshot Storage"), e("Export Service", "Snapshot Storage"),
            ],
        },
    },
    {
        id: "notion", label: "Notion-scale Workspace", category: "SaaS & Productivity", scale: "large",
        desc: "Block-based docs with sync, search, permissions and integrations.",
        tags: ["notion", "workspace", "blocks", "sync", "saas", "search"],
        graph: {
            title: "Notion-scale Workspace",
            nodes: [
                n("Clients", "client", 0),
                n("API Gateway", "gateway", 1), n("CDN", "cdn", 1),
                n("Auth Service", "auth", 2), n("Block Service", "microservice", 2), n("Sync Service", "microservice", 2), n("Search Service", "microservice", 2), n("Permission Service", "microservice", 2),
                n("Sync Queue", "queue", 3),
                n("Block DB", "database", 4), n("Search Index", "database", 4), n("Permission DB", "database", 4), n("Edit Cache", "cache", 4), n("File Storage", "storage", 4),
            ],
            edges: [
                e("Clients", "CDN"), e("Clients", "API Gateway"),
                e("API Gateway", "Auth Service"), e("API Gateway", "Block Service"), e("API Gateway", "Sync Service"), e("API Gateway", "Search Service"), e("API Gateway", "Permission Service"),
                e("Block Service", "Block DB"), e("Block Service", "Edit Cache"), e("Sync Service", "Sync Queue"), e("Sync Queue", "Block Service"),
                e("Search Service", "Search Index"), e("Permission Service", "Permission DB"), e("Block Service", "File Storage"),
            ],
        },
    },
    {
        id: "multi-tenant-saas", label: "Multi-Tenant B2B SaaS", category: "SaaS & Productivity", scale: "large",
        desc: "Tenant isolation, per-tenant config, billing and admin, on shared infra.",
        tags: ["saas", "b2b", "multi-tenant", "billing", "isolation"],
        graph: {
            title: "Multi-Tenant B2B SaaS",
            nodes: [
                n("Tenant Users", "client", 0), n("Admin Portal", "client", 0),
                n("API Gateway", "gateway", 1), n("CDN", "cdn", 1),
                n("Auth / SSO", "auth", 2), n("Tenant Router", "microservice", 2), n("Core App Service", "microservice", 2), n("Billing Service", "microservice", 2), n("Reporting Service", "microservice", 2), n("Admin Service", "microservice", 2),
                n("Job Queue", "queue", 3), n("Billing Provider", "external_api", 3),
                n("Tenant DB (sharded)", "database", 4), n("Config Store", "cache", 4), n("Reporting Warehouse", "database", 4), n("Object Storage", "storage", 4),
            ],
            edges: [
                e("Tenant Users", "CDN"), e("Tenant Users", "API Gateway"), e("Admin Portal", "API Gateway"),
                e("API Gateway", "Auth / SSO"), e("API Gateway", "Tenant Router"), e("Tenant Router", "Core App Service"), e("Tenant Router", "Config Store"),
                e("API Gateway", "Billing Service"), e("API Gateway", "Reporting Service"), e("API Gateway", "Admin Service"),
                e("Core App Service", "Tenant DB (sharded)"), e("Core App Service", "Job Queue"), e("Billing Service", "Billing Provider"),
                e("Reporting Service", "Reporting Warehouse"), e("Core App Service", "Object Storage"),
            ],
        },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // GAMING & REALTIME
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: "mmo-game", label: "MMO Game Backend", category: "Gaming & Realtime", scale: "large",
        desc: "Realtime multiplayer with game servers, matchmaking, state and leaderboards.",
        tags: ["game", "mmo", "multiplayer", "matchmaking", "realtime", "leaderboard"],
        graph: {
            title: "MMO Game Backend",
            nodes: [
                n("Game Clients", "client", 0),
                n("Realtime Gateway (UDP/WS)", "gateway", 1), n("API Gateway", "gateway", 1),
                n("Auth Service", "auth", 2), n("Matchmaking Service", "microservice", 2), n("Game Server Fleet", "server", 2), n("Player Service", "microservice", 2), n("Leaderboard Service", "microservice", 2), n("Inventory Service", "microservice", 2),
                n("Event Bus", "queue", 3),
                n("Game State Cache", "cache", 4), n("Player DB", "database", 4), n("Leaderboard Store", "cache", 4), n("Match History DB", "database", 4), n("Asset Storage", "storage", 4),
            ],
            edges: [
                e("Game Clients", "Realtime Gateway (UDP/WS)", "game traffic"), e("Game Clients", "API Gateway", "meta"),
                e("Realtime Gateway (UDP/WS)", "Game Server Fleet"), e("API Gateway", "Auth Service"), e("API Gateway", "Matchmaking Service"), e("API Gateway", "Player Service"), e("API Gateway", "Leaderboard Service"), e("API Gateway", "Inventory Service"),
                e("Matchmaking Service", "Game Server Fleet", "assign"), e("Game Server Fleet", "Game State Cache"), e("Game Server Fleet", "Event Bus"),
                e("Event Bus", "Match History DB"), e("Player Service", "Player DB"), e("Leaderboard Service", "Leaderboard Store"), e("Inventory Service", "Asset Storage"),
            ],
        },
    },
    {
        id: "iot-platform", label: "IoT Platform (Millions of Devices)", category: "Gaming & Realtime", scale: "large",
        desc: "Device ingestion, command/control, time-series storage and alerting.",
        tags: ["iot", "devices", "mqtt", "telemetry", "time-series", "realtime"],
        graph: {
            title: "IoT Platform",
            nodes: [
                n("IoT Devices", "client", 0),
                n("MQTT Broker / Edge", "gateway", 1),
                n("Device Auth", "auth", 2), n("Ingestion Service", "microservice", 2), n("Command Service", "microservice", 2), n("Rules Engine", "microservice", 2), n("Alerting Service", "microservice", 2),
                n("Telemetry Stream (Kafka)", "queue", 3),
                n("Time-Series DB", "database", 4), n("Device Registry DB", "database", 4), n("Hot Cache", "cache", 4), n("Cold Storage", "storage", 4), n("Dashboards", "external_api", 4),
            ],
            edges: [
                e("IoT Devices", "MQTT Broker / Edge", "telemetry"), e("MQTT Broker / Edge", "Device Auth"), e("MQTT Broker / Edge", "Ingestion Service"),
                e("Ingestion Service", "Telemetry Stream (Kafka)"), e("Telemetry Stream (Kafka)", "Time-Series DB"), e("Telemetry Stream (Kafka)", "Rules Engine"),
                e("Rules Engine", "Alerting Service"), e("Command Service", "MQTT Broker / Edge", "commands"), e("Ingestion Service", "Device Registry DB"),
                e("Ingestion Service", "Hot Cache"), e("Time-Series DB", "Cold Storage", "archive"), e("Time-Series DB", "Dashboards"),
            ],
        },
    },
];

// ── Search helper ─────────────────────────────────────────────────────────────
export function searchTemplates(query: string): Template[] {
    const q = query.trim().toLowerCase();
    if (!q) return ARCHITECTURE_TEMPLATES;
    return ARCHITECTURE_TEMPLATES.filter((t) => {
        const haystack = [t.label, t.desc, t.category, t.scale, ...t.tags].join(" ").toLowerCase();
        return q.split(/\s+/).every((word) => haystack.includes(word));
    });
}
