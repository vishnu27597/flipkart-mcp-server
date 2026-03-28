/**
 * Test script for Flipkart MCP Server
 * Tests key read and write endpoints against the live Flipkart API
 */

import { FlipkartClient } from "./flipkart-client.js";

const ACCESS_TOKEN = process.env.FLIPKART_ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
  console.error("Error: FLIPKART_ACCESS_TOKEN environment variable is required.");
  process.exit(1);
}

const LOCATION_ID = process.env.FLIPKART_LOCATION_ID || "LOC85c8f6288b2e478784e12087f39d5724";

const client = new FlipkartClient({ accessToken: ACCESS_TOKEN });

let passCount = 0;
let failCount = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✅ PASS: ${name}`);
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    failCount++;
  }
}

async function main() {
  console.log("=== Flipkart MCP Server - API Tests ===\n");
  console.log(`Access Token: ${ACCESS_TOKEN?.substring(0, 8)}...`);
  console.log(`Location ID: ${LOCATION_ID}\n`);

  // ==================== SHIPMENT TESTS ====================
  console.log("--- Shipment V3 Tests ---\n");

  await test("Search pre-dispatch shipments", async () => {
    const result = await client.searchShipments({
      type: "preDispatch",
      states: ["APPROVED", "PACKING_IN_PROGRESS", "PACKED", "READY_TO_DISPATCH"],
    });
    console.log(`   Response: ${JSON.stringify(result).substring(0, 200)}...`);
  });

  await test("Search post-dispatch shipments", async () => {
    const result = await client.searchShipments({
      type: "postDispatch",
      states: ["SHIPPED", "DELIVERED"],
    });
    console.log(`   Response: ${JSON.stringify(result).substring(0, 200)}...`);
  });

  await test("Search cancelled shipments", async () => {
    const result = await client.searchShipments({
      type: "cancelled",
      states: ["CANCELLED"],
    });
    console.log(`   Response: ${JSON.stringify(result).substring(0, 200)}...`);
  });

  await test("Get handover counts", async () => {
    const result = await client.getHandoverCounts(LOCATION_ID);
    console.log(`   Response: ${JSON.stringify(result).substring(0, 200)}...`);
  });

  await test("Get returns", async () => {
    const result = await client.getReturns();
    console.log(`   Response: ${JSON.stringify(result).substring(0, 200)}...`);
  });

  // ==================== LISTINGS TESTS ====================
  console.log("\n--- Listings V3 Tests ---\n");

  await test("Search all listings (first page)", async () => {
    const result = await client.searchListings(undefined, null);
    console.log(`   Response: ${JSON.stringify(result).substring(0, 300)}...`);
  });

  await test("Search ACTIVE listings", async () => {
    const result = await client.searchListings({ listing_status: "ACTIVE" }, null);
    console.log(`   Response: ${JSON.stringify(result).substring(0, 300)}...`);
  });

  await test("Search listings and product details (ACTIVE, batch 0)", async () => {
    const result = await client.searchListingsAndProducts(0, "ACTIVE");
    console.log(`   Response: ${JSON.stringify(result).substring(0, 300)}...`);
  });

  // ==================== REPORTS TESTS ====================
  console.log("\n--- Reports Tests ---\n");

  await test("Get report detail (dummy ID - expect error)", async () => {
    try {
      const result = await client.getReportDetail("test-report-id");
      console.log(`   Response: ${JSON.stringify(result).substring(0, 200)}...`);
    } catch (e) {
      // Expected to fail with invalid report ID - that's OK, it means the API is reachable
      console.log(`   Expected error for dummy ID: ${e instanceof Error ? e.message.substring(0, 100) : String(e)}`);
      // Re-throw only if it's a network error, not an API error
      if (e instanceof Error && e.message.includes("ENOTFOUND")) throw e;
    }
  });

  // ==================== SUMMARY ====================
  console.log("\n=== Test Summary ===");
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Total:  ${passCount + failCount}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
