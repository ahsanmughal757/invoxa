# Invoice Template Validation Tools and Utilities

## Purpose
This document describes the validation tools and utilities that ensure invoice templates render safely and handle missing data gracefully.

## Core Validation Utilities

### 1. Template Registry Validation
The template registry provides several validation utilities:

#### Template ID Validation
```typescript
export const isValidTemplateId = (id: string): id is TemplateId => {
  return id in TEMPLATE_REGISTRY;
};
```
- Validates that a template ID exists in the registry
- Returns a type guard to ensure type safety
- Prevents invalid template selections

#### Data Validation Helpers
```typescript
const validateInvoiceData = (invoice: Invoice): boolean => {
  // Check if the invoice has the minimum required fields
  return !!(
    invoice.id &&
    invoice.number &&
    invoice.client_id &&
    invoice.issue_date &&
    invoice.due_date &&
    invoice.status &&
    invoice.total !== undefined &&
    invoice.currency &&
    Array.isArray(invoice.invoice_items) &&
    invoice.invoice_items.length > 0
  );
};

const validateClientData = (client: Client): boolean => {
  // Check if the client has the minimum required fields
  return !!(
    client.id &&
    client.name
  );
};
```
- Validates that required data exists before rendering
- Ensures templates receive valid data structures
- Triggers fallback mechanisms when validation fails

### 2. Fallback Data Generators
```typescript
const getFallbackInvoice = (): Invoice => ({
  id: 'fallback',
  org_id: 'fallback',
  client_id: 'fallback',
  number: 'N/A',
  issue_date: new Date().toISOString(),
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'draft',
  subtotal: 0,
  total: 0,
  currency: 'USD',
  invoice_items: [{
    id: 'fallback-item',
    invoice_id: 'fallback',
    description: 'No items available',
    qty: 0,
    unit_price: 0,
    line_total: 0,
  }],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const getFallbackClient = (): Client => ({
  id: 'fallback',
  org_id: 'fallback',
  name: 'Unknown Client',
  email: 'unknown@example.com',
  billing_address: {
    street: 'N/A',
    city: 'N/A',
    state: 'N/A',
    postal_code: 'N/A',
    country: 'N/A',
  },
  created_at: new Date().toISOString(),
});
```
- Provides safe fallback data when validation fails
- Ensures templates always have valid data to render
- Maintains consistent user experience even with missing data

## Template Renderer Validation

### 1. Safe Template Rendering
The `TemplateRenderer` component implements multiple validation layers:

```typescript
export const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  templateId = 'default',
  invoice,
  client,
  organization,
}) => {
  // Validate required data and use fallbacks if needed
  const validInvoice = validateInvoiceData(invoice) ? invoice : getFallbackInvoice();
  const validClient = validateClientData(client) ? client : getFallbackClient();

  // Get the template component from the registry
  const TemplateComponent = TEMPLATE_REGISTRY[templateId] || TEMPLATE_REGISTRY.default;

  // Render the selected template with validated/fallback data
  return (
    <TemplateComponent
      invoice={validInvoice}
      client={validClient}
      organization={organization}
    />
  );
};
```

- Validates data before passing to templates
- Applies fallbacks automatically when validation fails
- Ensures template selection is valid

### 2. Template Metadata Validation
```typescript
export const TEMPLATE_METADATA = {
  classic_business: {
    id: 'classic_business' as TemplateId,
    name: 'Classic Business',
    description: 'Traditional corporate layout with clear tables and conservative styling',
    category: 'business',
  },
  // ... other templates
};
```
- Provides structured metadata for all templates
- Enables template selection UI with validation
- Supports categorization and filtering of templates

## Utility Functions

### 1. Format Currency Safely
```typescript
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}
```
- Handles currency formatting safely
- Provides default currency when none is specified
- Prevents formatting errors with invalid inputs

### 2. Format Date Safely
```typescript
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj)
}
```
- Safely handles both Date objects and date strings
- Converts strings to Date objects for consistent formatting
- Prevents errors with invalid date formats

## Validation Patterns in Templates

### 1. Conditional Rendering
All templates implement conditional rendering patterns:

```tsx
// Safe rendering of optional fields
{invoice.tax_amount && (
  <div className="flex justify-between py-2 px-4 bg-gray-100 border-b border-gray-400">
    <span className="text-gray-700 font-medium text-sm">Tax ({invoice.tax_rate || 0}%):</span>
    <span className="text-gray-900 font-medium text-sm">{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
  </div>
)}
```

### 2. Safe Property Access
Templates use optional chaining and nullish coalescing:

```tsx
// Safe access to nested properties
{client.billing_address?.street && `${client.billing_address.street}\n`}
{organization?.name || 'COMPANY NAME'}
```

### 3. Array Validation
Templates validate arrays before mapping:

```tsx
{invoice.invoice_items.map((item, index) => (
  <tr key={item.id || index}>
    {/* template content */}
  </tr>
))}
```

## Testing Utilities

### 1. Sample Data for Testing
The template selection UI includes sample data for validation:

```typescript
const SAMPLE_INVOICE: Invoice = {
  id: 'sample',
  org_id: 'sample-org',
  client_id: 'sample-client',
  number: 'INV-001',
  issue_date: new Date().toISOString(),
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'draft',
  subtotal: 1000,
  total: 1000,
  currency: 'USD',
  invoice_items: [
    {
      id: 'item-1',
      invoice_id: 'sample',
      description: 'Web Development Services',
      qty: 10,
      unit_price: 100,
      line_total: 1000,
    }
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
```

### 2. Template Validation Function
```typescript
export const getAllTemplates = () => {
  return Object.values(TEMPLATE_METADATA).filter(
    template => template.id !== 'default' // Exclude the default fallback
  );
};
```
- Retrieves all available templates for validation
- Excludes the default fallback from the list
- Enables dynamic template discovery

## Validation Best Practices

### 1. Layered Validation Approach
- Validate at the data entry level
- Validate when passing data to components
- Validate within templates before rendering
- Provide fallbacks at each layer

### 2. Type Safety
- Use TypeScript interfaces for all data structures
- Implement type guards for runtime validation
- Leverage TypeScript's compile-time checks
- Maintain strict typing throughout the system

### 3. Error Boundaries
- Implement error boundaries around template rendering
- Catch and handle rendering errors gracefully
- Provide meaningful error messages to users
- Log errors for debugging and monitoring

## Performance Optimization

### 1. Memoization
- Memoize validation results when appropriate
- Cache fallback data to prevent recreation
- Optimize expensive validation operations

### 2. Lazy Loading
- Consider lazy loading templates for performance
- Load validation utilities only when needed
- Optimize bundle size for validation code

## Monitoring and Analytics

### 1. Validation Metrics
- Track validation failure rates
- Monitor fallback usage frequency
- Measure performance impact of validation
- Identify common validation issues

### 2. Error Reporting
- Log validation failures for debugging
- Report template rendering errors
- Track user impact of validation issues
- Generate alerts for critical validation failures

## Maintenance Guidelines

### 1. Regular Validation Review
- Periodically review validation logic for effectiveness
- Update validation rules as requirements change
- Refine fallback strategies based on usage patterns
- Optimize validation performance over time

### 2. Documentation Updates
- Keep validation utilities well-documented
- Update examples as new validation rules are added
- Maintain clear explanations for validation logic
- Document performance considerations

### 3. Testing Coverage
- Maintain comprehensive tests for all validation utilities
- Include edge cases in validation testing
- Regularly validate the validation system itself
- Test fallback mechanisms thoroughly