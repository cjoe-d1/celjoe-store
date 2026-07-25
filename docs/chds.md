# Celjoe Hospitality Design System (CHDS) v1.0

CHDS is a reusable component library intended to power:

- Customer Store
- Smokehouse
- Customer Dashboard
- Admin Dashboard
- CMS
- Kitchen Display
- Delivery Dashboard
- Future mobile apps

This phase ships reusable UI components only. No pages are redesigned and no components are connected to Supabase.

## Usage

- Import from the CHDS barrel:
  - `import { Button, Card, Field, Modal } from "components/chds";`
- CHDS components use design tokens from `styles/tokens.css` and `styles/themes.css`.

## Component Inventory

### Buttons

- `Button`, `IconButton`, `ButtonGroup`, `SplitButton`

### Typography

- `Display`, `H1`, `H2`, `H3`, `H4`, `Body`, `Caption`, `Label`, `SectionTitle`, `EditorialQuote`, `KitchenNote`, `DashboardMetric`

### Layout

- `Container`, `Section`, `Grid`, `Stack`, `Cluster`, `SplitLayout`, `SidebarLayout`, `ContentWrapper`

### Cards

- `Card`, `CardHeader`, `CardBody`, `CardFooter`

### Forms

- `Field`, `FormSection`, `ValidationMessage`
- `TextInput`, `EmailInput`, `PasswordInput`, `PhoneInput`, `CurrencyInput`, `DateInput`, `TimeInput`
- `Textarea`, `Select`, `MultiSelect`, `Checkbox`, `Radio`
- `Toggle`, `OTPInput`

### Search

- `SearchBar`, `Autocomplete`, `SearchEmptyState`

### Navigation

- `Breadcrumbs`, `Tabs`, `Pagination`

### Product

- `PriceDisplay`, `PreparationTime`, `AvailabilityBadge`, `QuantitySelector`
- `ProductImage`, `ProductGallery`
- `VariantSelector`
- `ProductMeta`, `PerfectPairings`, `RelatedProductsShell`

### Category

- `CategoryTile`, `CategoryGrid`, `CategoryHero`, `CategoryNavigation`

### Cart

- `MiniCart`, `CartItem`, `QuantityControls`, `OrderSummary`, `PromoCode`, `CartDrawer`

### Checkout

- `CheckoutProgress`, `CheckoutStepCard`, `AddressCard`, `PaymentCard`, `DeliveryCard`, `OrderSummaryCard`, `SuccessSummary`

### Feedback

- `Alert`, `Banner`, `StatusIndicator`, `LoadingIndicator`, `ProgressBar`, `Skeleton`
- `toast` wrapper (`toast.show`, `toast.success`, `toast.error`)

### Overlays

- `Modal`, `Drawer`, `ConfirmationDialog`

### Tables

- `AdminTable`, `Table`, `TableHead`, `TableRow`, `TableHeaderCell`, `TableCell`, `SortableHeader`, `FilterRow`, `BulkActions`, `EmptyTable`

### Loading States

- `CardSkeleton`, `TableSkeleton`, `ProductCardSkeleton`, `FormSkeleton`

## Accessibility Notes

- All interactive components include focus-visible rings and keyboard-safe elements.
- Modal/Drawer use Headless UI Dialog for focus management and ARIA.
- Reduced motion is supported via Tailwind `motion-reduce:*` utilities in overlay transitions.

## Extension Points

- Add new themes by extending `[data-theme="..."]` blocks in `styles/themes.css`.
- Add new token groups in `styles/tokens.css` and reference via `var(--ds-*)`.

