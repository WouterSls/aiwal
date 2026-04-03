---
name: specs-creator
description: Used to create new markdown specs in the specs folder. specs are specifications specifically written for an agent to analyze. Run everytime creating a new spec is prompted.
model: opus
---

# Specs Creator

Create a new markdown spec in the `.agents/specs/` folder.
A spec (specification) is a markdown file that describes multiple tasks that need to be done to implement a feature.
A spec is related to a JTBD (job to be done), meaning a feature that needs to implemented, a refactor that needs to be done, etc...

## Instructions

1. Prompt the user with what needs to be implemented.
2. Deduce from context what JTBD the spec will be related to.
3. Present findings about existing work to user. and do indepth interview with user to outline specifications
4. Create new specification file
5. Update `.agents/specs/OVERVIEW.md`

### Step 1. Prompt User

Load context of the codebase by studying OVERVIEW.md.
Use parallel sub-agents to analyze all linked specifications.
Once context is understood. Prompt user with what needs to be done.

### Step 2. Find related JTBD and study it.

Analyze user prompt and look if existing JTBD (job to be done) folder exsits in `specs`.
if the JTBD doens't yet exists. create it.

JTBD naming convetion: `specs/[JTBD]/specs.md`

If JTBD exists study existing specifications related to JTBD indepth.

### Step 3. Present findings and start interview

! IMPORTANT !
Always start an interview with user and ask follow up questions to make sure your understanding of the spec is correct and complete.

Present findings to user. start an indepth overview with the user to discover what exact requirements are for the specification.

We should figure out the following.

1. What are we implementing?
2. How do we implementent?
3. How do we validate implementation? (backpressure)

For the how, you should propose an implementation plan and work with the user to refine it.

### Step 4. Create the new specification file

Create the new specification file.

Spec naming convetion:

- `.agents/specs/[JTBD]/[SPECNAME].md`

A specification needs the following.

1. Overview
2. Purpose
3. Tasks

#### Overview

Specs are concise markdown documentation files stored in `.agents/specs/` . They serve as context hooks — pre-written
knowledge that agents load to quickly understand a part of the codebase without re-reading source files.

#### Purpose

• Provide structured, agent-friendly summaries of codebase components
• Max 500 words per spec for token efficiency

#### Tasks

Tasks are unit of work derived from comparing specs to code.
Specs also define the tasks that are required inorder for the spec to be done.

### Step 5. Update `.agents/specs/OVERVIEW.md`

The `OVERVIEW.md` file acts as a context hook. Giving an overview of all existing JTBD and specs that exists.

It also indicates the status of the spec, DONE or NOT DONE.

### Step 6. Validation

- [] User interviewed with questions
- [] [SPEC].md created in `.agents/specs/[JTBD]`.
