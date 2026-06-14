# CLAUDE.md

Guidance for AI assistants (and humans) working in this repository.

## Project overview

**Ebike-3D-model-** is a repository for the 3D model of an e-bike (electric
bicycle). It is intended to hold the 3D source files, exported meshes, and any
supporting assets or tooling for the model.

> ⚠️ **Current state:** The repository is in its initial, near-empty state. At
> the time of writing it contains only `README.md` (the project title) and this
> `CLAUDE.md`. There is no source code, build system, asset pipeline, or test
> suite yet. The conventions below describe how the project *should* be
> organized as content is added — follow them when creating new files, and
> update this document as the real structure solidifies.

## Repository layout

Current:

```
.
├── README.md     # Project title / top-level description
└── CLAUDE.md     # This file — guidance for AI assistants
```

Recommended layout as the model grows (create directories as needed):

```
.
├── src/          # Editable 3D source files (.blend, .f3d, CAD project files)
├── models/       # Exported meshes for sharing/printing (.stl, .obj, .glb, .step)
├── textures/     # Materials, texture maps, and image assets
├── renders/      # Rendered images / preview screenshots
├── docs/         # Design notes, measurements, references
└── README.md
```

Keep large binary source files in `src/` and treat exported formats in
`models/` as build artifacts derived from them.

## Conventions

- **File naming:** lowercase with hyphens, descriptive and component-scoped —
  e.g. `frame-main.stl`, `motor-hub-rear.step`, `battery-pack.blend`.
- **One concern per file/component** where practical (frame, wheels, battery,
  motor, etc.) so parts can be revised independently.
- **Source vs. export:** Edit the source file (e.g. `.blend`, `.f3d`) and
  re-export the derived mesh; never hand-edit an exported `.stl`/`.obj` if a
  source exists.
- **Units:** Standardize on millimeters (mm) for all CAD/printing work and note
  the unit in `docs/` if a file deviates.
- **Document the tool:** When adding a source file, note which application and
  version produced it (Blender, Fusion 360, FreeCAD, etc.) in the commit
  message or `docs/`, since binary formats are tool- and version-specific.

## Git workflow

- Default branch: `main`.
- Active development branch for this work: `claude/claude-md-docs-2946pd`.
- Make focused commits with clear, descriptive messages.
- Do **not** open a pull request unless explicitly asked.
- 3D assets are binary and large. If the project accumulates many or large
  binaries, consider configuring [Git LFS](https://git-lfs.com/) and add a
  `.gitattributes` tracking the relevant extensions (`*.blend`, `*.stl`,
  `*.obj`, `*.glb`, `*.step`, `*.f3d`, image formats). Document this here once
  adopted.

## Build / test / run

There is currently **no** build, test, or run tooling. There are no commands to
execute. If an asset pipeline, validation, or rendering automation is added
later (e.g. a Blender headless export script or a mesh-validation check),
document the exact commands in this section.

## Notes for AI assistants

- This is a **3D-model / asset** repository, not a software application. Don't
  assume a package manager, framework, or test runner exists — verify before
  referencing build commands.
- Most meaningful content will be **binary 3D files** you cannot read or diff
  directly. Rely on file names, sizes, `docs/`, and commit history to reason
  about them; ask the user when a binary's contents matter.
- Keep this file in sync with reality. When real structure, tooling, or
  conventions land, update the relevant sections here in the same change.
