$ErrorActionPreference = "Stop"

$repoRoot = "D:\Office\True-Beauty-Anees"
$erdJsonPath = Join-Path $repoRoot "tools\\_erd_tables.json"
$outPath = Join-Path $repoRoot "backend\\docs\\openapi.yml"

function Yaml-Escape([string]$s) {
  if ($null -eq $s) { return "''" }
  if ($s -match "[:\\[\\]\\{\\}\\#\\&\\*\\!\\|\\>\\-\\?\\,\\@\\`\\n\\r\\t]" -or $s.Trim() -ne $s -or $s -match "^\\d+$") {
    $s = $s.Replace("'", "''")
    return "'" + $s + "'"
  }
  return $s
}

function Indent([int]$n) { return (" " * $n) }

function Write-Line([System.Text.StringBuilder]$sb, [int]$indent, [string]$line) {
  [void]$sb.Append((Indent $indent) + $line + "`n")
}

$erd = Get-Content -LiteralPath $erdJsonPath -Raw | ConvertFrom-Json
$tableByName = @{}
foreach ($t in $erd.tables) { $tableByName[$t.name] = $t }

# Endpoint inventory (validated earlier). Keep ordering stable.
$endpoints = @(
  @{ id=1; method="post"; path="/auth/register"; phase="Phase 0"; day="Day 1"; tags=@("Auth"); tables=@("User"); security=$false; summary="Register user"; },
  @{ id=2; method="post"; path="/auth/login"; phase="Phase 0"; day="Day 1"; tags=@("Auth"); tables=@("User"); security=$false; summary="Login user"; },
  @{ id=3; method="post"; path="/auth/logout"; phase="Phase 0"; day="Day 1"; tags=@("Auth"); tables=@("User"); security=$true; summary="Logout user"; },
  @{ id=4; method="post"; path="/auth/refresh-token"; phase="Phase 0"; day="Day 1"; tags=@("Auth"); tables=@("User"); security=$false; summary="Refresh token"; },
  @{ id=5; method="post"; path="/auth/forgot-password"; phase="Phase 0"; day="Day 1"; tags=@("Auth"); tables=@("User"); security=$false; summary="Forgot password"; },
  @{ id=6; method="post"; path="/auth/reset-password"; phase="Phase 0"; day="Day 1"; tags=@("Auth"); tables=@("User"); security=$false; summary="Reset password"; },

  @{ id=7; method="get"; path="/user/profile"; phase="Phase 0"; day="Day 1"; tags=@("User"); tables=@("User"); security=$true; summary="Get user profile"; },
  @{ id=8; method="put"; path="/user/profile"; phase="Phase 0"; day="Day 1"; tags=@("User"); tables=@("User"); security=$true; summary="Update user profile"; },
  @{ id=9; method="get"; path="/user/addresses"; phase="Phase 0"; day="Day 1"; tags=@("User"); tables=@("Address"); security=$true; summary="List user addresses"; },
  @{ id=10; method="post"; path="/user/addresses"; phase="Phase 0"; day="Day 1"; tags=@("User"); tables=@("Address"); security=$true; summary="Create user address"; },
  @{ id=11; method="put"; path="/user/addresses/{id}"; phase="Phase 0"; day="Day 1"; tags=@("User"); tables=@("Address"); security=$true; summary="Update user address"; },
  @{ id=12; method="delete"; path="/user/addresses/{id}"; phase="Phase 0"; day="Day 1"; tags=@("User"); tables=@("Address"); security=$true; summary="Delete user address"; },

  @{ id=13; method="post"; path="/super-admin/auth/login"; phase="Phase 2"; day="Day 4"; tags=@("Super Admin"); tables=@("super_admin"); security=$false; summary="Super admin login"; },
  @{ id=14; method="post"; path="/super-admin/auth/logout"; phase="Phase 2"; day="Day 4"; tags=@("Super Admin"); tables=@("super_admin"); security=$true; summary="Super admin logout"; },
  @{ id=15; method="get"; path="/super-admin/plans"; phase="Phase 2"; day="Day 4"; tags=@("Super Admin"); tables=@("subscription_plan"); security=$true; summary="List subscription plans"; },
  @{ id=16; method="post"; path="/super-admin/plans"; phase="Phase 2"; day="Day 4"; tags=@("Super Admin"); tables=@("subscription_plan"); security=$true; summary="Create subscription plan"; },
  @{ id=17; method="put"; path="/super-admin/plans/{id}"; phase="Phase 2"; day="Day 4"; tags=@("Super Admin"); tables=@("subscription_plan"); security=$true; summary="Update subscription plan"; },
  @{ id=18; method="delete"; path="/super-admin/plans/{id}"; phase="Phase 2"; day="Day 4"; tags=@("Super Admin"); tables=@("subscription_plan"); security=$true; summary="Delete subscription plan"; },
  @{ id=19; method="get"; path="/super-admin/addons"; phase="Phase 2"; day="Day 4"; tags=@("Super Admin"); tables=@("plan_addon"); security=$true; summary="List plan addons"; },
  @{ id=20; method="post"; path="/super-admin/addons"; phase="Phase 2"; day="Day 4"; tags=@("Super Admin"); tables=@("plan_addon"); security=$true; summary="Create plan addon"; },
  @{ id=21; method="put"; path="/super-admin/addons/{id}"; phase="Phase 2"; day="Day 4"; tags=@("Super Admin"); tables=@("plan_addon"); security=$true; summary="Update plan addon"; },
  @{ id=22; method="delete"; path="/super-admin/addons/{id}"; phase="Phase 2"; day="Day 4"; tags=@("Super Admin"); tables=@("plan_addon"); security=$true; summary="Delete plan addon"; },
  @{ id=23; method="get"; path="/super-admin/admins"; phase="Phase 2"; day="Day 4"; tags=@("Super Admin"); tables=@("Admin"); security=$true; summary="List admins"; },
  @{ id=24; method="get"; path="/super-admin/admins/{id}"; phase="Phase 2"; day="Day 4"; tags=@("Super Admin"); tables=@("Admin"); security=$true; summary="Get admin details"; },
  @{ id=25; method="put"; path="/super-admin/admins/{id}/status"; phase="Phase 2"; day="Day 4"; tags=@("Super Admin"); tables=@("Admin"); security=$true; summary="Update admin status"; },
  @{ id=26; method="get"; path="/super-admin/admins/{id}/kyc"; phase="Phase 2"; day="Day 4"; tags=@("Super Admin"); tables=@("admin_kyc_document"); security=$true; summary="List admin KYC documents"; },
  @{ id=27; method="put"; path="/super-admin/admins/{id}/kyc/{docId}"; phase="Phase 2"; day="Day 4"; tags=@("Super Admin"); tables=@("admin_kyc_document"); security=$true; summary="Update admin KYC document status"; },

  @{ id=28; method="get"; path="/plans"; phase="Phase 0"; day="Day 1"; tags=@("Plans"); tables=@("subscription_plan"); security=$false; summary="List plans (public)"; },
  @{ id=29; method="get"; path="/plans/{id}/addons"; phase="Phase 0"; day="Day 1"; tags=@("Plans"); tables=@("plan_addon"); security=$false; summary="List addons for plan (public)"; },

  @{ id=30; method="post"; path="/admin/onboarding/start"; phase="Phase 2"; day="Day 3"; tags=@("Admin Onboarding"); tables=@("admin_onboarding_progress"); security=$true; summary="Start admin onboarding"; },
  @{ id=31; method="put"; path="/admin/onboarding/business-details"; phase="Phase 2"; day="Day 3"; tags=@("Admin Onboarding"); tables=@("Admin","admin_onboarding_progress"); security=$true; summary="Update business details"; },
  @{ id=32; method="put"; path="/admin/onboarding/addons"; phase="Phase 2"; day="Day 3"; tags=@("Admin Onboarding"); tables=@("admin_onboarding_progress"); security=$true; summary="Select addons"; },
  @{ id=33; method="post"; path="/admin/onboarding/documents"; phase="Phase 2"; day="Day 3"; tags=@("Admin Onboarding"); tables=@("admin_kyc_document"); security=$true; summary="Upload onboarding documents"; },
  @{ id=34; method="post"; path="/admin/onboarding/payment"; phase="Phase 2"; day="Day 3"; tags=@("Admin Onboarding"); tables=@("admin_subscription","platform_payment","Admin"); security=$true; summary="Create subscription payment"; },
  @{ id=35; method="get"; path="/admin/onboarding/progress"; phase="Phase 2"; day="Day 3"; tags=@("Admin Onboarding"); tables=@("admin_onboarding_progress"); security=$true; summary="Get onboarding progress"; },

  @{ id=36; method="post"; path="/admin/auth/login"; phase="Phase 2"; day="Day 3"; tags=@("Admin Auth"); tables=@("Admin"); security=$false; summary="Admin login"; },
  @{ id=37; method="post"; path="/admin/auth/logout"; phase="Phase 2"; day="Day 3"; tags=@("Admin Auth"); tables=@("Admin"); security=$true; summary="Admin logout"; },
  @{ id=38; method="get"; path="/admin/profile"; phase="Phase 2"; day="Day 3"; tags=@("Admin"); tables=@("Admin"); security=$true; summary="Get admin profile"; },
  @{ id=39; method="put"; path="/admin/profile"; phase="Phase 2"; day="Day 3"; tags=@("Admin"); tables=@("Admin"); security=$true; summary="Update admin profile"; },
  @{ id=40; method="get"; path="/admin/theme"; phase="Phase 2"; day="Day 3"; tags=@("Themes"); tables=@("Admin_Theme"); security=$true; summary="Get admin theme"; },
  @{ id=41; method="put"; path="/admin/theme"; phase="Phase 2"; day="Day 3"; tags=@("Themes"); tables=@("Admin_Theme"); security=$true; summary="Update admin theme"; },
  @{ id=42; method="get"; path="/store/theme"; phase="Phase 4"; day="Day 6"; tags=@("Themes"); tables=@("Web_Theme"); security=$false; summary="Get store theme (public)"; note="Replaces slug-based route; uses admin_id query param." },

  @{ id=43; method="get"; path="/admin/products"; phase="Phase 2"; day="Day 4"; tags=@("Products"); tables=@("Product"); security=$true; summary="List products (admin)"; },
  @{ id=44; method="post"; path="/admin/products"; phase="Phase 2"; day="Day 4"; tags=@("Products"); tables=@("Product"); security=$true; summary="Create product"; },
  @{ id=45; method="get"; path="/admin/products/{id}"; phase="Phase 2"; day="Day 4"; tags=@("Products"); tables=@("Product"); security=$true; summary="Get product (admin)"; },
  @{ id=46; method="put"; path="/admin/products/{id}"; phase="Phase 2"; day="Day 4"; tags=@("Products"); tables=@("Product"); security=$true; summary="Update product"; },
  @{ id=47; method="delete"; path="/admin/products/{id}"; phase="Phase 2"; day="Day 4"; tags=@("Products"); tables=@("Product"); security=$true; summary="Delete product"; },
  @{ id=48; method="get"; path="/store/products"; phase="Phase 0"; day="Day 1"; tags=@("Store"); tables=@("Product"); security=$false; summary="List products (public)"; },
  @{ id=49; method="get"; path="/store/products/{id}"; phase="Phase 0"; day="Day 1"; tags=@("Store"); tables=@("Product"); security=$false; summary="Get product (public)"; },

  @{ id=50; method="get"; path="/admin/inventory"; phase="Phase 2"; day="Day 4"; tags=@("Inventory"); tables=@("Inventory"); security=$true; summary="List inventory"; },
  @{ id=51; method="post"; path="/admin/inventory"; phase="Phase 2"; day="Day 4"; tags=@("Inventory"); tables=@("Inventory"); security=$true; summary="Create inventory record"; },
  @{ id=52; method="put"; path="/admin/inventory/{id}"; phase="Phase 2"; day="Day 4"; tags=@("Inventory"); tables=@("Inventory"); security=$true; summary="Update inventory record"; },
  @{ id=53; method="post"; path="/admin/inventory/{id}/logs"; phase="Phase 2"; day="Day 4"; tags=@("Inventory"); tables=@("Inventory_Logs"); security=$true; summary="Add inventory log"; },
  @{ id=54; method="get"; path="/admin/inventory/{id}/logs"; phase="Phase 2"; day="Day 4"; tags=@("Inventory"); tables=@("Inventory_Logs"); security=$true; summary="List inventory logs"; },
  @{ id=55; method="get"; path="/admin/inventory/{id}/current-stock"; phase="Phase 2"; day="Day 4"; tags=@("Inventory"); tables=@("Inventory","Inventory_Logs"); security=$true; summary="Compute current stock"; },

  @{ id=56; method="get"; path="/admin/services"; phase="Phase 2"; day="Day 4"; tags=@("Services"); tables=@("My_Service"); security=$true; summary="List services (admin)"; },
  @{ id=57; method="post"; path="/admin/services"; phase="Phase 2"; day="Day 4"; tags=@("Services"); tables=@("My_Service"); security=$true; summary="Create service"; },
  @{ id=58; method="get"; path="/admin/services/{id}"; phase="Phase 2"; day="Day 4"; tags=@("Services"); tables=@("My_Service"); security=$true; summary="Get service (admin)"; },
  @{ id=59; method="put"; path="/admin/services/{id}"; phase="Phase 2"; day="Day 4"; tags=@("Services"); tables=@("My_Service"); security=$true; summary="Update service"; },
  @{ id=60; method="delete"; path="/admin/services/{id}"; phase="Phase 2"; day="Day 4"; tags=@("Services"); tables=@("My_Service"); security=$true; summary="Delete service"; },
  @{ id=61; method="get"; path="/store/services"; phase="Phase 0"; day="Day 1"; tags=@("Store"); tables=@("My_Service"); security=$false; summary="List services (public)"; },
  @{ id=62; method="get"; path="/store/services/{id}"; phase="Phase 0"; day="Day 1"; tags=@("Store"); tables=@("My_Service"); security=$false; summary="Get service (public)"; },

  @{ id=63; method="post"; path="/user/service-bookings"; phase="Phase 1"; day="Day 2"; tags=@("Bookings"); tables=@("service_booking"); security=$true; summary="Create service booking"; },
  @{ id=64; method="get"; path="/user/service-bookings"; phase="Phase 1"; day="Day 2"; tags=@("Bookings"); tables=@("service_booking"); security=$true; summary="List user service bookings"; },
  @{ id=65; method="get"; path="/user/service-bookings/{id}"; phase="Phase 1"; day="Day 2"; tags=@("Bookings"); tables=@("service_booking"); security=$true; summary="Get user service booking"; },
  @{ id=66; method="get"; path="/admin/service-bookings"; phase="Phase 2"; day="Day 4"; tags=@("Bookings"); tables=@("service_booking"); security=$true; summary="List admin service bookings"; },
  @{ id=67; method="put"; path="/admin/service-bookings/{id}/status"; phase="Phase 2"; day="Day 4"; tags=@("Bookings"); tables=@("service_booking"); security=$true; summary="Update booking status"; },

  @{ id=68; method="get"; path="/admin/coupons"; phase="Phase 2"; day="Day 4"; tags=@("Coupons"); tables=@("Coupon"); security=$true; summary="List coupons"; },
  @{ id=69; method="post"; path="/admin/coupons"; phase="Phase 2"; day="Day 4"; tags=@("Coupons"); tables=@("Coupon"); security=$true; summary="Create coupon"; },
  @{ id=70; method="put"; path="/admin/coupons/{id}"; phase="Phase 2"; day="Day 4"; tags=@("Coupons"); tables=@("Coupon"); security=$true; summary="Update coupon"; },
  @{ id=71; method="delete"; path="/admin/coupons/{id}"; phase="Phase 2"; day="Day 4"; tags=@("Coupons"); tables=@("Coupon"); security=$true; summary="Delete coupon"; },
  @{ id=72; method="post"; path="/user/coupons/validate"; phase="Phase 1"; day="Day 2"; tags=@("Coupons"); tables=@("Coupon"); security=$true; summary="Validate coupon"; },

  @{ id=73; method="get"; path="/user/cart"; phase="Phase 1"; day="Day 2"; tags=@("Cart"); tables=@("cart_Item"); security=$true; summary="Get cart"; },
  @{ id=74; method="post"; path="/user/cart/items"; phase="Phase 1"; day="Day 2"; tags=@("Cart"); tables=@("cart_Item"); security=$true; summary="Add cart item"; },
  @{ id=75; method="put"; path="/user/cart/items/{id}"; phase="Phase 1"; day="Day 2"; tags=@("Cart"); tables=@("cart_Item"); security=$true; summary="Update cart item"; },
  @{ id=76; method="delete"; path="/user/cart/items/{id}"; phase="Phase 1"; day="Day 2"; tags=@("Cart"); tables=@("cart_Item"); security=$true; summary="Remove cart item"; },
  @{ id=77; method="delete"; path="/user/cart"; phase="Phase 1"; day="Day 2"; tags=@("Cart"); tables=@("cart_Item"); security=$true; summary="Clear cart"; },

  @{ id=78; method="get"; path="/user/wishlist"; phase="Phase 1"; day="Day 2"; tags=@("Wishlist"); tables=@("wishList_Items"); security=$true; summary="Get wishlist"; },
  @{ id=79; method="post"; path="/user/wishlist"; phase="Phase 1"; day="Day 2"; tags=@("Wishlist"); tables=@("wishList_Items"); security=$true; summary="Add wishlist item"; },
  @{ id=80; method="delete"; path="/user/wishlist/{productId}"; phase="Phase 1"; day="Day 2"; tags=@("Wishlist"); tables=@("wishList_Items"); security=$true; summary="Remove wishlist item"; },

  @{ id=81; method="post"; path="/user/orders"; phase="Phase 1"; day="Day 2"; tags=@("Orders"); tables=@("Order","order_item"); security=$true; summary="Create order"; },
  @{ id=82; method="get"; path="/user/orders"; phase="Phase 1"; day="Day 2"; tags=@("Orders"); tables=@("Order","order_item"); security=$true; summary="List user orders"; },
  @{ id=83; method="get"; path="/user/orders/{id}"; phase="Phase 1"; day="Day 2"; tags=@("Orders"); tables=@("Order","order_item"); security=$true; summary="Get user order"; },
  @{ id=84; method="get"; path="/admin/orders"; phase="Phase 2"; day="Day 4"; tags=@("Orders"); tables=@("Order","order_item"); security=$true; summary="List orders (admin)"; },
  @{ id=85; method="get"; path="/admin/orders/{id}"; phase="Phase 2"; day="Day 4"; tags=@("Orders"); tables=@("Order","order_item"); security=$true; summary="Get order (admin)"; },
  @{ id=86; method="put"; path="/admin/orders/{id}/status"; phase="Phase 2"; day="Day 4"; tags=@("Orders"); tables=@("Order"); security=$true; summary="Update order status"; },

  @{ id=87; method="post"; path="/payment/initiate"; phase="Phase 1"; day="Day 2"; tags=@("Payments"); tables=@("Payment"); security=$true; summary="Initiate payment"; },
  @{ id=88; method="post"; path="/payment/webhook"; phase="Phase 1"; day="Day 2"; tags=@("Payments"); tables=@("Payment","Order"); security=$false; summary="Payment webhook"; },
  @{ id=89; method="get"; path="/user/payments/{id}"; phase="Phase 1"; day="Day 2"; tags=@("Payments"); tables=@("Payment"); security=$true; summary="Get payment"; },
  @{ id=90; method="get"; path="/admin/orders/{id}/order-total"; phase="Phase 2"; day="Day 4"; tags=@("Orders"); tables=@("Order"); security=$true; summary="Compute order total"; },

  @{ id=91; method="post"; path="/user/returns"; phase="Phase 3"; day="Day 5"; tags=@("Returns"); tables=@("return_request"); security=$true; summary="Create return request"; },
  @{ id=92; method="get"; path="/user/returns"; phase="Phase 3"; day="Day 5"; tags=@("Returns"); tables=@("return_request"); security=$true; summary="List return requests (user)"; },
  @{ id=93; method="get"; path="/user/returns/{id}"; phase="Phase 3"; day="Day 5"; tags=@("Returns"); tables=@("return_request"); security=$true; summary="Get return request (user)"; },
  @{ id=94; method="get"; path="/admin/returns"; phase="Phase 3"; day="Day 5"; tags=@("Returns"); tables=@("return_request"); security=$true; summary="List return requests (admin)"; },
  @{ id=95; method="put"; path="/admin/returns/{id}/status"; phase="Phase 3"; day="Day 5"; tags=@("Returns"); tables=@("return_request","return_timeline"); security=$true; summary="Update return status"; },
  @{ id=96; method="get"; path="/admin/returns/{id}/timeline"; phase="Phase 3"; day="Day 5"; tags=@("Returns"); tables=@("return_timeline"); security=$true; summary="Get return timeline"; },

  @{ id=97; method="post"; path="/user/exchanges"; phase="Phase 3"; day="Day 5"; tags=@("Exchanges"); tables=@("exchange_request"); security=$true; summary="Create exchange request"; },
  @{ id=98; method="get"; path="/user/exchanges"; phase="Phase 3"; day="Day 5"; tags=@("Exchanges"); tables=@("exchange_request"); security=$true; summary="List exchange requests (user)"; },
  @{ id=99; method="get"; path="/user/exchanges/{id}"; phase="Phase 3"; day="Day 5"; tags=@("Exchanges"); tables=@("exchange_request"); security=$true; summary="Get exchange request (user)"; },
  @{ id=100; method="get"; path="/admin/exchanges"; phase="Phase 3"; day="Day 5"; tags=@("Exchanges"); tables=@("exchange_request"); security=$true; summary="List exchange requests (admin)"; },
  @{ id=101; method="put"; path="/admin/exchanges/{id}/status"; phase="Phase 3"; day="Day 5"; tags=@("Exchanges"); tables=@("exchange_request","exchange_timeline"); security=$true; summary="Update exchange status"; },
  @{ id=102; method="get"; path="/admin/exchanges/{id}/timeline"; phase="Phase 3"; day="Day 5"; tags=@("Exchanges"); tables=@("exchange_timeline"); security=$true; summary="Get exchange timeline"; },

  @{ id=103; method="get"; path="/admin/refunds/{returnId}"; phase="Phase 3"; day="Day 5"; tags=@("Refunds"); tables=@("refund_details"); security=$true; summary="Get refund details by return"; },
  @{ id=104; method="put"; path="/admin/refunds/{id}/process"; phase="Phase 3"; day="Day 5"; tags=@("Refunds"); tables=@("refund_details","refund_audit_log"); security=$true; summary="Process refund"; },
  @{ id=105; method="get"; path="/admin/refunds/{id}/audit"; phase="Phase 3"; day="Day 5"; tags=@("Refunds"); tables=@("refund_audit_log"); security=$true; summary="Get refund audit"; },

  @{ id=106; method="post"; path="/user/reviews"; phase="Phase 3"; day="Day 5"; tags=@("Reviews"); tables=@("Review_Rating"); security=$true; summary="Create review"; },
  @{ id=107; method="get"; path="/store/products/{id}/reviews"; phase="Phase 3"; day="Day 5"; tags=@("Reviews"); tables=@("Review_Rating"); security=$false; summary="List product reviews"; },
  @{ id=108; method="get"; path="/admin/reviews"; phase="Phase 3"; day="Day 5"; tags=@("Reviews"); tables=@("Review_Rating"); security=$true; summary="List reviews (admin)"; },
  @{ id=109; method="put"; path="/admin/reviews/{id}/status"; phase="Phase 3"; day="Day 5"; tags=@("Reviews"); tables=@("Review_Rating"); security=$true; summary="Moderate review status"; },
  @{ id=110; method="get"; path="/store/products/{id}/avg-rating"; phase="Phase 3"; day="Day 5"; tags=@("Reviews"); tables=@("Review_Rating"); security=$false; summary="Get product avg rating"; },

  @{ id=111; method="post"; path="/admin/notifications"; phase="Phase 3"; day="Day 5"; tags=@("Notifications"); tables=@("notification"); security=$true; summary="Create notification"; },
  @{ id=112; method="get"; path="/admin/notifications"; phase="Phase 3"; day="Day 5"; tags=@("Notifications"); tables=@("notification"); security=$true; summary="List notifications (admin)"; },
  @{ id=113; method="get"; path="/user/notifications"; phase="Phase 3"; day="Day 5"; tags=@("Notifications"); tables=@("user_notification","notification"); security=$true; summary="List user notifications"; },
  @{ id=114; method="put"; path="/user/notifications/{id}/read"; phase="Phase 3"; day="Day 5"; tags=@("Notifications"); tables=@("user_notification"); security=$true; summary="Mark notification read"; },
  @{ id=115; method="put"; path="/user/notifications/read-all"; phase="Phase 3"; day="Day 5"; tags=@("Notifications"); tables=@("user_notification"); security=$true; summary="Mark all notifications read"; },

  @{ id=116; method="post"; path="/user/affiliate/apply"; phase="Phase 4"; day="Day 6"; tags=@("Affiliate"); tables=@("Affiliate_profile"); security=$true; summary="Apply as affiliate"; },
  @{ id=117; method="get"; path="/user/affiliate/profile"; phase="Phase 4"; day="Day 6"; tags=@("Affiliate"); tables=@("Affiliate_profile"); security=$true; summary="Get affiliate profile"; },
  @{ id=118; method="get"; path="/user/affiliate/earnings"; phase="Phase 4"; day="Day 6"; tags=@("Affiliate"); tables=@("Affiliate_earning"); security=$true; summary="List affiliate earnings"; },
  @{ id=119; method="get"; path="/user/affiliate/referrals"; phase="Phase 4"; day="Day 6"; tags=@("Affiliate"); tables=@("affiliate_referral_tracking"); security=$true; summary="List affiliate referrals"; },
  @{ id=120; method="post"; path="/user/kyc/documents"; phase="Phase 4"; day="Day 6"; tags=@("KYC"); tables=@("KYC_Document"); security=$true; summary="Upload KYC document"; },
  @{ id=121; method="get"; path="/user/kyc/status"; phase="Phase 4"; day="Day 6"; tags=@("KYC"); tables=@("KYC_Document"); security=$true; summary="Get KYC status"; },
  @{ id=122; method="post"; path="/user/affiliate/withdrawals"; phase="Phase 4"; day="Day 6"; tags=@("Affiliate"); tables=@("withdrawal_request"); security=$true; summary="Create withdrawal request"; },
  @{ id=123; method="get"; path="/user/affiliate/withdrawals"; phase="Phase 4"; day="Day 6"; tags=@("Affiliate"); tables=@("withdrawal_request"); security=$true; summary="List withdrawals (user)"; },
  @{ id=124; method="get"; path="/admin/affiliate/withdrawals"; phase="Phase 4"; day="Day 6"; tags=@("Affiliate"); tables=@("withdrawal_request"); security=$true; summary="List withdrawals (admin)"; },
  @{ id=125; method="put"; path="/admin/affiliate/withdrawals/{id}/status"; phase="Phase 4"; day="Day 6"; tags=@("Affiliate"); tables=@("withdrawal_request","withdrawal_audit"); security=$true; summary="Update withdrawal status"; },
  @{ id=126; method="get"; path="/user/affiliate/available-balance"; phase="Phase 4"; day="Day 6"; tags=@("Affiliate"); tables=@("Affiliate_profile","Affiliate_earning","withdrawal_request"); security=$true; summary="Compute available balance"; },

  @{ id=127; method="get"; path="/admin/social-media"; phase="Phase 4"; day="Day 6"; tags=@("Social Media"); tables=@("social_media_manage"); security=$true; summary="List social media links"; },
  @{ id=128; method="post"; path="/admin/social-media"; phase="Phase 4"; day="Day 6"; tags=@("Social Media"); tables=@("social_media_manage"); security=$true; summary="Create social media link"; },
  @{ id=129; method="put"; path="/admin/social-media/{id}"; phase="Phase 4"; day="Day 6"; tags=@("Social Media"); tables=@("social_media_manage"); security=$true; summary="Update social media link"; },
  @{ id=130; method="delete"; path="/admin/social-media/{id}"; phase="Phase 4"; day="Day 6"; tags=@("Social Media"); tables=@("social_media_manage"); security=$true; summary="Delete social media link"; }
)

function Schema-RefForTables([string[]]$tables) {
  if ($tables.Count -eq 1) { return "#/components/schemas/$($tables[0])" }
  return $null
}

function Build-RequestSchema([hashtable]$ep) {
  # Use the first table schema as base; document ids explicitly.
  $t = $ep.tables[0]
  return "#/components/schemas/$t"
}

function Build-ResponseSchema([hashtable]$ep) {
  # Prefer first table schema; multi-table endpoints return an envelope.
  if ($ep.tables.Count -eq 1) { return "#/components/schemas/$($ep.tables[0])" }
  return "#/components/schemas/ApiEnvelope"
}

$sb = New-Object System.Text.StringBuilder

Write-Line $sb 0 "openapi: 3.0.3"
Write-Line $sb 0 "info:"
Write-Line $sb 2 "title: True Beauty API"
Write-Line $sb 2 "version: 1.0.0"
Write-Line $sb 2 "description: |"
Write-Line $sb 4 "OpenAPI contract derived from `True_Beauty_ERD_final.drawio.xml` and the project endpoint inventory."
Write-Line $sb 4 "Each operation includes vendor extensions for phase/day priority and ERD table mapping."
Write-Line $sb 0 "servers:"
Write-Line $sb 2 "- url: http://localhost:3000"
Write-Line $sb 4 "description: Local development"

# Tags
$tagSet = New-Object System.Collections.Generic.HashSet[string]
foreach ($ep in $endpoints) { foreach ($tg in $ep.tags) { $tagSet.Add($tg) | Out-Null } }
$tags = $tagSet | Sort-Object
Write-Line $sb 0 "tags:"
foreach ($t in $tags) {
  Write-Line $sb 2 "- name: $(Yaml-Escape $t)"
  Write-Line $sb 4 "description: $(Yaml-Escape \"$t endpoints\")"
}

Write-Line $sb 0 "paths:"

# Group endpoints by path so we can emit multiple methods per path.
$byPath = @{}
foreach ($ep in $endpoints) {
  if (-not $byPath.ContainsKey($ep.path)) { $byPath[$ep.path] = @() }
  $byPath[$ep.path] += $ep
}

foreach ($path in ($byPath.Keys | Sort-Object)) {
  Write-Line $sb 2 "$(Yaml-Escape $path):"
  foreach ($ep in ($byPath[$path] | Sort-Object id)) {
    Write-Line $sb 4 "$($ep.method):"
    Write-Line $sb 6 "tags:"
    foreach ($tg in $ep.tags) { Write-Line $sb 8 "- $(Yaml-Escape $tg)" }
    Write-Line $sb 6 "summary: $(Yaml-Escape $ep.summary)"
    Write-Line $sb 6 "description: |"
    Write-Line $sb 8 "Priority: $($ep.phase) / $($ep.day)"
    if ($ep.ContainsKey("note")) { Write-Line $sb 8 "$($ep.note)" }
    Write-Line $sb 8 "ERD tables: $([string]::Join(', ', $ep.tables))"
    Write-Line $sb 8 "Shared IDs:"
    foreach ($tname in $ep.tables) {
      if ($tableByName.ContainsKey($tname)) {
        $cols = @($tableByName[$tname].columns) | Where-Object { $_ -ne $tname }
        $idCols = $cols | Where-Object { $_ -eq "id" -or $_ -like "*_id" }
        if ($idCols.Count -gt 0) {
          Write-Line $sb 10 "- ${tname}: $([string]::Join(', ', $idCols))"
        } else {
          Write-Line $sb 10 "- ${tname}: (no *_id columns detected)"
        }
      } else {
        Write-Line $sb 10 "- ${tname}: (table not found in extracted ERD list)"
      }
    }
    Write-Line $sb 6 "operationId: op_$($ep.id)_$($ep.method)"
    Write-Line $sb 6 "x-phase: $(Yaml-Escape $ep.phase)"
    Write-Line $sb 6 "x-day: $(Yaml-Escape $ep.day)"
    Write-Line $sb 6 "x-erd-tables:"
    foreach ($t in $ep.tables) { Write-Line $sb 8 "- $(Yaml-Escape $t)" }
    Write-Line $sb 6 "x-priority-order: $($ep.id)"

    if ($ep.security -eq $true) {
      Write-Line $sb 6 "security:"
      Write-Line $sb 8 "- bearerAuth: []"
    }

    # Path params
    $params = @()
    if ($path -match "{id}") { $params += @{ name="id"; in="path"; required=$true; schema="string" } }
    if ($path -match "{docId}") { $params += @{ name="docId"; in="path"; required=$true; schema="string" } }
    if ($path -match "{returnId}") { $params += @{ name="returnId"; in="path"; required=$true; schema="string" } }
    if ($path -match "{productId}") { $params += @{ name="productId"; in="path"; required=$true; schema="string" } }

    if ($params.Count -gt 0 -or $ep.path -eq "/store/theme") {
      Write-Line $sb 6 "parameters:"
      foreach ($p in $params) {
        Write-Line $sb 8 "- name: $(Yaml-Escape $p.name)"
        Write-Line $sb 10 "in: $(Yaml-Escape $p.in)"
        Write-Line $sb 10 "required: $($p.required.ToString().ToLower())"
        Write-Line $sb 10 "schema:"
        Write-Line $sb 12 "type: $(Yaml-Escape $p.schema)"
      }
      if ($ep.path -eq "/store/theme") {
        Write-Line $sb 8 "- name: admin_id"
        Write-Line $sb 10 "in: query"
        Write-Line $sb 10 "required: true"
        Write-Line $sb 10 "schema:"
        Write-Line $sb 12 "type: string"
        Write-Line $sb 10 "description: 'Store owner admin identifier. ERD has no slug.'"
      }
    }

    # Request body heuristic for write methods
    if (@("post","put","patch") -contains $ep.method) {
      Write-Line $sb 6 "requestBody:"
      Write-Line $sb 8 "required: true"
      Write-Line $sb 8 "content:"
      Write-Line $sb 10 "application/json:"
      Write-Line $sb 12 "schema:"
      $reqRef = Build-RequestSchema $ep
      Write-Line $sb 14 "`$ref: $(Yaml-Escape $reqRef)"
    }

    # Responses
    Write-Line $sb 6 "responses:"
    Write-Line $sb 8 "'200':"
    Write-Line $sb 10 "description: OK"
    Write-Line $sb 10 "content:"
    Write-Line $sb 12 "application/json:"
    Write-Line $sb 14 "schema:"
    $resRef = Build-ResponseSchema $ep
    Write-Line $sb 16 "`$ref: $(Yaml-Escape $resRef)"
  }
}

# Components
Write-Line $sb 0 "components:"
Write-Line $sb 2 "securitySchemes:"
Write-Line $sb 4 "bearerAuth:"
Write-Line $sb 6 "type: http"
Write-Line $sb 6 "scheme: bearer"
Write-Line $sb 6 "bearerFormat: JWT"

Write-Line $sb 2 "schemas:"

# Standard envelope
Write-Line $sb 4 "ApiEnvelope:"
Write-Line $sb 6 "type: object"
Write-Line $sb 6 "properties:"
Write-Line $sb 8 "success:"
Write-Line $sb 10 "type: boolean"
Write-Line $sb 8 "message:"
Write-Line $sb 10 "type: string"
Write-Line $sb 8 "data:"
Write-Line $sb 10 "type: object"

foreach ($t in ($erd.tables | Sort-Object { $_.name.ToLowerInvariant() })) {
  $name = $t.name
  $cols = @($t.columns) | Where-Object { $_ -ne $name }
  Write-Line $sb 4 "${name}:"
  Write-Line $sb 6 "type: object"
  Write-Line $sb 6 "description: $(Yaml-Escape \"ERD-derived schema for table $name\")"
  Write-Line $sb 6 "x-erd-columns:"
  foreach ($c in $cols) { Write-Line $sb 8 "- $(Yaml-Escape $c)" }
  Write-Line $sb 6 "properties:"
  foreach ($c in $cols) {
    Write-Line $sb 8 "${c}:"
    Write-Line $sb 10 "type: string"
    Write-Line $sb 10 "description: $(Yaml-Escape \"Maps to ERD column $name.$c\")"
  }
}

Set-Content -LiteralPath $outPath -Value $sb.ToString() -Encoding UTF8
Write-Host \"Wrote OpenAPI to $outPath\"

