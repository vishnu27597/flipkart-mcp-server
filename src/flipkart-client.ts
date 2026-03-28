import fetch from "node-fetch";

const BASE_URL = "https://api.flipkart.net/sellers";
const BASE_URL_ROOT = "https://api.flipkart.net";

export interface FlipkartConfig {
  accessToken: string;
}

export class FlipkartClient {
  private accessToken: string;

  constructor(config: FlipkartConfig) {
    this.accessToken = config.accessToken;
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  private async request(
    method: string,
    path: string,
    body?: unknown,
    customHeaders?: Record<string, string>,
    useRootBase?: boolean
  ): Promise<unknown> {
    const url = `${useRootBase ? BASE_URL_ROOT : BASE_URL}${path}`;
    const options: any = {
      method,
      headers: { ...this.headers, ...customHeaders },
    };
    if (body && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          `Flipkart API Error (${response.status}): ${JSON.stringify(data)}`
        );
      }
      return data;
    } else if (
      contentType.includes("application/pdf") ||
      contentType.includes("application/octet-stream")
    ) {
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Flipkart API Error (${response.status}): ${text}`);
      }
      return {
        type: "binary",
        contentType,
        message:
          "PDF/binary content returned. Use the direct URL to download.",
        status: response.status,
      };
    } else {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Flipkart API Error (${response.status}): ${text}`);
      }
      return { type: "text", content: text };
    }
  }

  // ==================== SHIPMENT V3 ====================

  async searchShipments(filter: {
    type: "preDispatch" | "postDispatch" | "cancelled";
    states?: string[];
    locationId?: string;
    sku?: string[];
    orderDate?: { from: string; to: string };
    dispatchAfterDate?: { from: string; to: string };
    dispatchByDate?: { from: string; to: string };
    modifiedDate?: { from: string; to: string };
    cancellationDate?: { from: string; to: string };
    cancellationType?: string;
    shipmentTypes?: string[];
    serviceProfiles?: string[];
    dispatchServiceTiers?: string[];
  }): Promise<unknown> {
    return this.request("POST", "/v3/shipments/filter", { filter });
  }

  async searchShipmentsPaginate(nextPageUrl: string): Promise<unknown> {
    const path = nextPageUrl.replace(BASE_URL, "");
    return this.request("GET", path);
  }

  async getOrderDetails(params: {
    shipmentIds?: string;
    orderItemIds?: string;
    orderIds?: string;
  }): Promise<unknown> {
    const queryParts: string[] = [];
    if (params.shipmentIds)
      queryParts.push(`shipmentIds=${params.shipmentIds}`);
    if (params.orderItemIds)
      queryParts.push(`orderItemIds=${params.orderItemIds}`);
    if (params.orderIds) queryParts.push(`orderIds=${params.orderIds}`);
    const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    return this.request("GET", `/v3/shipments${query}`);
  }

  async triggerLabelGeneration(shipmentIds: string[]): Promise<unknown> {
    return this.request("POST", "/v3/shipments/labels", { shipmentIds });
  }

  async downloadLabelsAndInvoices(shipmentIds: string): Promise<unknown> {
    return this.request("GET", `/v3/shipments/${shipmentIds}/labels`);
  }

  async downloadLabelsOnly(shipmentIds: string): Promise<unknown> {
    return this.request("GET", `/v3/shipments/${shipmentIds}/labelOnly`);
  }

  async downloadInvoice(shipmentIds: string): Promise<unknown> {
    return this.request("GET", `/v3/shipments/${shipmentIds}/invoices`);
  }

  async markReadyForDispatch(shipmentIds: string[]): Promise<unknown> {
    return this.request("POST", "/v3/shipments/dispatch", { shipmentIds });
  }

  async getShippingDetails(shipmentIds: string): Promise<unknown> {
    return this.request("GET", `/v3/shipments/${shipmentIds}/shipping`);
  }

  async cancelOrderItems(
    shipmentId: string,
    body: { orderItemId: string; reason: string }
  ): Promise<unknown> {
    return this.request("PUT", `/v3/shipments/${shipmentId}/cancel`, body);
  }

  async getHandoverCounts(locationId?: string): Promise<unknown> {
    const query = locationId ? `?locationId=${locationId}` : "";
    return this.request("GET", `/v3/shipments/handover/counts${query}`);
  }

  async downloadManifest(shipmentIds: string[]): Promise<unknown> {
    return this.request("POST", "/v3/shipments/manifest", { shipmentIds });
  }

  async markSelfShipDispatched(
    shipments: Array<{
      shipmentId: string;
      trackingId?: string;
      dispatchDate?: string;
      logisticsPartnerId?: string;
    }>
  ): Promise<unknown> {
    return this.request("POST", "/v3/shipments/selfShip/dispatch", {
      shipments,
    });
  }

  async updateSelfShipDeliveryDate(
    shipments: Array<{ shipmentId: string; deliveryDate: string }>
  ): Promise<unknown> {
    return this.request("POST", "/v3/shipments/selfShip/deliveryDate", {
      shipments,
    });
  }

  async getReturns(params?: {
    source?: string;
    modifiedAfter?: string;
    modifiedBefore?: string;
    createdAfter?: string;
    createdBefore?: string;
  }): Promise<unknown> {
    const queryParts: string[] = [];
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParts.push(`${key}=${encodeURIComponent(value)}`);
      });
    }
    const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    return this.request("GET", `/v3/returns${query}`);
  }

  async updateSelfShipTrackingId(
    shipments: Array<{ shipmentId: string; trackingId: string }>
  ): Promise<unknown> {
    return this.request("POST", "/v3/shipments/selfShip/trackingId", {
      shipments,
    });
  }

  async updateSelfShipDeliveryAttempt(
    shipments: Array<{
      shipmentId: string;
      failureReason?: string;
      newDeliveryDate?: string;
    }>
  ): Promise<unknown> {
    return this.request("POST", "/v3/shipments/selfShip/deliveryAttempt", {
      shipments,
    });
  }

  async getShipmentForms(shipmentIds: string): Promise<unknown> {
    return this.request("GET", `/v3/shipments/${shipmentIds}/forms`);
  }

  async updateFormAcknowledgement(
    body: Array<{ shipmentId: string; acknowledgementNumber: string }>
  ): Promise<unknown> {
    return this.request("POST", "/v3/shipments/forms/acknowledge", body);
  }

  // ==================== LISTINGS V3 ====================

  async updateListingPrice(
    listings: Record<
      string,
      {
        product_id: string;
        price: { mrp: number; selling_price: number; currency: string };
      }
    >
  ): Promise<unknown> {
    return this.request("POST", "/listings/v3/update/price", listings);
  }

  async updateListingInventory(
    listings: Record<
      string,
      {
        product_id: string;
        locations: Array<{ id: string; inventory: number }>;
      }
    >
  ): Promise<unknown> {
    return this.request("POST", "/listings/v3/update/inventory", listings);
  }

  async getListingsForSKUs(skuIds: string): Promise<unknown> {
    return this.request("GET", `/listings/v3/${skuIds}`);
  }

  async updateListing(listings: Record<string, unknown>): Promise<unknown> {
    return this.request("POST", "/listings/v3/update", listings);
  }

  async createListing(listings: Record<string, unknown>): Promise<unknown> {
    return this.request("POST", "/listings/v3", listings);
  }

  async searchListings(
    filters?: { listing_status?: string },
    pageId?: string | null
  ): Promise<unknown> {
    return this.request("POST", "/listings/v3/search", {
      filters: filters || {},
      page_id: pageId || null,
    });
  }

  async getListingDetails(skuIds: string[]): Promise<unknown> {
    return this.request("POST", "/listings/v3/details", {
      sku_ids: skuIds,
    });
  }

  async searchListingsAndProducts(
    batchNo: number,
    internalState: string,
    searchText?: string
  ): Promise<unknown> {
    return this.request("POST", "/listings/v3/product/search", {
      batchNo,
      internalState,
      searchText: searchText || "",
    }, undefined, true);
  }

  // ==================== REPORTS ====================

  async triggerReport(
    reportTypeIdentifier: string,
    parameters: Record<string, string>,
    correlationId?: string
  ): Promise<unknown> {
    return this.request("POST", `/reports/${reportTypeIdentifier}`, {
      correlation_id:
        correlationId || crypto.randomUUID?.() || `${Date.now()}`,
      parameters,
    });
  }

  async getReportDetail(reportId: string): Promise<unknown> {
    return this.request("GET", `/reports/${reportId}/detail`);
  }
}
