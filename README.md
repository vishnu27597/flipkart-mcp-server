# Flipkart MCP Server

A Model Context Protocol (MCP) server that provides AI agents (like Claude, ChatGPT, and others) with direct access to the Flipkart Seller APIs. This server allows agents to manage listings, process shipments, and generate reports on behalf of a Flipkart seller.

## Features

This MCP server implements the following Flipkart API domains:

- **Listings V3**: Search listings, get product details, update prices, update inventory, and create/update listings.
- **Shipment V3**: Search pre/post-dispatch shipments, get order details, generate labels/invoices, mark as ready for dispatch, and manage self-ship orders.
- **Reports**: Trigger report generation and check report status/download links.

## Prerequisites

- Node.js 18 or higher
- A Flipkart Seller account with API access
- A valid Flipkart API Access Token
- Your Flipkart Merchant ID (found in your Seller Dashboard)
- Your Flipkart Location/Warehouse ID (found in your Seller Dashboard under Warehouse settings)

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/vishnu27597/flipkart-mcp-server.git
   cd flipkart-mcp-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the server:
   ```bash
   npm run build
   ```

## Environment Variables

The server requires the following environment variables:

| Variable | Required | Description |
|---|---|---|
| `FLIPKART_ACCESS_TOKEN` | **Yes** | Your Flipkart Seller API access token (Bearer token) |
| `FLIPKART_MERCHANT_ID` | Recommended | Your Flipkart Merchant/Seller ID (e.g., `0316e3916c4b4f9a`) |
| `FLIPKART_LOCATION_ID` | Recommended | Your default warehouse/location ID (e.g., `LOC85c8f6288b2e478784e12087f39d5724`) |

The **Merchant ID** identifies your seller account. The **Location ID** is used as the default warehouse for shipment filtering, handover counts, and inventory operations when no specific location is provided by the agent.

## Configuration for AI Agents

### Claude Desktop

Add the following to your `claude_desktop_config.json` file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "flipkart": {
      "command": "node",
      "args": ["/absolute/path/to/flipkart-mcp-server/dist/index.js"],
      "env": {
        "FLIPKART_ACCESS_TOKEN": "your-flipkart-access-token",
        "FLIPKART_MERCHANT_ID": "your-merchant-id",
        "FLIPKART_LOCATION_ID": "your-location-id"
      }
    }
  }
}
```

### Claude Code (CLI)

Start Claude Code with the MCP server configured:

```bash
FLIPKART_ACCESS_TOKEN="your-token" \
FLIPKART_MERCHANT_ID="your-merchant-id" \
FLIPKART_LOCATION_ID="your-location-id" \
claude --mcp-server "node /absolute/path/to/flipkart-mcp-server/dist/index.js"
```

### Cursor

1. Open Cursor Settings > Features > MCP.
2. Click "+ Add New MCP Server".
3. Name: `flipkart`
4. Type: `command`
5. Command: `node /absolute/path/to/flipkart-mcp-server/dist/index.js`
6. Add the following environment variables:
   - `FLIPKART_ACCESS_TOKEN` = your access token
   - `FLIPKART_MERCHANT_ID` = your merchant ID
   - `FLIPKART_LOCATION_ID` = your location ID

### ChatGPT (via MCP Bridge / Plugin)

ChatGPT does not natively support MCP servers, but you can use an MCP-to-HTTP bridge (such as [mcp-proxy](https://github.com/nicholasgriffintn/mcp-proxy) or [supergateway](https://github.com/nicholasgriffintn/supergateway)) to expose this server as an HTTP API that ChatGPT plugins or custom GPTs can call.

1. Start the MCP server with the bridge:
   ```bash
   FLIPKART_ACCESS_TOKEN="your-token" \
   FLIPKART_MERCHANT_ID="your-merchant-id" \
   FLIPKART_LOCATION_ID="your-location-id" \
   npx supergateway --stdio "node /absolute/path/to/flipkart-mcp-server/dist/index.js"
   ```
2. The bridge will expose the MCP tools as HTTP endpoints that can be consumed by ChatGPT custom GPTs or any HTTP-based agent.

### Windsurf / Other MCP-Compatible Agents

Most MCP-compatible agents follow a similar configuration pattern. Provide:

- **Command**: `node /absolute/path/to/flipkart-mcp-server/dist/index.js`
- **Environment variables**: `FLIPKART_ACCESS_TOKEN`, `FLIPKART_MERCHANT_ID`, `FLIPKART_LOCATION_ID`

## Available Tools

### Seller Info
- `get_seller_info`: Get the configured seller account details (Merchant ID, default Location ID).

### Listings Management
- `search_listings`: Search all seller listings with FSN and SKU.
- `search_listings_and_products`: Search listings with detailed product information.
- `get_listings`: Get basic listing information for specific SKUs.
- `get_listing_details`: Get comprehensive listing details (price, inventory, fulfillment) for specific SKUs.
- `update_listing_price`: Update the MRP and selling price for listings.
- `update_listing_inventory`: Update the inventory count at specific warehouse locations.
- `create_listing`: Create new product listings.
- `update_listing`: Update existing listing attributes.

### Shipment Management
- `search_shipments`: Search shipments by type (preDispatch, postDispatch, cancelled) and states.
- `search_shipments_paginate`: Fetch the next page of shipment search results.
- `get_order_details`: Get detailed information for specific shipment IDs or order IDs.
- `trigger_label_generation`: Generate invoice and shipping labels (marks as PACKED).
- `download_labels_and_invoices`: Get PDF links for labels and invoices.
- `download_labels_only`: Get only shipping label PDFs.
- `download_invoice`: Get only invoice PDFs.
- `mark_ready_for_dispatch`: Mark shipments as ready for logistics pickup.
- `get_shipping_details`: Get tracking and delivery address details.
- `cancel_order_items`: Cancel specific items in an order.
- `get_handover_counts`: Get counts of shipments pending handover.
- `download_manifest`: Download manifest PDF for shipments.
- `get_returns`: Get return tracking codes and details.
- `mark_self_ship_dispatched`: Mark self-ship orders as dispatched.
- `update_self_ship_delivery_date`: Update delivery date for self-ship orders.
- `update_self_ship_tracking_id`: Update tracking ID for self-ship orders.
- `update_self_ship_delivery_attempt`: Record delivery attempt for self-ship orders.
- `get_shipment_forms`: Get forms associated with shipments.
- `update_form_acknowledgement`: Update acknowledgement numbers for form-failed shipments.

### Reports
- `trigger_report`: Request the generation of a specific report type (e.g., settlement, orders).
- `get_report_detail`: Check the status of a report and get the download URL when complete.

## Development

To run the server in development mode with auto-reloading:

```bash
FLIPKART_ACCESS_TOKEN="your-token" \
FLIPKART_MERCHANT_ID="your-merchant-id" \
FLIPKART_LOCATION_ID="your-location-id" \
npm run dev
```

To run the test suite against live Flipkart APIs:

```bash
FLIPKART_ACCESS_TOKEN="your-token" \
FLIPKART_LOCATION_ID="your-location-id" \
npm run test
```

## License

MIT
