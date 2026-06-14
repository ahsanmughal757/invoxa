# Prompt Formats for InvoicePro Application Development

This document contains general placeholder formats for common development tasks in the InvoicePro application.

## Template for Feature Implementation Requests

```
<system-reminder>
YOUR_ROLE: FULLSTACK DEVELOPER
TASK_CONTEXT: <Your-Instruction>
--- Content from referenced files ---
Content from @<file_path>:
<existing_code_content>
--- End of content ---
</system-reminder>

<Your-Instruction>
```

## Template for Code Enhancement Requests

```
<system-reminder>
PLAN MODE ACTIVE: The user indicated that they do not want you to execute yet -- you MUST NOT make any edits, run any non-readonly tools (including changing configs or making commits), or otherwise make any changes to the system. Instead, you should:
1. Answer the user's query comprehensively
2. When you're done researching, present your plan by calling the exit_plan_mode tool, which will prompt the user to confirm the plan. Do NOT make any file changes or run any tools that modify the system state in any way until the user has confirmed the plan.

YOUR_ROLE: FULLSTACK DEVELOPER
TASK_CONTEXT: <Your-Instruction>
--- Content from referenced files ---
Content from @<file_path>:
<existing_code_content>
--- End of content ---
</system-reminder>

<Your-Instruction>
```

## Template for Error Resolution Requests

```
<system-reminder>
YOUR_ROLE: FULLSTACK DEVELOPER
TASK_CONTEXT: <Your-Instruction>
--- Content from referenced files ---
Content from @<file_path>:
<existing_code_content>
--- End of content ---
</system-reminder>

ERROR_LOGS: 
<error_messages>

<Your-Instruction>
```

## Template for UI Implementation Requests

```
<system-reminder>
YOUR_ROLE: FULLSTACK DEVELOPER
TASK_CONTEXT: <Your-Instruction> 
--- Content from referenced files ---
Content from @<file_path>:
<existing_code_content>
--- End of content ---
</system-reminder>

REQUIREMENTS:
- <requirement_1>
- <requirement_2>
- <requirement_3>

CONSTRAINTS:
- <constraint_1>
- <constraint_2>

<Your-Instruction>
```

## Template for Database Query Enhancement Requests

```
<system-reminder>
YOUR_ROLE: FULLSTACK DEVELOPER
TASK_CONTEXT: <Your-Instruction>
--- Content from referenced files ---
Content from @<file_path>:
<existing_code_content>
Content from @<related_file_path>:
<related_code_content>
--- End of content ---
</system-reminder>

SCHEMA_INFO:
<table_schema_info>

FUNCTIONALITY_REQUIREMENTS:
- <functionality_1>
- <functionality_2>

PERFORMANCE_REQUIREMENTS:
- <performance_requirement_1>
- <performance_requirement_2>

<Your-Instruction>
```