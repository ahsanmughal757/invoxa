# Invoice Template System Architecture

## Overview
The invoice template system implements a clean separation between data and presentation layers, allowing for multiple visual representations of the same invoice data. This architecture follows modern React/Next.js best practices with function-based components and follows a registry pattern for template management.

## Core Principles

1. **Separation of Concerns**: Data handling and presentation are completely separated
2. **Template Registry Pattern**: Centralized management of available templates
3. **Validation Layer**: Ensures data integrity before rendering
4. **Graceful Degradation**: Fallback mechanisms for missing or invalid data
5. **Extensibility**: Easy addition of new templates without modifying core logic

## Component Hierarchy

```
InvoicePreview (Main entry point)
├── TemplateRenderer (Registry dispatcher)
│   ├── Template Validation Layer
│   │   ├── validateInvoiceData()
│   │   └── validateClientData()
│   ├── Fallback Data Handlers
│   │   ├── getFallbackInvoice()
│   │   └── getFallbackClient()
│   └── Template Registry Map
│       ├── classic_business -> ClassicBusinessTemplate
│       ├── modern_clean -> ModernCleanTemplate
│       ├── minimal_monochrome -> MinimalMonochromeTemplate
│       ├── bold_creative -> BoldCreativeTemplate
│       ├── financial_detailed -> FinancialDetailedTemplate
│       └── default -> ClassicBusinessTemplate
├── TemplateSelector (UI for switching templates)
└── Individual Template Components (Pure presentation)
    ├── ClassicBusinessTemplate
    ├── ModernCleanTemplate
    ├── MinimalMonochromeTemplate
    ├── BoldCreativeTemplate
    └── FinancialDetailedTemplate
```

## Key Components

### Template Registry (`template-registry.tsx`)
- Maintains a mapping between template IDs and their corresponding React components
- Provides metadata for each template (name, description, category)
- Implements validation and fallback mechanisms
- Exports utility functions for template management

### Template Renderer (`template-registry.tsx`)
- Main component responsible for selecting and rendering the appropriate template
- Performs data validation and applies fallbacks when necessary
- Acts as an abstraction layer between the consumer and individual templates

### Individual Templates
- Pure presentation components that receive validated data
- Each template focuses solely on visual representation
- Follow consistent prop interfaces for predictable behavior
- Handle missing optional fields gracefully

### Template Selector (`template-selector.tsx`)
- UI component for allowing users to switch between templates
- Provides visual previews and descriptions of available templates
- Manages the state of the currently selected template

## Data Flow

1. `InvoicePreview` receives invoice, client, and organization data
2. Data is passed to `TemplateRenderer` along with the desired template ID
3. `TemplateRenderer` validates the data using validation helpers
4. If validation fails, fallback data is used instead
5. The appropriate template component is retrieved from the registry
6. The template component renders the validated/fallback data

## Validation & Fallback Strategy

The system implements a two-tier validation approach:

1. **Field-level validation**: Checks for existence of required fields
2. **Fallback data**: Provides default values when validation fails

This ensures that the UI never breaks due to missing data while maintaining a consistent user experience.

## Extending the System

To add a new template:

1. Create a new template component following the existing pattern
2. Import the new component in `template-registry.tsx`
3. Add the component to the `TEMPLATE_REGISTRY` map
4. Add metadata to the `TEMPLATE_METADATA` object
5. Update the `TemplateId` type with the new template ID

## Best Practices

- All templates must accept the same props interface
- Templates should not modify incoming data
- Conditional rendering should be used for optional fields
- Consistent styling approach across all templates
- Proper TypeScript typing for all components and props
- Accessibility considerations in all templates

## Error Handling

- Invalid data triggers fallback mechanisms
- Missing templates default to the classic business template
- All edge cases are handled gracefully without crashing the UI
- Console warnings are provided for debugging purposes