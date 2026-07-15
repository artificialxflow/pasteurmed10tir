# Flutter Handoff — پاستور پلاس

این سند نقشه انتقال از پیش‌نمای HTML (`app/`) به اپ Flutter اندروید است.

## Routes (HTML → Flutter)

| HTML Route | Flutter Route | Screen Widget |
|------------|---------------|---------------|
| `app/index.html` | `/` | `HomeScreen` |
| `app/medical.html` | `/medical` | `MedicalHubScreen` |
| `app/medical/specialty.html` | `/medical/specialties` | `MedicalSpecialtyListScreen` |
| `app/consultation.html` | `/consultation` | `ConsultationFormScreen` |
| `app/dental/index.html` | `/dental` | `DentalHubScreen` |
| `app/dental/general.html` | `/dental/doctors` | `DentistListScreen` |
| `app/dental/booking.html` | `/dental/booking` | `BookingFlowScreen` |
| `app/dental/confirm.html` | `/dental/confirm` | `PaymentConfirmScreen` |
| `app/dental/success.html` | `/dental/success` | `SuccessScreen` |
| `app/shop.html` | `/shop` | `ShopCustomerTypeScreen` |
| `app/shop-catalog.html` | `/shop/catalog` | `ShopCatalogScreen` |
| `app/shop-cart.html` | `/shop/cart` | `ShopCartScreen` |
| `app/shop-vip.html` | `/shop/vip` | `ShopVipScreen` |
| `app/shop-success.html` | `/shop/success` | `ShopOrderSuccessScreen` |
| `app/shop-facility.html` | `/shop/facility` | `ShopFacilityScreen` |
| `app/dental/membership.html` | `/dental/membership` | `MembershipScreen` |
| `app/club.html` | `/club` | `ClubScreen` |
| `app/nursing.html` | `/nursing` | `NursingScreen` |
| `app/contact.html` | `/contact` | `ContactScreen` |
| `app/partners.html` | `/partners` | `PartnerFormScreen` |
| `app/laser.html` | `/laser` | `LaserScreen` |
| `app/reminders.html` | `/reminders` | `RemindersScreen` |
| `app/dental/education.html` | `/dental/education` | `DentalEducationScreen` |

## Widget Mapping

| HTML Component | Flutter Widget |
|----------------|----------------|
| `.app-device` | `Scaffold` + `SafeArea` |
| `.app-bar` | `AppBar` |
| `.app-bottom-nav` | `NavigationBar` / `BottomNavigationBar` |
| `.app-tile` | `Card` + `InkWell` |
| `.app-hero` | `Container` with `BoxDecoration` gradient |
| `.app-snackbar` | `SnackBar` |
| `.form-input` | `TextFormField` |
| `.btn-primary` | `FilledButton` |

## ThemeData (from CSS tokens)

```dart
ThemeData(
  colorScheme: ColorScheme.fromSeed(seedColor: Color(0xFF0891B2)),
  fontFamily: 'Vazirmatn',
  useMaterial3: true,
)
```

## Bottom Navigation (۵ تب)

1. خانه → `/`
2. رزرو → `/dental/doctors`
3. تجهیزات → `/shop`
4. باشگاه → `/club`
5. مشاوره → `/consultation`

## Data Layer (فعلاً mock)

- `PASTEUR_DATA` → JSON assets + Repository
- `PasteurStorage` / localStorage → `shared_preferences` + API later

## APIهای مورد نیاز (نسخه نهایی)

- POST `/consultations`
- POST `/bookings`
- GET `/dentists`, `/products`
- POST `/shop/orders`
- GET/POST `/club/profile`
