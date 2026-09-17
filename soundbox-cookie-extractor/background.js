// UMKM Soundbox Cookie Sync - Background Service Worker (Manifest V3)
// Replace with your production backend API URL
const BACKEND_API_URL = "https://aplikasi-sewa.com/api/save-cookies";

// Listen for updates in browser tabs
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Check if the user is on the target merchant dashboard and login is complete
  if (changeInfo.status === 'complete' && tab.url && (tab.url.includes('dashboard') || tab.url.includes('merchant') || tab.url.includes('transaksi'))) {
    let targetDomain = "";
    if (tab.url.includes("gobiz.co.id")) targetDomain = ".gobiz.co.id";
    if (tab.url.includes("danabisnis.id")) targetDomain = ".danabisnis.id";

    if (targetDomain) {
      try {
        // 1. Get all cookies for the authenticated domain
        const cookies = await chrome.cookies.getAll({ domain: targetDomain });
        
        // 2. Fetch the merchant ID from extension storage (set during onboarding)
        const storage = await chrome.storage.local.get(["merchantId"]);
        const merchantId = storage.merchantId || 1; 

        if (cookies && cookies.length > 0) {
          // 3. Send cookies automatically to your backend
          const response = await fetch(BACKEND_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              merchantId: merchantId,
              sessionCookies: cookies
            })
          });
          const result = await response.json();
          console.log(`[SUCCESS] Cookies synced automatically for Merchant #${merchantId}:`, result);
        }
      } catch (error) {
        console.error("Failed to sync cookies automatically:", error);
      }
    }
  }
});
