// Template Registry Pattern Implementation
// Functional-component-based registry with string-based template IDs and safe fallback behavior

import { ReactElement, createElement, isValidElement } from 'react';

// Define the type for template components
export type TemplateComponent = (props: any) => ReactElement | null;

// Define the registry type
export interface TemplateRegistry {
  [key: string]: TemplateComponent;
}

// Default fallback template that renders nothing visibly
const DefaultFallbackTemplate = (): ReactElement | null => null;

/**
 * Creates a template registry with the provided templates
 * @param templates An object mapping template IDs to template components
 * @returns A function to get templates by ID
 */
export const createTemplateRegistry = (templates: TemplateRegistry) => {
  // Return a function that retrieves a template by ID
  return (templateId: string): TemplateComponent | null => {
    return templates[templateId] || null;
  };
};

/**
 * Switches between templates based on the provided ID with safe fallback behavior
 * This function provides deterministic template selection based on the template ID
 * @param templateId The ID of the template to use
 * @param registry The template registry to look up the template
 * @param fallbackTemplate A fallback template to use if the ID is not found
 * @returns The selected template component or fallback
 */
export const switchTemplate = (
  templateId: string,
  registry: (id: string) => TemplateComponent | null,
  fallbackTemplate?: TemplateComponent
): TemplateComponent | null => {
  try {
    // Ensure templateId is a string to guarantee deterministic behavior
    if (typeof templateId !== 'string') {
      console.warn(`Invalid template ID provided: ${templateId}. Expected string.`);
      return fallbackTemplate || DefaultFallbackTemplate;
    }
    
    const template = registry(templateId);
    
    if (template) {
      return template;
    }
    
    // Use provided fallback template if available
    if (fallbackTemplate) {
      return fallbackTemplate;
    }
    
    // Use default fallback template
    return DefaultFallbackTemplate;
  } catch (error) {
    console.warn(`Error retrieving template with ID "${templateId}":`, error);
    // Return default fallback template in case of error
    return DefaultFallbackTemplate;
  }
};

/**
 * Determines the template to use based on priority: custom template -> registered template -> fallback
 * @param templateId The ID of the template to use
 * @param customTemplate A custom template to use if provided (takes highest priority)
 * @param registry The template registry to look up the template
 * @param fallbackTemplate A fallback template to use if other options are not available
 * @returns The selected template component
 */
export const determineTemplate = (
  templateId: string,
  customTemplate?: TemplateComponent,
  registry?: (id: string) => TemplateComponent | null,
  fallbackTemplate?: TemplateComponent
): TemplateComponent | null => {
  // Priority 1: Custom template if provided
  if (customTemplate) {
    return customTemplate;
  }
  
  // Priority 2: Registered template if registry is provided
  if (registry) {
    return switchTemplate(templateId, registry, fallbackTemplate);
  }
  
  // Priority 3: Fallback template
  if (fallbackTemplate) {
    return fallbackTemplate;
  }
  
  // Default fallback
  return DefaultFallbackTemplate;
};

/**
 * Safely renders a template with error boundary behavior
 * @param templateId The ID of the template to render
 * @param registry The template registry to look up the template
 * @param props Props to pass to the template component
 * @param fallbackElement Element to render if template fails
 * @returns Rendered template or fallback element
 */
export const renderTemplate = (
  templateId: string,
  registry: (id: string) => TemplateComponent | null,
  props: any = {},
  fallbackElement?: ReactElement
): ReactElement | null => {
  try {
    // Check if the template exists in the registry before applying fallbacks
    const originalTemplate = registry(templateId);
    
    if (!originalTemplate) {
      return fallbackElement || null;
    }
    
    const TemplateComponent = originalTemplate;
    
    if (!TemplateComponent) {
      return fallbackElement || null;
    }
    
    // Validate the component before rendering
    if (typeof TemplateComponent !== 'function') {
      console.warn(`Template with ID "${templateId}" is not a valid function component`);
      return fallbackElement || null;
    }
    
    const renderedElement = TemplateComponent(props);
    
    // Validate the rendered element
    if (renderedElement === null || isValidElement(renderedElement)) {
      return renderedElement;
    }
    
    // If the result is neither null nor a valid element, return fallback
    console.warn(`Template with ID "${templateId}" did not return a valid React element`);
    return fallbackElement || null;
  } catch (error) {
    console.error(`Error rendering template with ID "${templateId}":`, error);
    return fallbackElement || null;
  }
};

/**
 * Validates if a template ID exists in the registry
 * @param templateId The ID to check
 * @param registry The template registry to check against
 * @returns Boolean indicating if the template exists
 */
export const hasTemplate = (
  templateId: string,
  registry: (id: string) => TemplateComponent | null
): boolean => {
  return !!registry(templateId);
};

/**
 * Gets all available template IDs from the registry
 * @param templates The template registry object
 * @returns Array of available template IDs
 */
export const getAvailableTemplates = (templates: TemplateRegistry): string[] => {
  return Object.keys(templates);
};

/**
 * Validates a template component to ensure it's a proper function component
 * @param template The template component to validate
 * @returns Boolean indicating if the template is valid
 */
export const isValidTemplate = (template: any): template is TemplateComponent => {
  return typeof template === 'function';
};

/**
 * Creates a safe wrapper around a template that catches rendering errors
 * @param template The template to wrap
 * @param fallbackElement Element to render if the template fails
 * @returns A wrapped template component that handles errors gracefully
 */
export const createSafeTemplateWrapper = (
  template: TemplateComponent,
  fallbackElement?: ReactElement
): TemplateComponent => {
  return (props: any) => {
    try {
      if (!isValidTemplate(template)) {
        console.error('Template is not a valid function component');
        return fallbackElement || null;
      }
      
      const result = template(props);
      
      if (result === null || isValidElement(result)) {
        return result;
      }
      
      console.error('Template did not return a valid React element');
      return fallbackElement || null;
    } catch (error) {
      console.error('Error in template component:', error);
      return fallbackElement || null;
    }
  };
};

/**
 * Combines multiple registries into a single registry with precedence
 * Later registries override earlier ones
 * @param registries Array of registries to combine
 * @returns Combined registry function
 */
export const combineRegistries = (...registries: TemplateRegistry[]): ((id: string) => TemplateComponent | null) => {
  // Merge registries with later ones taking precedence
  const combined: TemplateRegistry = {};
  
  for (const registry of registries) {
    try {
      Object.assign(combined, registry);
    } catch (error) {
      console.error('Error combining registries:', error);
    }
  }
  
  return createTemplateRegistry(combined);
};