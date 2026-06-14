# Invoice Template Validation Checklist

## Purpose
This checklist ensures all invoice templates render safely, handle missing data gracefully, and maintain extensibility for future templates.

## Safe Rendering Validation

### 1. Data Access Validation
- [ ] All property access uses optional chaining (`obj?.property`) or conditional checks
- [ ] Arrays are checked for existence and length before mapping
- [ ] Nested objects are validated before accessing deep properties
- [ ] Functions handle undefined/null values without throwing errors

### 2. Required Fields Validation
- [ ] Invoice has required fields: `id`, `number`, `client_id`, `issue_date`, `due_date`, `status`, `total`, `currency`
- [ ] Client has required fields: `id`, `name`
- [ ] Invoice items array exists and has items before mapping
- [ ] Organization data is checked before accessing properties

### 3. Conditional Rendering
- [ ] Optional fields like `invoice.tax_amount`, `client.phone`, `invoice.notes` are conditionally rendered
- [ ] Nested objects like `client.billing_address` are checked before rendering
- [ ] Images (e.g., logos) are conditionally rendered only if URL exists
- [ ] Sections with optional content are wrapped in conditional blocks

### 4. Formatting Function Safety
- [ ] `formatCurrency()` handles undefined currencies properly
- [ ] `formatDate()` handles invalid date strings gracefully
- [ ] Number formatting functions handle NaN and undefined values
- [ ] All utility functions have proper error handling

### 5. Template Switching Safety
- [ ] Template IDs are validated using `isValidTemplateId()` function
- [ ] Invalid template IDs gracefully fall back to default template
- [ ] Template registry contains all registered template IDs
- [ ] Default fallback template renders properly

### 6. Error Prevention
- [ ] No unhandled exceptions during rendering
- [ ] Proper fallback values for all potentially missing data
- [ ] Proper key props for mapped lists to prevent React warnings
- [ ] Safe date parsing to prevent invalid date errors

## Testing Scenarios

### 1. Minimal Data Scenario
- [ ] Template renders with only required invoice fields
- [ ] Template renders with only required client fields
- [ ] Template handles empty invoice items array
- [ ] Template displays meaningful fallback content

### 2. Missing Optional Data Scenario
- [ ] Template handles missing `invoice.tax_amount`
- [ ] Template handles missing `client.phone`
- [ ] Template handles missing `client.billing_address`
- [ ] Template handles missing `invoice.notes`

### 3. Invalid Data Scenario
- [ ] Template handles invalid date strings
- [ ] Template handles invalid currency codes
- [ ] Template handles NaN values in numeric fields
- [ ] Template handles null/undefined organization

### 4. Edge Cases
- [ ] Template handles empty strings appropriately
- [ ] Template handles zero values correctly
- [ ] Template handles very long text values without breaking layout
- [ ] Template handles large numbers without display issues

## Implementation Verification

### 1. Code Quality
- [ ] All templates use functional components (no class-based components)
- [ ] Templates follow the same interface: `{ invoice: Invoice, client: Client, organization: Organization | null }`
- [ ] Consistent use of utility functions across all templates
- [ ] Proper TypeScript typing throughout

### 2. Performance
- [ ] Efficient rendering with proper key props
- [ ] No unnecessary re-renders
- [ ] Optimized conditional rendering
- [ ] Proper memoization where applicable

### 3. Accessibility
- [ ] Semantic HTML elements used appropriately
- [ ] Sufficient color contrast
- [ ] Proper heading hierarchy
- [ ] Keyboard navigation support