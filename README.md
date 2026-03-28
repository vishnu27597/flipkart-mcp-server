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

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/flipkart-mcp-server.git
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

## Configuration for AI Agents

To use this MCP server with your preferred AI agent, you need to configure it to run the server and provide the required `FLIPKART_ACCESS_TOKEN` environment variable.

### Claude Desktop

Add the following to your `claude_desktop_config.json` file (typically located at `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "flipkart": {
      "command": "node",
      "args": ["/absolute/path/to/flipkart-mcp-server/dist/index.js"],
      "env": {
        "FLIPKART_ACCESS_TOKEN": "your-flipkart-access-token-here"
      }
    }
  }
}
```

### Claude Code (CLI)

Start Claude Code with the MCP server configured:

```bash
FLIPKART_ACCESS_TOKEN="your-token" claude --mcp-server "node /absolute/path/to/flipkart-mcp-server/dist/index.js"
```

### Cursor

1. Open Cursor Settings > Features > MCP
2. Click "+ Add New MCP Server"
3. Name: `flipkart`
4. Type: `command`
5. Command: `node /absolute/path/to/flipkart-mcp-server/dist/index.js`
6. Add the environment variable `FLIPKART_ACCESS_TOKEN` with your token.

## Available Tools

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
- `mark_ready_for_dispatch`: Mark shipments as ready for logistics pickup.
- `get_shipping_details`: Get tracking and delivery address details.
- `cancel_order_items`: Cancel specific items in an order.
- `get_handover_counts`: Get counts of shipments pending handover.
- `get_returns`: Get return tracking codes and details.

### Reports
- `trigger_report`: Request the generation of a specific report type (e.g., settlement, orders).
- `get_report_detail`: Check the status of a report and get the download URL when complete.

## Development

To run the server in development mode with auto-reloading:

```bash
FLIPKART_ACCESS_TOKEN="your-token" npm run dev
```

To run the test suite against live Flipkart APIs:

```bash
FLIPKART_ACCESS_TOKEN="your-token" FLIPKART_LOCATION_ID="your-location-id" npm run test
```

## License

MIT
