#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { FlipkartClient } from "./flipkart-client.js";

const ACCESS_TOKEN = process.env.FLIPKART_ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
  console.error(
    "Error: FLIPKART_ACCESS_TOKEN environment variable is required."
  );
  process.exit(1);
}

const client = new FlipkartClient({ accessToken: ACCESS_TOKEN });

const server = new McpServer({
  name: "flipkart-mcp-server",
  version: "1.0.0",
});

// Helper to format tool responses
function formatResponse(data: unknown): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function formatError(error: unknown): { content: Array<{ type: "text"; text: string }>; isError: true } {
  return {
    content: [
      {
        type: "text" as const,
        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
      },
    ],
    isError: true as const,
  };
}

// ==================== SHIPMENT V3 TOOLS ====================

server.tool(
  "search_shipments",
  "Search shipments using filters. Returns shipments based on type (preDispatch, postDispatch, cancelled) and optional filters like states, dates, SKUs, location, shipment types, etc.",
  {
    type: z.enum(["preDispatch", "postDispatch", "cancelled"]).describe("Type of shipments to search"),
    states: z.array(z.string()).describe("Filter by shipment states. Required. For preDispatch use: APPROVED, PACKING_IN_PROGRESS, FORM_FAILED, PACKED, READY_TO_DISPATCH. For postDispatch use: PICKUP_COMPLETE, SHIPPED, DELIVERED, COMPLETED. For cancelled use: CANCELLED."),
    locationId: z.string().optional().describe("Filter by location/warehouse ID"),
    sku: z.array(z.string()).optional().describe("Filter by SKU IDs"),
    orderDateFrom: z.string().optional().describe("Order date range start (ISO date)"),
    orderDateTo: z.string().optional().describe("Order date range end (ISO date)"),
    dispatchByDateFrom: z.string().optional().describe("Dispatch by date range start"),
    dispatchByDateTo: z.string().optional().describe("Dispatch by date range end"),
    modifiedDateFrom: z.string().optional().describe("Modified date range start"),
    modifiedDateTo: z.string().optional().describe("Modified date range end"),
    shipmentTypes: z.array(z.string()).optional().describe("Filter by shipment types: EXPRESS, NORMAL, SELF"),
    serviceProfiles: z.array(z.string()).optional().describe("Filter by service profiles: FBF, NON_FBF, FBF_LITE"),
  },
  async (params) => {
    try {
      const filter: any = { type: params.type, states: params.states };
      if (params.locationId) filter.locationId = params.locationId;
      if (params.sku) filter.sku = params.sku;
      if (params.orderDateFrom || params.orderDateTo) {
        filter.orderDate = { from: params.orderDateFrom, to: params.orderDateTo };
      }
      if (params.dispatchByDateFrom || params.dispatchByDateTo) {
        filter.dispatchByDate = { from: params.dispatchByDateFrom, to: params.dispatchByDateTo };
      }
      if (params.modifiedDateFrom || params.modifiedDateTo) {
        filter.modifiedDate = { from: params.modifiedDateFrom, to: params.modifiedDateTo };
      }
      if (params.shipmentTypes) filter.shipmentTypes = params.shipmentTypes;
      if (params.serviceProfiles) filter.serviceProfiles = params.serviceProfiles;
      const result = await client.searchShipments(filter);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "search_shipments_paginate",
  "Fetch the next page of shipment search results using the nextPageUrl from a previous search_shipments response.",
  {
    nextPageUrl: z.string().describe("The nextPageUrl from a previous search response"),
  },
  async (params) => {
    try {
      const result = await client.searchShipmentsPaginate(params.nextPageUrl);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "get_order_details",
  "Get order details for given shipment IDs, order item IDs, or order IDs. Only one type of ID can be used per request. Maximum 100 IDs allowed.",
  {
    shipmentIds: z.string().optional().describe("Comma-separated shipment IDs (max 100)"),
    orderItemIds: z.string().optional().describe("Comma-separated order item IDs (max 100)"),
    orderIds: z.string().optional().describe("Comma-separated order IDs (max 100)"),
  },
  async (params) => {
    try {
      const result = await client.getOrderDetails(params);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "trigger_label_generation",
  "Trigger the generation of invoice and shipping labels for shipments. This marks shipments as PACKED. Maximum 25 shipment IDs per request.",
  {
    shipmentIds: z.array(z.string()).describe("Array of shipment IDs to generate labels for (max 25)"),
  },
  async (params) => {
    try {
      const result = await client.triggerLabelGeneration(params.shipmentIds);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "download_labels_and_invoices",
  "Download labels and invoices in PDF format for shipments. Returns a link or binary content.",
  {
    shipmentIds: z.string().describe("Comma-separated shipment IDs"),
  },
  async (params) => {
    try {
      const result = await client.downloadLabelsAndInvoices(params.shipmentIds);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "download_labels_only",
  "Download only the shipping labels (without invoices) in PDF format for shipments.",
  {
    shipmentIds: z.string().describe("Comma-separated shipment IDs"),
  },
  async (params) => {
    try {
      const result = await client.downloadLabelsOnly(params.shipmentIds);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "download_invoice",
  "Download invoice PDF for shipments. Labels and invoices must have been generated before using this.",
  {
    shipmentIds: z.string().describe("Comma-separated shipment IDs"),
  },
  async (params) => {
    try {
      const result = await client.downloadInvoice(params.shipmentIds);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "mark_ready_for_dispatch",
  "Mark shipments as READY_TO_DISPATCH after labels and invoices have been generated and downloaded.",
  {
    shipmentIds: z.array(z.string()).describe("Array of shipment IDs to mark as ready for dispatch"),
  },
  async (params) => {
    try {
      const result = await client.markReadyForDispatch(params.shipmentIds);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "get_shipping_details",
  "Get shipping and tracking related details for shipments including delivery/billing address, tracking ID, buyer address, etc.",
  {
    shipmentIds: z.string().describe("Comma-separated shipment IDs"),
  },
  async (params) => {
    try {
      const result = await client.getShippingDetails(params.shipmentIds);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "cancel_order_items",
  "Cancel order items inside a shipment before marking them as PACKED.",
  {
    shipmentId: z.string().describe("The shipment ID containing the order items to cancel"),
    orderItemId: z.string().describe("The order item ID to cancel"),
    reason: z.string().describe("Reason for cancellation"),
  },
  async (params) => {
    try {
      const result = await client.cancelOrderItems(params.shipmentId, {
        orderItemId: params.orderItemId,
        reason: params.reason,
      });
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "get_handover_counts",
  "Get the count of shipments to be handed over to logistics partners (E-Kart or 3rd party vendors).",
  {
    locationId: z.string().optional().describe("Filter by location/warehouse ID"),
  },
  async (params) => {
    try {
      const result = await client.getHandoverCounts(params.locationId);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "download_manifest",
  "Download the manifest file in PDF format for the given shipments.",
  {
    shipmentIds: z.array(z.string()).describe("Array of shipment IDs"),
  },
  async (params) => {
    try {
      const result = await client.downloadManifest(params.shipmentIds);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "mark_self_ship_dispatched",
  "Mark self-ship order items as SHIPPED from the seller warehouse. Maximum 100 shipments per request.",
  {
    shipments: z.array(z.object({
      shipmentId: z.string().describe("Shipment ID"),
      trackingId: z.string().optional().describe("Tracking ID from logistics partner"),
      dispatchDate: z.string().optional().describe("Dispatch date"),
      logisticsPartnerId: z.string().optional().describe("Logistics partner ID"),
    })).describe("Array of shipment objects to mark as dispatched"),
  },
  async (params) => {
    try {
      const result = await client.markSelfShipDispatched(params.shipments);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "update_self_ship_delivery_date",
  "Update the delivery date for self-ship shipments. Maximum 100 shipments per request.",
  {
    shipments: z.array(z.object({
      shipmentId: z.string().describe("Shipment ID"),
      deliveryDate: z.string().describe("New delivery date"),
    })).describe("Array of shipments with updated delivery dates"),
  },
  async (params) => {
    try {
      const result = await client.updateSelfShipDeliveryDate(params.shipments);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "get_returns",
  "Get return OTCs (Order Tracking Codes) with optional date filters.",
  {
    source: z.string().optional().describe("Return source filter"),
    modifiedAfter: z.string().optional().describe("Filter returns modified after this date"),
    modifiedBefore: z.string().optional().describe("Filter returns modified before this date"),
    createdAfter: z.string().optional().describe("Filter returns created after this date"),
    createdBefore: z.string().optional().describe("Filter returns created before this date"),
  },
  async (params) => {
    try {
      const result = await client.getReturns(params);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "update_self_ship_tracking_id",
  "Update the tracking ID for self-ship shipments.",
  {
    shipments: z.array(z.object({
      shipmentId: z.string().describe("Shipment ID"),
      trackingId: z.string().describe("New tracking ID"),
    })).describe("Array of shipments with tracking IDs to update"),
  },
  async (params) => {
    try {
      const result = await client.updateSelfShipTrackingId(params.shipments);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "update_self_ship_delivery_attempt",
  "Update the delivery attempt with failure reason and new delivery date for self-ship shipments. Max 100 per request.",
  {
    shipments: z.array(z.object({
      shipmentId: z.string().describe("Shipment ID"),
      failureReason: z.string().optional().describe("Reason for delivery failure"),
      newDeliveryDate: z.string().optional().describe("New delivery date after failed attempt"),
    })).describe("Array of shipments with delivery attempt updates"),
  },
  async (params) => {
    try {
      const result = await client.updateSelfShipDeliveryAttempt(params.shipments);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "get_shipment_forms",
  "Get the forms associated with shipments (e.g., for customs or logistics).",
  {
    shipmentIds: z.string().describe("Comma-separated shipment IDs"),
  },
  async (params) => {
    try {
      const result = await client.getShipmentForms(params.shipmentIds);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "update_form_acknowledgement",
  "Update the acknowledgement number for form-failed shipments. Maximum 25 shipments per request.",
  {
    shipments: z.array(z.object({
      shipmentId: z.string().describe("Shipment ID"),
      acknowledgementNumber: z.string().describe("The acknowledgement number to set"),
    })).describe("Array of shipments with acknowledgement numbers"),
  },
  async (params) => {
    try {
      const result = await client.updateFormAcknowledgement(params.shipments);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

// ==================== LISTINGS V3 TOOLS ====================

server.tool(
  "update_listing_price",
  "Update the price (MRP and selling price) for one or more listings identified by SKU ID.",
  {
    listings: z.record(z.string(), z.object({
      product_id: z.string().describe("Flipkart product ID (FSN)"),
      price: z.object({
        mrp: z.number().describe("Maximum Retail Price"),
        selling_price: z.number().describe("Selling price (must be <= MRP)"),
        currency: z.string().default("INR").describe("Currency code (default: INR)"),
      }),
    })).describe("Object keyed by SKU ID with price update details"),
  },
  async (params) => {
    try {
      const result = await client.updateListingPrice(params.listings);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "update_listing_inventory",
  "Update the inventory count for one or more listings at specified warehouse locations.",
  {
    listings: z.record(z.string(), z.object({
      product_id: z.string().describe("Flipkart product ID (FSN)"),
      locations: z.array(z.object({
        id: z.string().describe("Location/warehouse ID"),
        inventory: z.number().describe("New inventory count"),
      })),
    })).describe("Object keyed by SKU ID with inventory update details"),
  },
  async (params) => {
    try {
      const result = await client.updateListingInventory(params.listings);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "get_listings",
  "Get listing information for one or more SKUs. Returns available listings, unavailable SKUs, and invalid SKUs.",
  {
    skuIds: z.string().describe("Comma-separated SKU IDs"),
  },
  async (params) => {
    try {
      const result = await client.getListingsForSKUs(params.skuIds);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "update_listing",
  "Update listing attributes for one or more SKUs. Supports updating product details, pricing, shipping, etc.",
  {
    listings: z.record(z.string(), z.unknown()).describe("Object keyed by SKU ID with UpdateListingRequest objects containing the fields to update"),
  },
  async (params) => {
    try {
      const result = await client.updateListing(params.listings);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "create_listing",
  "Create new product listings on Flipkart marketplace.",
  {
    listings: z.record(z.string(), z.unknown()).describe("Object keyed by SKU ID with listing creation data including product details, pricing, inventory, etc."),
  },
  async (params) => {
    try {
      const result = await client.createListing(params.listings);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "search_listings",
  "Search all seller listings with FSN and SKU in batches of 500. Filter by ACTIVE/INACTIVE status. Use page_id for pagination.",
  {
    listingStatus: z.enum(["ACTIVE", "INACTIVE"]).optional().describe("Filter by listing status (ACTIVE or INACTIVE). Omit to get all listings."),
    pageId: z.string().optional().describe("Page ID for pagination. Use null/omit for first page, then use next_page_id from response."),
  },
  async (params) => {
    try {
      const filters = params.listingStatus
        ? { listing_status: params.listingStatus }
        : undefined;
      const result = await client.searchListings(filters, params.pageId || null);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "get_listing_details",
  "Get detailed listing information for specific SKUs. Maximum 10 SKU IDs per request. This is a POST endpoint that accepts an array of SKU IDs.",
  {
    skuIds: z.array(z.string()).describe("Array of SKU IDs (max 10)"),
  },
  async (params) => {
    try {
      const result = await client.getListingDetails(params.skuIds);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "search_listings_and_products",
  "Search listings with product details. Returns up to 20 listings per batch with pagination support via batchNo.",
  {
    batchNo: z.number().default(0).describe("Batch number for pagination (start with 0)"),
    internalState: z.enum(["ACTIVE", "INACTIVE", "READY_FOR_ACTIVATION", "ARCHIVED", "INACTIVATED_BY_FLIPKART"]).describe("Filter by internal listing state"),
    searchText: z.string().optional().describe("Optional text to search/filter listings"),
  },
  async (params) => {
    try {
      const result = await client.searchListingsAndProducts(
        params.batchNo,
        params.internalState,
        params.searchText
      );
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

// ==================== REPORTS TOOLS ====================

server.tool(
  "trigger_report",
  "Trigger the generation of a specific type of report. Returns a report_id to track the report status.",
  {
    reportTypeIdentifier: z.string().describe("Report type identifier (e.g., 'settlement', 'orders', 'returns', etc.)"),
    parameters: z.record(z.string(), z.string()).describe("Report parameters such as warehouse_id, month, year, from_date, etc."),
    correlationId: z.string().optional().describe("Optional correlation ID (UUID). Auto-generated if not provided."),
  },
  async (params) => {
    try {
      const result = await client.triggerReport(
        params.reportTypeIdentifier,
        params.parameters,
        params.correlationId
      );
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

server.tool(
  "get_report_detail",
  "Get the status and download location of a previously triggered report. When status is COMPLETED, the location field contains the download URL.",
  {
    reportId: z.string().describe("The report ID returned by trigger_report"),
  },
  async (params) => {
    try {
      const result = await client.getReportDetail(params.reportId);
      return formatResponse(result);
    } catch (error) {
      return formatError(error);
    }
  }
);

// ==================== START SERVER ====================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Flipkart MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
